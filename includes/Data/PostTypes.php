<?php
/**
 * Custom post type registration.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class PostTypes
{
    public const POST_TYPE = 'happybites_menu_item';

    public static function register(): void
    {
        register_post_type(self::POST_TYPE, [
            'labels' => [
                'name' => __('Menu Items', 'happybites'),
                'singular_name' => __('Menu Item', 'happybites'),
                'menu_name' => __('Menu Items', 'happybites'),
                'add_new' => __('Add New', 'happybites'),
                'add_new_item' => __('Add New Menu Item', 'happybites'),
                'edit_item' => __('Edit Menu Item', 'happybites'),
                'new_item' => __('New Menu Item', 'happybites'),
                'view_item' => __('View Menu Item', 'happybites'),
                'search_items' => __('Search Menu Items', 'happybites'),
                'not_found' => __('No menu items found', 'happybites'),
                'not_found_in_trash' => __('No menu items found in trash', 'happybites'),
            ],
            'public' => true,
            'publicly_queryable' => true,
            'show_ui' => true,
            'show_in_menu' => false,
            'query_var' => true,
            'rewrite' => ['slug' => 'menu-item'],
            'capability_type' => 'post',
            'has_archive' => true,
            'hierarchical' => false,
            'menu_icon' => 'dashicons-food',
            'supports' => ['title', 'thumbnail'],
            'show_in_rest' => false,
        ]);
    }
}
