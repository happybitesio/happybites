<?php
/**
 * Menu management data for admin REST API.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\PostTypes;
use HappyBites\Data\ProductLinks;
use HappyBites\Data\Taxonomy;
use WP_Post;

if (!defined('ABSPATH')) {
    exit;
}

final class MenuManagementService
{
    /**
     * @return array{categories: array<int, array<string, mixed>>, uncategorizedProducts: array<int, array<string, mixed>>}
     */
    public function get_tree(): array
    {
        $all_terms = get_terms([
            'taxonomy' => Taxonomy::TAXONOMY,
            'hide_empty' => false,
        ]);

        if (is_wp_error($all_terms)) {
            $all_terms = [];
        }

        $terms_by_parent = [];
        foreach ($all_terms as $term) {
            $terms_by_parent[(int) $term->parent][] = $term;
        }

        $top_categories = $terms_by_parent[0] ?? [];
        usort($top_categories, static function ($a, $b) {
            $order_a = (int) (get_term_meta($a->term_id, '_menu_order', true) ?: 0);
            $order_b = (int) (get_term_meta($b->term_id, '_menu_order', true) ?: 0);

            return $order_a <=> $order_b;
        });

        $all_products = get_posts([
            'post_type' => PostTypes::POST_TYPE,
            'post_status' => 'any',
            'posts_per_page' => -1,
            'no_found_rows' => true,
            'update_post_term_cache' => false,
            'orderby' => [
                'menu_order_clause' => 'ASC',
            ],
            'meta_query' => [
                'relation' => 'OR',
                'menu_order_clause' => [
                    'key' => '_menu_order',
                    'type' => 'NUMERIC',
                    'compare' => 'EXISTS',
                ],
                [
                    'key' => '_menu_order',
                    'compare' => 'NOT EXISTS',
                ],
            ],
        ]);

        $uncategorized = [];
        $products_by_cat = [];

        foreach ($all_products as $product) {
            $cat_id = (int) get_post_meta($product->ID, '_menu_category', true);

            if ($cat_id <= 0) {
                $uncategorized[] = $product;
                continue;
            }

            $products_by_cat[$cat_id][] = $product;
        }

        $build_subcategories = function (int $parent_id) use (&$terms_by_parent, &$products_by_cat): array {
            $out = [];
            $subs = $terms_by_parent[$parent_id] ?? [];

            foreach ($subs as $sub) {
                $sub_order = get_term_meta($sub->term_id, '_menu_order', true);
                $sub_data = [
                    'id' => (int) $sub->term_id,
                    'name' => (string) $sub->name,
                    'parent_id' => (int) $sub->parent,
                    'description' => (string) $sub->description,
                    'order' => is_numeric($sub_order) ? (int) $sub_order : 0,
                    'products' => [],
                ];

                if (!empty($products_by_cat[$sub->term_id])) {
                    foreach ($products_by_cat[$sub->term_id] as $product) {
                        $sub_data['products'][] = $this->map_product($product);
                    }

                    usort($sub_data['products'], static fn ($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
                }

                $out[] = $sub_data;
            }

            usort($out, static fn ($a, $b) => ($a['order'] <=> $b['order']) ?: ($a['id'] <=> $b['id']));

            return $out;
        };

        $categories = [];

        foreach ($top_categories as $cat) {
            $order = get_term_meta($cat->term_id, '_menu_order', true);
            $category_data = [
                'id' => (int) $cat->term_id,
                'name' => (string) $cat->name,
                'description' => (string) $cat->description,
                'order' => is_numeric($order) ? (int) $order : 0,
                'products' => [],
                'subcategories' => $build_subcategories((int) $cat->term_id),
            ];

            if (!empty($products_by_cat[$cat->term_id])) {
                foreach ($products_by_cat[$cat->term_id] as $product) {
                    $category_data['products'][] = $this->map_product($product);
                }
            }

            $categories[] = $category_data;
        }

        $uncategorized_data = array_map(fn (WP_Post $product) => $this->map_product($product), $uncategorized);

        return [
            'categories' => $categories,
            'uncategorizedProducts' => $uncategorized_data,
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{saved_count: int, cleared: array<int, int>}
     */
    public function save_order(array $payload): array
    {
        $categories = is_array($payload['categories'] ?? null) ? $payload['categories'] : [];
        $uncategorized_products = is_array($payload['uncategorizedProducts'] ?? null) ? $payload['uncategorizedProducts'] : [];

        $saved_count = 0;
        $submitted_product_ids = [];

        foreach ($categories as $category) {
            $category_id = (int) ($category['id'] ?? 0);
            $order = (int) ($category['order'] ?? 0);

            if ($category_id > 0 && update_term_meta($category_id, '_menu_order', $order)) {
                $saved_count++;
            }

            if (!empty($category['subcategories']) && is_array($category['subcategories'])) {
                foreach ($category['subcategories'] as $subcategory) {
                    $subcategory_id = (int) ($subcategory['id'] ?? 0);
                    $sub_order = (int) ($subcategory['order'] ?? 0);

                    if ($subcategory_id > 0 && update_term_meta($subcategory_id, '_menu_order', $sub_order)) {
                        $saved_count++;
                    }

                    if (!empty($subcategory['products']) && is_array($subcategory['products'])) {
                        foreach ($subcategory['products'] as $product) {
                            $saved_count += $this->save_product_placement($product, $submitted_product_ids);
                        }
                    }
                }
            }

            if (!empty($category['products']) && is_array($category['products'])) {
                foreach ($category['products'] as $product) {
                    $saved_count += $this->save_product_placement($product, $submitted_product_ids);
                }
            }
        }

        foreach ($uncategorized_products as $product) {
            $product_id = (int) ($product['id'] ?? 0);
            $product_order = (int) ($product['order'] ?? 0);

            if ($product_id <= 0) {
                continue;
            }

            $submitted_product_ids[] = $product_id;

            if (update_post_meta($product_id, '_menu_order', $product_order)) {
                $saved_count++;
            }

            delete_post_meta($product_id, '_menu_category');
            wp_set_object_terms($product_id, [], Taxonomy::TAXONOMY, false);
            $saved_count++;
        }

        return [
            'saved_count' => $saved_count,
            'cleared' => [],
        ];
    }

    /**
     * @param array<string, mixed> $product
     * @param array<int, int> $submitted_product_ids
     */
    private function save_product_placement(array $product, array &$submitted_product_ids): int
    {
        $product_id = (int) ($product['id'] ?? 0);
        $product_order = (int) ($product['order'] ?? 0);
        $category_id = (int) ($product['category_id'] ?? 0);
        $saved_count = 0;

        if ($product_id <= 0) {
            return 0;
        }

        $submitted_product_ids[] = $product_id;

        if (update_post_meta($product_id, '_menu_order', $product_order)) {
            $saved_count++;
        }

        if ($category_id > 0) {
            update_post_meta($product_id, '_menu_category', $category_id);
            wp_set_object_terms($product_id, $category_id, Taxonomy::TAXONOMY, false);
            $saved_count++;
        }

        return $saved_count;
    }

    /**
     * @return array<string, mixed>
     */
    private function map_product(WP_Post $product): array
    {
        $tags = get_post_meta($product->ID, '_menu_tags', true);
        if (!is_array($tags)) {
            $tags = [];
        }

        $price = get_post_meta($product->ID, '_menu_price', true);
        $order = get_post_meta($product->ID, '_menu_order', true);
        $category_id = (int) get_post_meta($product->ID, '_menu_category', true);
        $image_id = (int) get_post_thumbnail_id($product->ID);

        return [
            'id' => (int) $product->ID,
            'status' => $product->post_status === 'draft' ? 'draft' : 'publish',
            'public_url' => ProductLinks::product_url((int) $product->ID),
            'title' => (string) $product->post_title,
            'price' => is_numeric($price) ? (float) $price : 0.0,
            'order' => is_numeric($order) ? (int) $order : 0,
            'image' => $image_id > 0 ? (string) wp_get_attachment_image_url($image_id, 'thumbnail') : '',
            'image_id' => $image_id,
            'image_alt' => $image_id > 0 ? (string) get_post_meta($image_id, '_wp_attachment_image_alt', true) : '',
            'tags' => array_values($tags),
            'description' => (string) $product->post_content,
            'category_id' => $category_id,
        ];
    }
}
