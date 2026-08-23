<?php
/**
 * Admin REST: category CRUD.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\Options;
use HappyBites\Data\Taxonomy;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class CategoryAdminEndpoint
{
    public function register(): void
    {
        register_rest_route('happybites/v1', '/admin/categories', [
            'methods' => 'POST',
            'callback' => [$this, 'create'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/categories/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/categories/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete'],
            'permission_callback' => [Permission::class, 'check'],
        ]);
    }

    public function create(WP_REST_Request $request): WP_REST_Response
    {
        $params = $request->get_json_params();
        $name = sanitize_text_field($params['name'] ?? '');
        $description = sanitize_textarea_field($params['description'] ?? '');
        $parent_id = (int) ($params['parent_id'] ?? 0);

        if ($name === '') {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Category name cannot be empty.', 'happybites'),
            ], 400);
        }

        $result = wp_insert_term($name, Taxonomy::TAXONOMY, [
            'description' => $description,
            'parent' => $parent_id,
            'slug' => sanitize_title($name),
        ]);

        if (is_wp_error($result)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $result->get_error_message(),
            ], 400);
        }

        $term_id = (int) $result['term_id'];
        $max_order = $this->next_category_order($parent_id);
        update_term_meta($term_id, '_menu_order', $max_order);
        $this->sync_default_language_meta($term_id, $name, $description);

        return new WP_REST_Response([
            'success' => true,
            'data' => $this->map_category($term_id, $parent_id, $name, $description, $max_order),
        ], 201);
    }

    public function update(WP_REST_Request $request): WP_REST_Response
    {
        $term_id = (int) $request->get_param('id');
        $params = $request->get_json_params();
        $name = sanitize_text_field($params['name'] ?? '');
        $description = sanitize_textarea_field($params['description'] ?? '');

        if ($name === '') {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Category name cannot be empty.', 'happybites'),
            ], 400);
        }

        $term = get_term($term_id, Taxonomy::TAXONOMY);
        if (!$term || is_wp_error($term)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Category not found.', 'happybites'),
            ], 404);
        }

        $result = wp_update_term($term_id, Taxonomy::TAXONOMY, [
            'name' => $name,
            'description' => $description,
            'slug' => sanitize_title($name),
        ]);

        if (is_wp_error($result)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $result->get_error_message(),
            ], 400);
        }

        $this->sync_default_language_meta($term_id, $name, $description);
        $order = (int) get_term_meta($term_id, '_menu_order', true);

        return new WP_REST_Response([
            'success' => true,
            'data' => $this->map_category($term_id, (int) $term->parent, $name, $description, $order),
        ], 200);
    }

    public function delete(WP_REST_Request $request): WP_REST_Response
    {
        $term_id = (int) $request->get_param('id');
        $term = get_term($term_id, Taxonomy::TAXONOMY);

        if (!$term || is_wp_error($term)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Category not found.', 'happybites'),
            ], 404);
        }

        $result = wp_delete_term($term_id, Taxonomy::TAXONOMY);

        if (is_wp_error($result) || !$result) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to delete category.', 'happybites'),
            ], 400);
        }

        return new WP_REST_Response([
            'success' => true,
        ], 200);
    }

    private function next_category_order(int $parent_id): int
    {
        $terms = get_terms([
            'taxonomy' => Taxonomy::TAXONOMY,
            'hide_empty' => false,
            'parent' => $parent_id,
            'meta_key' => '_menu_order',
            'orderby' => 'meta_value_num',
            'order' => 'DESC',
            'number' => 1,
        ]);

        if (empty($terms) || is_wp_error($terms)) {
            return 0;
        }

        return (int) get_term_meta($terms[0]->term_id, '_menu_order', true) + 1;
    }

    private function sync_default_language_meta(int $term_id, string $name, string $description): void
    {
        $default_lang = get_option(Options::DEFAULT_LANGUAGE, 'en');

        if (!is_string($default_lang) || $default_lang === '') {
            return;
        }

        update_term_meta($term_id, 'category_name_' . $default_lang, $name);
        update_term_meta($term_id, 'category_description_' . $default_lang, $description);
    }

    /**
     * @return array<string, mixed>
     */
    private function map_category(int $id, int $parent_id, string $name, string $description, int $order): array
    {
        return [
            'id' => $id,
            'name' => $name,
            'parent_id' => $parent_id,
            'description' => $description,
            'order' => $order,
        ];
    }
}
