<?php
/**
 * Uninstall HappyBites Plugin
 *
 * @package HappyBites
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

$options = [
    'happybites_restaurant_info',
    'happybites_working_hours',
    'happybites_social_media',
    'happybites_colors',
    'happybites_theme_mode',
    'happybites_wifi',
    'happybites_information',
    'happybites_slug',
    'happybites_languages',
    'happybites_default_language',
    'happybites_default_currency',
    'happybites_settings',
    'happybites_db_version',
    'happybites_mcp_settings',
    'happybites_recaptcha',
    'happybites_demo_seeded',
];

foreach ($options as $option) {
    delete_option($option);
}

delete_option('happybites_reviews');

global $wpdb;

$posts = get_posts([
    'post_type' => 'happybites_menu_item',
    'post_status' => 'any',
    'posts_per_page' => -1,
    'fields' => 'ids',
]);

foreach ($posts as $post_id) {
    wp_delete_post((int) $post_id, true);
}

$terms = get_terms([
    'taxonomy' => 'happybites_menu_category',
    'hide_empty' => false,
    'fields' => 'ids',
]);

if (!is_wp_error($terms)) {
    foreach ($terms as $term_id) {
        wp_delete_term((int) $term_id, 'happybites_menu_category');
    }
}

$wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'happybites_reviews');

wp_cache_flush();
flush_rewrite_rules();
