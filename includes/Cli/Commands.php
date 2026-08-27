<?php
/**
 * WP-CLI commands for HappyBites.
 *
 * @package HappyBites
 */

namespace HappyBites\Cli;

use HappyBites\Migration\DemoSeeder;
use HappyBites\Migration\ReviewSeeder;

if (!defined('ABSPATH')) {
    exit;
}

final class Commands
{
    public static function register(): void
    {
        if (!class_exists('WP_CLI')) {
            return;
        }

        \WP_CLI::add_command('happybites seed-demo', [self::class, 'seed_demo']);
        \WP_CLI::add_command('happybites seed-reviews', [self::class, 'seed_reviews']);
    }

    /**
     * @param array<int, string> $args
     * @param array<string, mixed> $assoc_args
     */
    public static function seed_demo(array $args, array $assoc_args): void
    {
        $force = isset($assoc_args['force']);
        $seeded = DemoSeeder::run($force);

        if ($seeded) {
            \WP_CLI::success('Demo ayarları ve temel menü oluşturuldu.');
            return;
        }

        \WP_CLI::warning('Demo zaten oluşturulmuş. Yeniden oluşturmak için --force kullanın.');
    }

    /**
     * @param array<int, string> $args
     * @param array<string, mixed> $assoc_args
     */
    public static function seed_reviews(array $args, array $assoc_args): void
    {
        $force = isset($assoc_args['force']);
        $result = ReviewSeeder::run($force);

        if ($result['skipped']) {
            \WP_CLI::warning('Yorumlar zaten mevcut. Yeniden oluşturmak için --force kullanın.');
            return;
        }

        \WP_CLI::success(sprintf('%d örnek yorum eklendi.', $result['created']));
    }
}
