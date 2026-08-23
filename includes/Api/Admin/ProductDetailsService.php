<?php
/**
 * Read/write full menu item meta for admin API.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\Options;
use HappyBites\Data\PostTypes;
use HappyBites\Data\ProductLinks;
use HappyBites\Data\Taxonomy;
use WP_Post;

if (!defined('ABSPATH')) {
    exit;
}

final class ProductDetailsService
{
    /**
     * @return array<string, mixed>|null
     */
    public function get(int $product_id): ?array
    {
        $post = get_post($product_id);

        if (!$post instanceof WP_Post || $post->post_type !== PostTypes::POST_TYPE) {
            return null;
        }

        return $this->map($post);
    }

    /**
     * @return array<string, mixed>
     */
    public function map(WP_Post $post): array
    {
        $languages = Options::active_languages();
        $default_lang = (string) get_option(Options::DEFAULT_LANGUAGE, 'en');
        $localized = [];

        foreach ($languages as $lang_code) {
            $localized[$lang_code] = [
                'title' => (string) (get_post_meta($post->ID, '_menu_title_' . $lang_code, true) ?: $post->post_title),
                'description' => (string) (get_post_meta($post->ID, '_menu_description_' . $lang_code, true) ?: $post->post_content),
                'ingredients' => $this->normalize_ingredients(get_post_meta($post->ID, '_menu_ingredients_' . $lang_code, true)),
                'allergens' => $this->normalize_string_list(get_post_meta($post->ID, '_menu_allergens_' . $lang_code, true)),
                'allergen_notes' => (string) get_post_meta($post->ID, '_menu_allergen_notes_' . $lang_code, true),
            ];
        }

        $tags = get_post_meta($post->ID, '_menu_tags', true);
        if (!is_array($tags)) {
            $tags = [];
        }

        $price = get_post_meta($post->ID, '_menu_price', true);
        $category_id = (int) get_post_meta($post->ID, '_menu_category', true);
        $default = $localized[$default_lang] ?? reset($localized) ?: [
            'title' => $post->post_title,
            'description' => $post->post_content,
            'ingredients' => [],
            'allergens' => [],
            'allergen_notes' => '',
        ];

        $image_id = (int) get_post_thumbnail_id($post->ID);

        return [
            'id' => (int) $post->ID,
            'status' => $this->public_status($post->post_status),
            'public_url' => ProductLinks::product_url((int) $post->ID),
            'title' => (string) $default['title'],
            'description' => (string) $default['description'],
            'languages' => $localized,
            'price' => is_numeric($price) ? (float) $price : 0.0,
            'weight' => (string) get_post_meta($post->ID, '_menu_weight', true),
            'origin_country' => (string) get_post_meta($post->ID, '_menu_origin_country', true),
            'spice_level' => (string) get_post_meta($post->ID, '_menu_spice_level', true),
            'preparation_time' => (string) get_post_meta($post->ID, '_menu_preparation_time', true),
            'portion_size' => (string) get_post_meta($post->ID, '_menu_portion_size', true),
            'nutrition' => $this->normalize_nutrition(get_post_meta($post->ID, '_menu_nutrition', true)),
            'additives' => $this->normalize_string_list(get_post_meta($post->ID, '_menu_additives', true)),
            'tags' => array_values(array_map('strval', $tags)),
            'category_id' => $category_id,
            'image' => $image_id > 0 ? (string) wp_get_attachment_image_url($image_id, 'medium') : '',
            'image_id' => $image_id,
            'image_alt' => $image_id > 0 ? (string) get_post_meta($image_id, '_wp_attachment_image_alt', true) : '',
        ];
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>|\WP_Error
     */
    public function set_image(int $product_id, array $params)
    {
        $post = get_post($product_id);

        if (!$post instanceof WP_Post || $post->post_type !== PostTypes::POST_TYPE) {
            return new \WP_Error('not_found', __('Product not found.', 'happybites'));
        }

        $media = new MediaImportService();
        $alt_text = sanitize_text_field((string) ($params['alt_text'] ?? ''));
        $image_url = esc_url_raw(trim((string) ($params['image_url'] ?? '')));
        $image_id = (int) ($params['image_id'] ?? 0);

        if ($image_url !== '') {
            $imported_id = $media->import_from_url($image_url, $alt_text);

            if (is_wp_error($imported_id)) {
                return $imported_id;
            }

            set_post_thumbnail($product_id, (int) $imported_id);
        } elseif ($image_id > 0) {
            set_post_thumbnail($product_id, $image_id);

            if ($alt_text !== '') {
                $media->update_alt_text($image_id, $alt_text);
            }
        } elseif (array_key_exists('image_id', $params) || array_key_exists('image_url', $params)) {
            delete_post_thumbnail($product_id);
        } else {
            return new \WP_Error('invalid_image', __('Provide image_url or image_id.', 'happybites'));
        }

        $updated = get_post($product_id);

        if (!$updated instanceof WP_Post) {
            return new \WP_Error('not_found', __('Product not found.', 'happybites'));
        }

        return $this->map($updated);
    }

    /**
     * @param array<string, mixed> $params
     * @return int|\WP_Error
     */
    public function save(int $product_id, array $params)
    {
        $languages = Options::active_languages();
        $default_lang = (string) get_option(Options::DEFAULT_LANGUAGE, 'en');
        $localized = $params['languages'] ?? [];
        if (is_object($localized)) {
            $localized = json_decode(wp_json_encode($localized), true) ?: [];
        }
        if (!is_array($localized)) {
            $localized = [];
        }

        $default_title = '';
        $default_description = '';

        if (isset($localized[$default_lang]) && is_array($localized[$default_lang])) {
            $default_title = sanitize_text_field($localized[$default_lang]['title'] ?? '');
            $default_description = sanitize_textarea_field($localized[$default_lang]['description'] ?? '');
        }

        if ($default_title === '' && isset($params['title'])) {
            $default_title = sanitize_text_field((string) $params['title']);
        }

        if ($default_description === '' && isset($params['description'])) {
            $default_description = sanitize_textarea_field((string) $params['description']);
        }

        if ($default_title === '') {
            return new \WP_Error('invalid_title', __('Product name cannot be empty.', 'happybites'));
        }

        $existing = null;
        if ($product_id > 0) {
            $existing = get_post($product_id);
            if (!$existing instanceof WP_Post || $existing->post_type !== PostTypes::POST_TYPE) {
                return new \WP_Error('not_found', __('Product not found.', 'happybites'));
            }
        }

        $post_status = $existing instanceof WP_Post ? $existing->post_status : 'publish';
        if (array_key_exists('status', $params)) {
            $normalized_status = $this->normalize_status($params['status']);
            if ($normalized_status === null) {
                return new \WP_Error('invalid_status', __('Status must be publish or draft.', 'happybites'));
            }

            $post_status = $normalized_status;
        }

        $post_data = [
            'post_title' => $default_title,
            'post_content' => $default_description,
            'post_type' => PostTypes::POST_TYPE,
            'post_status' => $post_status,
        ];

        if ($product_id > 0) {
            $post_data['ID'] = $product_id;
            $result_id = wp_update_post($post_data, true);
        } else {
            $result_id = wp_insert_post($post_data, true);
        }

        if (is_wp_error($result_id)) {
            return $result_id;
        }

        $result_id = (int) $result_id;
        $price = isset($params['price']) ? (float) $params['price'] : 0.0;
        $category_id = (int) ($params['category_id'] ?? 0);
        $tags = $this->normalize_tags($params['tags'] ?? []);

        update_post_meta($result_id, '_menu_price', $price);
        update_post_meta($result_id, '_menu_weight', sanitize_text_field((string) ($params['weight'] ?? '')));
        update_post_meta($result_id, '_menu_origin_country', sanitize_text_field((string) ($params['origin_country'] ?? '')));
        update_post_meta($result_id, '_menu_spice_level', sanitize_text_field((string) ($params['spice_level'] ?? '')));
        update_post_meta($result_id, '_menu_preparation_time', sanitize_text_field((string) ($params['preparation_time'] ?? '')));
        update_post_meta($result_id, '_menu_portion_size', sanitize_text_field((string) ($params['portion_size'] ?? '')));
        update_post_meta($result_id, '_menu_nutrition', $this->normalize_nutrition($params['nutrition'] ?? []));
        update_post_meta($result_id, '_menu_additives', $this->normalize_string_list($params['additives'] ?? []));

        if (!empty($tags)) {
            update_post_meta($result_id, '_menu_tags', $tags);
        } else {
            delete_post_meta($result_id, '_menu_tags');
        }

        if ($category_id > 0) {
            update_post_meta($result_id, '_menu_category', $category_id);
            wp_set_object_terms($result_id, $category_id, Taxonomy::TAXONOMY, false);
        } else {
            delete_post_meta($result_id, '_menu_category');
            wp_set_object_terms($result_id, [], Taxonomy::TAXONOMY, false);
        }

        if (!empty($params['image_touched']) || !empty($params['image_url'])) {
            $image_result = $this->apply_image($result_id, $params);

            if (is_wp_error($image_result)) {
                return $image_result;
            }
        }

        if ($product_id <= 0) {
            update_post_meta($result_id, '_menu_order', $this->next_product_order($category_id));
        }

        foreach ($languages as $lang_code) {
            $lang_data = $localized[$lang_code] ?? [];
            if (is_object($lang_data)) {
                $lang_data = json_decode(wp_json_encode($lang_data), true) ?: [];
            }
            if (!is_array($lang_data)) {
                $lang_data = [];
            }

            if (isset($lang_data['title'])) {
                update_post_meta($result_id, '_menu_title_' . $lang_code, sanitize_text_field((string) $lang_data['title']));
            }

            if (isset($lang_data['description'])) {
                update_post_meta($result_id, '_menu_description_' . $lang_code, sanitize_textarea_field((string) $lang_data['description']));
            }

            update_post_meta(
                $result_id,
                '_menu_ingredients_' . $lang_code,
                $this->normalize_ingredients($lang_data['ingredients'] ?? [])
            );
            update_post_meta(
                $result_id,
                '_menu_allergens_' . $lang_code,
                $this->normalize_string_list($lang_data['allergens'] ?? [])
            );
            update_post_meta(
                $result_id,
                '_menu_allergen_notes_' . $lang_code,
                sanitize_textarea_field((string) ($lang_data['allergen_notes'] ?? ''))
            );
        }

        return $result_id;
    }

    /**
     * @return array<string, mixed>|\WP_Error
     */
    public function set_status(int $product_id, string $status)
    {
        $post = get_post($product_id);

        if (!$post instanceof WP_Post || $post->post_type !== PostTypes::POST_TYPE) {
            return new \WP_Error('not_found', __('Product not found.', 'happybites'));
        }

        $normalized_status = $this->normalize_status($status);
        if ($normalized_status === null) {
            return new \WP_Error('invalid_status', __('Status must be publish or draft.', 'happybites'));
        }

        if ($post->post_status === $normalized_status) {
            return $this->map($post);
        }

        $result = wp_update_post([
            'ID' => $product_id,
            'post_status' => $normalized_status,
        ], true);

        if (is_wp_error($result)) {
            return $result;
        }

        $updated = get_post($product_id);

        if (!$updated instanceof WP_Post) {
            return new \WP_Error('not_found', __('Product not found.', 'happybites'));
        }

        return $this->map($updated);
    }

    private function normalize_status(mixed $status): ?string
    {
        $status = sanitize_key((string) $status);

        if ($status === 'published') {
            $status = 'publish';
        }

        return in_array($status, ['publish', 'draft'], true) ? $status : null;
    }

    private function public_status(string $status): string
    {
        return $status === 'draft' ? 'draft' : 'publish';
    }

    /**
     * @param array<string, mixed> $params
     * @return true|\WP_Error
     */
    private function apply_image(int $product_id, array $params)
    {
        $media = new MediaImportService();
        $alt_text = sanitize_text_field((string) ($params['alt_text'] ?? ''));
        $image_url = esc_url_raw(trim((string) ($params['image_url'] ?? '')));

        if ($image_url !== '') {
            $imported_id = $media->import_from_url($image_url, $alt_text);

            if (is_wp_error($imported_id)) {
                return $imported_id;
            }

            set_post_thumbnail($product_id, (int) $imported_id);

            return true;
        }

        if (!empty($params['image_touched'])) {
            $image_id = (int) ($params['image_id'] ?? 0);

            if ($image_id > 0) {
                set_post_thumbnail($product_id, $image_id);

                if ($alt_text !== '') {
                    $media->update_alt_text($image_id, $alt_text);
                }
            } else {
                delete_post_thumbnail($product_id);
            }
        }

        return true;
    }

    /**
     * @param mixed $tags
     * @return array<int, string>
     */
    private function normalize_tags($tags): array
    {
        if (is_array($tags)) {
            return array_values(array_filter(array_map('sanitize_text_field', $tags)));
        }

        if (!is_string($tags) || $tags === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $tags))));
    }

    /**
     * @param mixed $value
     * @return array<int, array{name: string, amount: string}>
     */
    private function normalize_ingredients($value): array
    {
        if (is_object($value)) {
            $value = json_decode(wp_json_encode($value), true) ?: [];
        }

        if (!is_array($value)) {
            return [];
        }

        $items = [];
        foreach ($value as $item) {
            if (!is_array($item)) {
                continue;
            }

            $name = sanitize_text_field((string) ($item['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $items[] = [
                'name' => $name,
                'amount' => sanitize_text_field((string) ($item['amount'] ?? '')),
            ];
        }

        return $items;
    }

    /**
     * @param mixed $value
     * @return array<int, array{name: string, value: string}>
     */
    private function normalize_nutrition($value): array
    {
        if (is_object($value)) {
            $value = json_decode(wp_json_encode($value), true) ?: [];
        }

        if (!is_array($value)) {
            return [];
        }

        $items = [];
        foreach ($value as $item) {
            if (!is_array($item)) {
                continue;
            }

            $name = sanitize_text_field((string) ($item['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $items[] = [
                'name' => $name,
                'value' => sanitize_text_field((string) ($item['value'] ?? '')),
            ];
        }

        return $items;
    }

    /**
     * @param mixed $value
     * @return array<int, string>
     */
    private function normalize_string_list($value): array
    {
        if (is_object($value)) {
            $value = json_decode(wp_json_encode($value), true) ?: [];
        }

        if (!is_array($value)) {
            if (is_string($value) && $value !== '') {
                return array_values(array_filter(array_map('trim', explode(',', $value))));
            }

            return [];
        }

        return array_values(array_filter(array_map(static function ($item) {
            return sanitize_text_field((string) $item);
        }, $value)));
    }

    private function next_product_order(int $category_id): int
    {
        $meta_query = $category_id > 0
            ? [[
                'key' => '_menu_category',
                'value' => $category_id,
                'compare' => '=',
            ]]
            : [
                'relation' => 'OR',
                ['key' => '_menu_category', 'compare' => 'NOT EXISTS'],
                ['key' => '_menu_category', 'value' => '', 'compare' => '='],
                ['key' => '_menu_category', 'value' => '0', 'compare' => '='],
            ];

        $products = get_posts([
            'post_type' => PostTypes::POST_TYPE,
            'posts_per_page' => 1,
            'meta_query' => $meta_query,
            'meta_key' => '_menu_order',
            'orderby' => 'meta_value_num',
            'order' => 'DESC',
        ]);

        if (empty($products)) {
            return 0;
        }

        return (int) get_post_meta($products[0]->ID, '_menu_order', true) + 1;
    }
}
