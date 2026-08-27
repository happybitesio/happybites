<?php
/**
 * Machine-readable menu index for agents and integrations.
 *
 * @package HappyBites
 */

namespace HappyBites\Api;

use HappyBites\Data\Options;
use HappyBites\Data\PostTypes;
use HappyBites\Data\ProductLinks;
use HappyBites\Data\Taxonomy;

if (!defined('ABSPATH')) {
    exit;
}

final class MenuSitemapService
{
    /**
     * @return array<string, mixed>
     */
    public function get(): array
    {
        $menu_url = ProductLinks::menu_url();
        $categories = [];
        $products = [];

        $terms = get_terms([
            'taxonomy' => Taxonomy::TAXONOMY,
            'hide_empty' => false,
        ]);

        if (is_wp_error($terms)) {
            $terms = [];
        }

        foreach ($terms as $term) {
            $categories[] = [
                'id' => (int) $term->term_id,
                'slug' => (string) $term->slug,
                'name' => (string) $term->name,
                'parent_id' => (int) $term->parent,
                'public_url' => ProductLinks::category_url((string) $term->slug),
            ];
        }

        $posts = get_posts([
            'post_type' => PostTypes::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
            'no_found_rows' => true,
        ]);

        foreach ($posts as $post) {
            $category_id = (int) get_post_meta($post->ID, '_menu_category', true);
            $image_id = (int) get_post_thumbnail_id($post->ID);

            $products[] = [
                'id' => (int) $post->ID,
                'title' => (string) $post->post_title,
                'category_id' => $category_id,
                'public_url' => ProductLinks::product_url((int) $post->ID),
                'image_url' => $image_id > 0 ? (string) wp_get_attachment_image_url($image_id, 'medium') : '',
                'image_alt' => $image_id > 0 ? (string) get_post_meta($image_id, '_wp_attachment_image_alt', true) : '',
            ];
        }

        return [
            'site_url' => home_url('/'),
            'menu_url' => $menu_url,
            'rest_url' => esc_url_raw(rest_url('happybites/v1')),
            'mcp_url' => (string) apply_filters('happybites_mcp_endpoint_url', ''),
            'menu_slug' => Options::menu_slug(),
            'total_categories' => count($categories),
            'total_products' => count($products),
            'categories' => $categories,
            'products' => $products,
            'generated_at' => current_time('mysql'),
        ];
    }
}
