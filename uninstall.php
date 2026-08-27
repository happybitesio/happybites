<?php
/**
 * Uninstall HappyBites Plugin
 *
 * @package HappyBites
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

$happybites_options = [
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
    'happybites_mcp_oauth_grants',
    'happybites_mcp_oauth_clients',
    'happybites_mcp_oauth_rewrite_version',
    'happybites_recaptcha',
    'happybites_demo_seeded',
    'happybites_reviews',
];

foreach ($happybites_options as $happybites_option) {
    delete_option($happybites_option);
}

global $wpdb;

$happybites_posts = get_posts([
    'post_type' => 'happybites_menu_item',
    'post_status' => 'any',
    'posts_per_page' => -1,
    'fields' => 'ids',
]);

foreach ($happybites_posts as $happybites_post_id) {
    wp_delete_post((int) $happybites_post_id, true);
}

$happybites_terms = get_terms([
    'taxonomy' => 'happybites_menu_category',
    'hide_empty' => false,
    'fields' => 'ids',
]);

if (!is_wp_error($happybites_terms)) {
    foreach ($happybites_terms as $happybites_term_id) {
        wp_delete_term((int) $happybites_term_id, 'happybites_menu_category');
    }
}

$happybites_reviews_table = esc_sql($wpdb->prefix . 'happybites_reviews');
// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,PluginCheck.Security.DirectDB.UnescapedDBParameter -- table name is prefix + hardcoded identifier, escaped with esc_sql().
$wpdb->query("DROP TABLE IF EXISTS `{$happybites_reviews_table}`");

wp_cache_flush();
flush_rewrite_rules();
