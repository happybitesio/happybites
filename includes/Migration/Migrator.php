<?php
/**
 * Migrates data from HappyBites v1.x.
 *
 * @package HappyBites
 */

namespace HappyBites\Migration;

use HappyBites\Data\Options;
use HappyBites\Data\ReviewsTable;

if (!defined('ABSPATH')) {
    exit;
}

final class Migrator
{
    public const VERSION = '2.0.0';

    public static function run(): void
    {
        $current = get_option(Options::DB_VERSION, '1.0.0');

        if (version_compare($current, self::VERSION, '>=')) {
            return;
        }

        self::migrate_legacy_reviews();
        self::migrate_legacy_settings_flag();

        update_option(Options::DB_VERSION, self::VERSION);
    }

    /**
     * Move option-based reviews into custom table (v1 legacy).
     */
    private static function migrate_legacy_reviews(): void
    {
        global $wpdb;

        $legacy_reviews = get_option('happybites_reviews', []);

        if (!is_array($legacy_reviews) || empty($legacy_reviews)) {
            return;
        }

        $table = ReviewsTable::table_name();

        foreach ($legacy_reviews as $legacy) {
            if (!is_array($legacy)) {
                continue;
            }

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- migrating legacy option rows into the custom table.
            $wpdb->insert(
                $table,
                [
                    'service' => (int) ($legacy['service'] ?? 0),
                    'taste' => (int) ($legacy['taste'] ?? 0),
                    'cleanliness' => (int) ($legacy['cleanliness'] ?? 0),
                    'comment' => (string) ($legacy['comment'] ?? ''),
                    'language' => (string) ($legacy['language'] ?? 'tr'),
                    'customer_name' => (string) ($legacy['customer_name'] ?? ''),
                    'customer_email' => (string) ($legacy['customer_email'] ?? ''),
                    'ip_address' => (string) ($legacy['ip_address'] ?? ''),
                    'user_agent' => (string) ($legacy['user_agent'] ?? ''),
                    'created_at' => (string) ($legacy['created_at'] ?? current_time('mysql')),
                    'is_read' => 0,
                ],
                ['%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d']
            );
        }

        delete_option('happybites_reviews');
    }

    /**
     * Ensure legacy enable flag exists under unified settings key if needed.
     */
    private static function migrate_legacy_settings_flag(): void
    {
        $settings = get_option(Options::SETTINGS, null);

        if ($settings !== null) {
            return;
        }

        update_option(Options::SETTINGS, ['enable' => true]);
    }
}
