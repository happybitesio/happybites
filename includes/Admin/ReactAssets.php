<?php
/**
 * Enqueues the React admin bundle in WordPress admin.
 *
 * @package HappyBites
 */

namespace HappyBites\Admin;

use HappyBites\Data\Options;
use HappyBites\Loader;

if (!defined('ABSPATH')) {
    exit;
}

final class ReactAssets
{
    private Loader $loader;

    public function __construct(Loader $loader)
    {
        $this->loader = $loader;
    }

    public function register(): void
    {
        $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue');
    }

    public function enqueue(string $hook): void
    {
        $page = $this->resolve_page($hook);

        if ($page === null) {
            return;
        }

        $manifest = $this->read_manifest();

        if ($manifest === null) {
            add_action('admin_notices', static function () {
                echo '<div class="notice notice-error"><p>'
                    . esc_html__('HappyBites admin build not found. Run npm run build in the admin-app/ directory.', 'happybites')
                    . '</p></div>';
            });
            return;
        }

        $entry = $this->find_entry($manifest);

        if ($entry === null) {
            return;
        }

        $base_url = HAPPYBITES_PLUGIN_URL . 'public/admin/';

        if (!empty($entry['css']) && is_array($entry['css'])) {
            foreach ($entry['css'] as $index => $css_file) {
                wp_enqueue_style(
                    'happybites-admin-app-' . $index,
                    $base_url . $css_file,
                    [],
                    HAPPYBITES_VERSION
                );
            }
        }

        wp_enqueue_script(
            'happybites-admin-app',
            $base_url . $entry['file'],
            [],
            HAPPYBITES_VERSION,
            true
        );

        add_filter('script_loader_tag', static function ($tag, $handle) {
            if ($handle !== 'happybites-admin-app') {
                return $tag;
            }

            if (strpos($tag, 'type=') === false) {
                $tag = str_replace('<script ', '<script type="module" ', $tag);
            }

            return $tag;
        }, 10, 2);

        wp_localize_script('happybites-admin-app', 'HAPPYBITES_ADMIN_CONFIG', $this->build_config($page));

        wp_enqueue_media();

        if ($page === 'settings') {
            wp_enqueue_editor();
        }
    }

    private function resolve_page(string $hook): ?string
    {
        // phpcs:disable WordPress.Security.NonceVerification.Recommended -- admin page slug is used only to enqueue assets.
        $page = isset($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : '';
        // phpcs:enable WordPress.Security.NonceVerification.Recommended

        $map = [
            'happybites' => 'dashboard',
            'happybites-manage-menu' => 'menu',
            'happybites-settings' => 'settings',
            'happybites-reviews' => 'reviews',
            'happybites-edit-product' => 'product-edit',
        ];

        return $map[$page] ?? null;
    }

    /**
     * @return array<string, mixed>
     */
    private function build_config(string $page): array
    {
        $config = [
            'restUrl' => esc_url_raw(rest_url('happybites/v1')),
            'nonce' => wp_create_nonce('wp_rest'),
            'adminUrl' => esc_url_raw(admin_url()),
            'page' => $page,
            'pluginVersion' => HAPPYBITES_VERSION,
            'locale' => determine_locale(),
            'settings' => [
                'default_currency' => get_option(Options::DEFAULT_CURRENCY, 'TRY'),
                'default_language' => get_option(Options::DEFAULT_LANGUAGE, 'en'),
                'languages' => array_values(Options::active_languages()),
            ],
            'media' => [
                'title' => __('Select or Upload Image', 'happybites'),
                'button' => __('Use this image', 'happybites'),
            ],
        ];

        if ($page === 'product-edit') {
            // phpcs:disable WordPress.Security.NonceVerification.Recommended -- product editor config is loaded on a capability-protected admin page.
            $product_id = isset($_GET['product_id']) ? absint(wp_unslash($_GET['product_id'])) : 0;
            $action = isset($_GET['action']) ? sanitize_key(wp_unslash($_GET['action'])) : 'edit';
            $category_id = isset($_GET['category_id']) ? absint(wp_unslash($_GET['category_id'])) : 0;
            // phpcs:enable WordPress.Security.NonceVerification.Recommended

            $config['productId'] = $product_id;
            $config['productAction'] = $action === 'new' ? 'new' : 'edit';
            $config['categoryId'] = $category_id;
            $config['returnUrl'] = esc_url_raw(admin_url('edit.php?post_type=happybites_menu_item'));
            $config['menuManageUrl'] = esc_url_raw(admin_url('admin.php?page=happybites-manage-menu'));
        }

        return $config;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function read_manifest(): ?array
    {
        $manifest_path = HAPPYBITES_PLUGIN_PATH . 'public/admin/.vite/manifest.json';

        if (!file_exists($manifest_path)) {
            $manifest_path = HAPPYBITES_PLUGIN_PATH . 'public/admin/manifest.json';
        }

        if (!file_exists($manifest_path)) {
            return null;
        }

        $decoded = json_decode((string) file_get_contents($manifest_path), true);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * @param array<string, mixed> $manifest
     * @return array<string, mixed>|null
     */
    private function find_entry(array $manifest): ?array
    {
        foreach ($manifest as $item) {
            if (!empty($item['isEntry'])) {
                return $item;
            }
        }

        if (isset($manifest['src/main.tsx'])) {
            return $manifest['src/main.tsx'];
        }

        if (isset($manifest['index.html'])) {
            return $manifest['index.html'];
        }

        return null;
    }
}
