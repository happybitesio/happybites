<?php
/**
 * WordPress option keys (backward compatible with v1).
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class Options
{
    public const RESTAURANT_INFO = 'happybites_restaurant_info';
    public const WORKING_HOURS = 'happybites_working_hours';
    public const SOCIAL_MEDIA = 'happybites_social_media';
    public const COLORS = 'happybites_colors';
    public const THEME_MODE = 'happybites_theme_mode';
    public const WIFI = 'happybites_wifi';
    public const INFORMATION = 'happybites_information';
    public const SLUG = 'happybites_slug';
    public const LANGUAGES = 'happybites_languages';
    public const DEFAULT_LANGUAGE = 'happybites_default_language';
    public const DEFAULT_CURRENCY = 'happybites_default_currency';
    public const SETTINGS = 'happybites_settings';
    public const DB_VERSION = 'happybites_db_version';

    /** @var array<string, string> */
    public const ALL = [
        self::RESTAURANT_INFO,
        self::WORKING_HOURS,
        self::SOCIAL_MEDIA,
        self::COLORS,
        self::THEME_MODE,
        self::WIFI,
        self::INFORMATION,
        self::SLUG,
        self::LANGUAGES,
        self::DEFAULT_LANGUAGE,
        self::DEFAULT_CURRENCY,
        self::SETTINGS,
        self::DB_VERSION,
    ];

    public static function active_languages(): array
    {
        $languages = get_option(self::LANGUAGES, ['en']);

        if (is_string($languages)) {
            $languages = [$languages];
        }

        if (!is_array($languages) || empty($languages)) {
            return ['en'];
        }

        return $languages;
    }

    public static function menu_slug(): string
    {
        $opt = get_option(self::SLUG, []);
        $slug = is_array($opt) && !empty($opt['slug']) ? trim((string) $opt['slug']) : 'qrmenu';

        return trim($slug, "/ \t\n\r\0\x0B");
    }
}
