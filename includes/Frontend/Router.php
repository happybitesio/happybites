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

    private function inject_runtime_config(string $html): string
    {
        $restaurant_info = get_option(Options::RESTAURANT_INFO, []);
        $logo_url = isset($restaurant_info['logo_url']) ? (string) $restaurant_info['logo_url'] : '';

        $config = [
            'menuUrl' => rest_url('happybites/v1/menu'),
            'reviewUrl' => rest_url('happybites/v1/review'),
            'restUrl' => rest_url(),
            'siteUrl' => home_url('/'),
            'basePath' => '/' . Options::menu_slug(),
        ];

        if ($logo_url !== '') {
            $config['logo'] = $logo_url;
        }

        $script = '<script>window.HAPPYBITES_CONFIG=' . wp_json_encode($config) . ';</script>';

        if (strpos($html, '</head>') !== false) {
            return str_replace('</head>', $script . '</head>', $html);
        }

        return $script . $html;
    }
}
