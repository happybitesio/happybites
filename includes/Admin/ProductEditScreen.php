<?php
/**
 * React product editor for native menu item post screens.
 *
 * @package HappyBites
 */

namespace HappyBites\Admin;

use HappyBites\Data\PostTypes;
use HappyBites\Loader;
use WP_Post;

if (!defined('ABSPATH')) {
    exit;
}

final class ProductEditScreen
{
    private Loader $loader;

    public function __construct(Loader $loader)
    {
        $this->loader = $loader;
    }

    public function register(): void
    {
        $this->loader->add_action('admin_menu', $this, 'register_hidden_page');
        $this->loader->add_action('load-post.php', $this, 'redirect_edit_screen');
        $this->loader->add_action('load-post-new.php', $this, 'redirect_new_screen');
        $this->loader->add_filter('post_row_actions', $this, 'edit_row_action', 10, 2);
        $this->loader->add_filter('get_edit_post_link', $this, 'edit_post_link', 10, 3);
    }

    public function register_hidden_page(): void
    {
        add_submenu_page(
            null,
            __('Edit Menu Item', 'happybites'),
            __('Edit Menu Item', 'happybites'),
            'manage_options',
            'happybites-edit-product',
            [$this, 'render']
        );
    }

    public function render(): void
    {
        $title = __('Edit Menu Item', 'happybites');
        include HAPPYBITES_PLUGIN_PATH . 'admin/views/react-shell.php';
    }

    public function redirect_edit_screen(): void
    {
        if (!current_user_can('edit_posts')) {
            return;
        }

        // phpcs:disable WordPress.Security.NonceVerification.Recommended -- redirect from core post screens after capability check.
        $action = isset($_GET['action']) ? sanitize_key(wp_unslash($_GET['action'])) : '';
        $post_id = isset($_GET['post']) ? absint(wp_unslash($_GET['post'])) : 0;
        // phpcs:enable WordPress.Security.NonceVerification.Recommended

        if ($post_id <= 0 || $action !== 'edit') {
            return;
        }

        $post = get_post($post_id);
        if (!$post instanceof WP_Post || $post->post_type !== PostTypes::POST_TYPE) {
            return;
        }

        wp_safe_redirect($this->edit_url((int) $post->ID));
        exit;
    }

    public function redirect_new_screen(): void
    {
        if (!current_user_can('edit_posts')) {
            return;
        }

        // phpcs:disable WordPress.Security.NonceVerification.Recommended -- redirect from core post-new screen after capability check.
        $post_type = isset($_GET['post_type']) ? sanitize_key(wp_unslash($_GET['post_type'])) : '';

        if ($post_type !== PostTypes::POST_TYPE) {
            return;
        }

        $category_id = isset($_GET['category_id']) ? absint(wp_unslash($_GET['category_id'])) : 0;
        // phpcs:enable WordPress.Security.NonceVerification.Recommended
        wp_safe_redirect($this->new_url($category_id));
        exit;
    }

    /**
     * @param array<string, string> $actions
     * @return array<string, string>
     */
    public function edit_row_action(array $actions, WP_Post $post): array
    {
        if ($post->post_type !== PostTypes::POST_TYPE || !isset($actions['edit'])) {
            return $actions;
        }

        $actions['edit'] = sprintf(
            '<a href="%s">%s</a>',
            esc_url($this->edit_url((int) $post->ID)),
            esc_html__('Edit', 'happybites')
        );

        return $actions;
    }

    public function edit_post_link(string $link, int $post_id, string $context): string
    {
        $post = get_post($post_id);
        if (!$post instanceof WP_Post || $post->post_type !== PostTypes::POST_TYPE) {
            return $link;
        }

        return $this->edit_url($post_id);
    }

    private function edit_url(int $product_id): string
    {
        return admin_url('admin.php?page=happybites-edit-product&product_id=' . $product_id);
    }

    private function new_url(int $category_id = 0): string
    {
        return admin_url(
            'admin.php?page=happybites-edit-product&action=new&category_id=' . max(0, $category_id)
        );
    }
}
