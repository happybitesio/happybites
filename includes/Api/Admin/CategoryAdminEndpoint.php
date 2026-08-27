<?php
/**
 * Admin REST: category CRUD.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\CategoryImage;
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
        $this->sync_category_languages($term_id, $params, $name, $description);
        $image_error = $this->save_category_image($term_id, $params);

        if ($image_error instanceof \WP_Error) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $image_error->get_error_message(),
                'code' => $image_error->get_error_code(),
            ], 400);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $this->map_category($term_id, $parent_id, $name, $description, $max_order),
        ], 201);
    }

    public function update(WP_REST_Request $request): WP_REST_Response
    {
        $term_id = (int) $request->get_param('id');
        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $name = sanitize_text_field($params['name'] ?? '');
        $description = sanitize_textarea_field($params['description'] ?? '');
        $parent_id = array_key_exists('parent_id', $params)
            ? (int) $params['parent_id']
            : null;

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

        if ($parent_id !== null) {
            if ($parent_id === $term_id) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('A category cannot be its own parent.', 'happybites'),
                ], 400);
            }

            if ($parent_id > 0) {
                $parent_term = get_term($parent_id, Taxonomy::TAXONOMY);
                if (!$parent_term || is_wp_error($parent_term)) {
                    return new WP_REST_Response([
                        'success' => false,
                        'message' => __('Parent category not found.', 'happybites'),
                    ], 404);
                }

                if ($this->is_descendant_category($parent_id, $term_id)) {
                    return new WP_REST_Response([
                        'success' => false,
                        'message' => __('A category cannot be moved under its own descendant.', 'happybites'),
                    ], 400);
                }
            }
        }

        $update_args = [
            'name' => $name,
            'description' => $description,
            'slug' => sanitize_title($name),
        ];

        if ($parent_id !== null) {
            $update_args['parent'] = max(0, $parent_id);
        }

        $result = wp_update_term($term_id, Taxonomy::TAXONOMY, $update_args);

        if (is_wp_error($result)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $result->get_error_message(),
            ], 400);
        }

        $this->sync_default_language_meta($term_id, $name, $description);
        $this->sync_category_languages($term_id, $params, $name, $description);
        $image_error = $this->save_category_image($term_id, $params);

        if ($image_error instanceof \WP_Error) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $image_error->get_error_message(),
                'code' => $image_error->get_error_code(),
            ], 400);
        }

        $order = (int) get_term_meta($term_id, '_menu_order', true);
        $updated_term = get_term($term_id, Taxonomy::TAXONOMY);
        $resolved_parent = ($updated_term && !is_wp_error($updated_term))
            ? (int) $updated_term->parent
            : (int) $term->parent;

        return new WP_REST_Response([
            'success' => true,
            'data' => $this->map_category($term_id, $resolved_parent, $name, $description, $order),
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
            // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- sort by custom menu order.
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

    private function is_descendant_category(int $candidate_parent_id, int $term_id): bool
    {
        $current_id = $candidate_parent_id;

        while ($current_id > 0) {
            if ($current_id === $term_id) {
                return true;
            }

            $ancestor = get_term($current_id, Taxonomy::TAXONOMY);
            if (!$ancestor || is_wp_error($ancestor)) {
                break;
            }

            $current_id = (int) $ancestor->parent;
        }

        return false;
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
     * @param array<string, mixed> $params
     */
    private function sync_category_languages(int $term_id, array $params, string $fallback_name, string $fallback_description): void
    {
        if (!isset($params['languages']) || !is_array($params['languages'])) {
            return;
        }

        foreach ($params['languages'] as $lang_code => $entry) {
            if (!is_string($lang_code) || $lang_code === '' || !is_array($entry)) {
                continue;
            }

            $lang_code = sanitize_key($lang_code);

            if ($lang_code === '') {
                continue;
            }

            if (array_key_exists('name', $entry)) {
                $localized_name = sanitize_text_field((string) $entry['name']);
                update_term_meta($term_id, 'category_name_' . $lang_code, $localized_name !== '' ? $localized_name : $fallback_name);
            }

            if (array_key_exists('description', $entry)) {
                update_term_meta(
                    $term_id,
                    'category_description_' . $lang_code,
                    sanitize_textarea_field((string) $entry['description'])
                );
            }
        }
    }

    /**
     * @param array<string, mixed> $params
     */
    private function save_category_image(int $term_id, array $params): ?\WP_Error
    {
        $content_base64 = trim((string) ($params['content_base64'] ?? ''));

        if ($content_base64 !== '') {
            $media = new MediaImportService();
            $filename = sanitize_file_name((string) ($params['filename'] ?? 'category-image.jpg'));
            $mime_type = sanitize_mime_type((string) ($params['mime_type'] ?? ''));
            $alt_text = sanitize_text_field((string) ($params['alt_text'] ?? ''));
            $imported_id = $media->import_from_base64(
                $content_base64,
                $filename !== '' ? $filename : 'category-image.jpg',
                $mime_type,
                $alt_text
            );

            if (is_wp_error($imported_id)) {
                return $imported_id;
            }

            CategoryImage::save($term_id, (int) $imported_id);

            return null;
        }

        if (!array_key_exists('image_id', $params)) {
            return null;
        }

        CategoryImage::save($term_id, (int) $params['image_id']);

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function map_category(int $id, int $parent_id, string $name, string $description, int $order): array
    {
        $image_id = (int) get_term_meta($id, CategoryImage::META_KEY, true);
        $image = CategoryImage::for_api($id);

        return [
            'id' => $id,
            'name' => $name,
            'parent_id' => $parent_id,
            'description' => $description,
            'order' => $order,
            'image_id' => $image_id > 0 ? $image_id : null,
            'image' => $image['url'] ?? '',
        ];
    }
}
