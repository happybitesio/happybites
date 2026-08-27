<?php
/**
 * PSR-4 style autoloader for HappyBites namespace.
 *
 * @package HappyBites
 */

namespace HappyBites;

if (!defined('ABSPATH')) {
    exit;
}

final class Autoloader
{
    /** @var string */
    private static $base_dir;

    public static function register(string $base_dir): void
    {
        self::$base_dir = rtrim($base_dir, '/\\') . DIRECTORY_SEPARATOR;
        spl_autoload_register([self::class, 'load']);
    }

    public static function load(string $class): void
    {
        $prefix = 'HappyBites\\';

        if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
            return;
        }

        $relative = substr($class, strlen($prefix));
        $file = self::$base_dir . str_replace('\\', DIRECTORY_SEPARATOR, $relative) . '.php';

        if (is_readable($file)) {
            require_once $file;
        }
    }
}
