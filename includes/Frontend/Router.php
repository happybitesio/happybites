<?php
/**
 * Serves the React PWA build via rewrite rules.
 *
 * @package HappyBites
 */

namespace HappyBites\Frontend;

use HappyBites\Data\Options;
use HappyBites\Loader;

if (!defined('ABSPATH')) {
    exit;
}

final class Router
{
    private Loader $loader;

    public function __construct(Loader $loader)
    {
        $this->loader = $loader;
    }

    public function register(): void
    {
        $this->loader->add_action('init', $this, 'add_rewrite_rules');
        $this->loader->add_filter('query_vars', $this, 'add_query_vars');
        $this->loader->add_filter('redirect_canonical', $this, 'disable_canonical_redirect', 10, 2);
        $this->loader->add_action('template_redirect', $this, 'serve_pwa');
    }

    public static function activate(): void
    {
        add_rewrite_tag('%hb_next_app%', '1');
        add_rewrite_tag('%hb_next_path%', '.*');

        $slug = preg_quote(Options::menu_slug(), '/');

        add_rewrite_rule("^{$slug}/?$", 'index.php?hb_next_app=1', 'top');
        add_rewrite_rule("^{$slug}/(.*)$", 'index.php?hb_next_app=1&hb_next_path=$matches[1]', 'top');

        flush_rewrite_rules();
    }

    public static function deactivate(): void
    {
        flush_rewrite_rules();
    }

    public function add_rewrite_rules(): void
    {
        add_rewrite_tag('%hb_next_app%', '1');
        add_rewrite_tag('%hb_next_path%', '.*');

        $slug = preg_quote(Options::menu_slug(), '/');

        add_rewrite_rule("^{$slug}/?$", 'index.php?hb_next_app=1', 'top');
        add_rewrite_rule("^{$slug}/(.*)$", 'index.php?hb_next_app=1&hb_next_path=$matches[1]', 'top');
    }

    /**
     * @param array<int, string> $vars
     * @return array<int, string>
     */
    public function add_query_vars(array $vars): array
    {
        $vars[] = 'hb_next_app';
        $vars[] = 'hb_next_path';

        return $vars;
    }

    /**
     * @param string|false $redirect_url
     * @param string|false $requested_url
     * @return string|false
     */
    public function disable_canonical_redirect($redirect_url, $requested_url)
    {
        if (get_query_var('hb_next_app')) {
            return false;
        }

        $slug = preg_quote(Options::menu_slug(), '#');
        $paths = [
            wp_parse_url((string) $requested_url, PHP_URL_PATH),
            wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH),
        ];

        foreach ($paths as $path) {
            if (!is_string($path) || $path === '') {
                continue;
            }

            if (preg_match('#^/' . $slug . '/?$#', $path) === 1) {
                return false;
            }
        }

        return $redirect_url;
    }

    public function serve_pwa(): void
    {
        if (!get_query_var('hb_next_app')) {
            return;
        }

        $export_dir = $this->resolve_export_dir();
        $export_real = realpath($export_dir);

        if (!$export_real) {
            status_header(404);
            exit(esc_html__('PWA build folder not found. Run npm run build in the pwa/ directory.', 'happybites'));
        }

        $req = ltrim((string) get_query_var('hb_next_path', ''), '/');

        if ($req === '') {
            $menu_slug = Options::menu_slug();
            $request_path = wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
            $bare_path = '/' . $menu_slug;

            if (is_string($request_path) && $request_path === $bare_path) {
                wp_safe_redirect(home_url(trailingslashit($bare_path)), 301);
                exit;
            }

            $req = 'index.html';
        }

        if (preg_match('/\.[a-z0-9]+\/$/i', $req)) {
            $req = rtrim($req, '/');
        }

        $file_path = realpath($export_dir . '/' . $req);

        if ($file_path === false || strpos($file_path, $export_real) !== 0) {
            $file_path = $export_real . '/index.html';
        }

        if (is_dir($file_path)) {
            $file_path = rtrim($file_path, '/\\') . '/index.html';
        }

        if (!file_exists($file_path)) {
            $file_path = $export_real . '/index.html';
        }

        $ext = strtolower(pathinfo($file_path, PATHINFO_EXTENSION));
        $mimes = wp_get_mime_types();
        $mime = $mimes[$ext] ?? (function_exists('mime_content_type') ? mime_content_type($file_path) : 'application/octet-stream');

        if (strpos($file_path, $export_real . '/assets/') !== false) {
            header('Cache-Control: public, max-age=31536000, immutable');
        } else {
            header('Cache-Control: no-cache');
        }

        header('Content-Type: ' . $mime);

        if ($ext === 'html') {
            $html = file_get_contents($file_path);

            if ($html !== false) {
                echo $this->inject_runtime_config($html);
                exit;
            }
        }

        readfile($file_path);
        exit;
    }

    private function resolve_export_dir(): string
    {
        return HAPPYBITES_PLUGIN_PATH . 'public/pwa';
    }

    private function resolve_page_title(): string
    {
        $restaurant_info = get_option(Options::RESTAURANT_INFO, []);
        $title = isset($restaurant_info['title']) ? trim((string) $restaurant_info['title']) : '';

        if ($title !== '') {
            return $title;
        }

        $site_name = trim((string) get_bloginfo('name'));

        return $site_name !== '' ? $site_name : __('Menu', 'happybites');
    }

    private function inject_runtime_config(string $html): string
    {
        $restaurant_info = get_option(Options::RESTAURANT_INFO, []);
        $logo_url = isset($restaurant_info['logo_url']) ? (string) $restaurant_info['logo_url'] : '';
        $menu_slug = Options::menu_slug();
        $base_path = '/' . $menu_slug . '/';
        $page_title = esc_html($this->resolve_page_title());

        $html = preg_replace('/<title>.*?<\/title>/i', '<title>' . $page_title . '</title>', $html, 1) ?? $html;

        $config = [
            'menuUrl' => rest_url('happybites/v1/menu'),
            'reviewUrl' => rest_url('happybites/v1/review'),
            'restUrl' => rest_url(),
            'siteUrl' => home_url('/'),
            'basePath' => '/' . $menu_slug,
        ];

        if ($logo_url !== '') {
            $config['logo'] = $logo_url;
        }

        $base_tag = '<base href="' . esc_url(home_url($base_path)) . '">';
        $script = '<script>window.HAPPYBITES_CONFIG=' . wp_json_encode($config) . ';</script>';
        $injection = $base_tag . $script;

        if (strpos($html, '<head>') !== false) {
            return preg_replace('/<head>/', '<head>' . $injection, $html, 1) ?? ($injection . $html);
        }

        if (strpos($html, '</head>') !== false) {
            return str_replace('</head>', $injection . '</head>', $html);
        }

        return $injection . $html;
    }
}
