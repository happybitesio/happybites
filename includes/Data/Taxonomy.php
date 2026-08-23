<?php
/**
 * Menu category taxonomy.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

use HappyBites\Data\PostTypes;

if (!defined('ABSPATH')) {
    exit;
}

final class Taxonomy
{
    public const TAXONOMY = 'happybites_menu_category';

    public static function register(): void
    {
        register_taxonomy(self::TAXONOMY, [PostTypes::POST_TYPE], [
            'hierarchical' => true,
            'labels' => [
                'name' => __('Menu Categories', 'happybites'),
                'singular_name' => __('Menu Category', 'happybites'),
                'search_items' => __('Search Categories', 'happybites'),
                'all_items' => __('All Categories', 'happybites'),
                'parent_item' => __('Parent Category', 'happybites'),
                'parent_item_colon' => __('Parent Category:', 'happybites'),
                'edit_item' => __('Edit Category', 'happybites'),
                'update_item' => __('Update Category', 'happybites'),
                'add_new_item' => __('Add New Category', 'happybites'),
                'new_item_name' => __('New Category Name', 'happybites'),
                'menu_name' => __('Categories', 'happybites'),
            ],
            'show_ui' => true,
            'show_admin_column' => true,
            'query_var' => true,
            'rewrite' => ['slug' => 'menu-kategorisi'],
            'show_in_rest' => true,
            'meta_box_cb' => false,
        ]);

        add_action('pre_insert_term', [self::class, 'enforce_max_depth'], 10, 2);
    }

  /**
   * Limit category hierarchy to two levels (parent + child).
   */
    public static function enforce_max_depth($term, string $taxonomy): mixed
    {
        if ($taxonomy !== self::TAXONOMY) {
            return $term;
        }

        if (isset($_POST['parent']) && $_POST['parent'] !== '-1') {
            $parent = get_term((int) $_POST['parent'], $taxonomy);

            if ($parent && !is_wp_error($parent)) {
                $ancestors = get_ancestors($parent->term_id, $taxonomy);

                if (count($ancestors) >= 1) {
                    wp_die(esc_html__('Maximum category depth is 2 levels.', 'happybites'));
                }
            }
        }

        return $term;
    }
}
