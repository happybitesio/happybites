<?php
/**
 * Customer reviews custom table.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class ReviewsTable
{
    public static function table_name(): string
    {
        global $wpdb;

        return $wpdb->prefix . 'happybites_reviews';
    }

    public static function create(): void
    {
        global $wpdb;

        $table = self::table_name();
        $charset_collate = $wpdb->get_charset_collate();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $sql = "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            service TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
            taste TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
            cleanliness TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
            comment TEXT NOT NULL,
            language VARCHAR(16) NOT NULL DEFAULT 'tr',
            customer_name VARCHAR(255) NULL,
            customer_email VARCHAR(255) NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            created_at DATETIME NOT NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            KEY idx_created_at (created_at)
        ) {$charset_collate};";

        dbDelta($sql);

        self::migrate_columns();
    }

    private static function migrate_columns(): void
    {
        global $wpdb;

        $table = self::table_name();
        $columns = $wpdb->get_col("SHOW COLUMNS FROM {$table}", 0);

        if (!$columns) {
            return;
        }

        if (!in_array('is_read', $columns, true)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER created_at");
        }

        if (in_array('status', $columns, true)) {
            $wpdb->query("ALTER TABLE {$table} DROP COLUMN status");
        }
    }

    public static function drop(): void
    {
        global $wpdb;

        $wpdb->query('DROP TABLE IF EXISTS ' . self::table_name());
    }
}
