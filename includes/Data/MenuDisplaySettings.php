<?php
/**
 * Guest menu layout preferences (view mode, list style).
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

use HappyBites\Support\Capabilities;

if (!defined('ABSPATH')) {
    exit;
}

final class MenuDisplaySettings
{
    public const OPTION = 'happybites_menu_display';

    /**
     * @return array<string, string>
     */
    public static function defaults(): array
    {
        return [
            'default_view_mode' => 'list',
            'list_style' => 'classic',
            'category_nav_mode' => 'tabs',
            'menu_entry_mode' => 'direct',
            'header_style' => 'classic',
            'stories_enabled' => '0',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function get(): array
    {
        $stored = get_option(self::OPTION, []);

        if (!is_array($stored)) {
            $stored = [];
        }

        return array_merge(self::defaults(), $stored);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, string>
     */
    public static function save(array $input): array
    {
        $data = self::sanitize($input);
        update_option(self::OPTION, $data, false);

        return $data;
    }

    /**
     * @return array<string, string>
     */
    public static function for_api(): array
    {
        $data = self::get();

        return [
            'defaultViewMode' => $data['default_view_mode'],
            'listStyle' => $data['list_style'],
            'categoryNavMode' => $data['category_nav_mode'],
            'menuEntryMode' => $data['menu_entry_mode'],
            'headerStyle' => $data['header_style'],
            'storiesEnabled' => self::is_stories_enabled($data),
        ];
    }

    public static function is_stories_enabled(?array $data = null): bool
    {
        if (!Capabilities::can_stories()) {
            return false;
        }

        if ($data === null) {
            $data = self::get();
        }

        if (array_key_exists('stories_enabled', $data)) {
            return (string) $data['stories_enabled'] === '1';
        }

        // Legacy location used before the dedicated toggle existed.
        $legacy = get_option('happybites_menu_stories', []);

        return is_array($legacy) && !empty($legacy['enabled']);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, string>
     */
    public static function sanitize(array $input): array
    {
        $view = sanitize_key((string) ($input['default_view_mode'] ?? 'list'));
        $style = sanitize_key((string) ($input['list_style'] ?? 'classic'));
        $nav = sanitize_key((string) ($input['category_nav_mode'] ?? 'tabs'));
        $entry = sanitize_key((string) ($input['menu_entry_mode'] ?? 'direct'));
        $header = sanitize_key((string) ($input['header_style'] ?? 'classic'));
        $stories_enabled = !empty($input['stories_enabled']) ? '1' : '0';

        if ($stories_enabled === '1' && !Capabilities::can_stories()) {
            $stories_enabled = '0';
        }

        if (!in_array($view, ['list', 'bento'], true)) {
            $view = 'list';
        }

        if (!in_array($style, ['classic', 'compact', 'card'], true)) {
            $style = 'classic';
        }

        if (!in_array($nav, ['tabs', 'scroll'], true)) {
            $nav = 'tabs';
        }

        if (!in_array($entry, ['direct', 'categories'], true)) {
            $entry = 'direct';
        }

        if (!in_array($header, ['classic', 'centered'], true)) {
            $header = 'classic';
        }

        return [
            'default_view_mode' => $view,
            'list_style' => $style,
            'category_nav_mode' => $nav,
            'menu_entry_mode' => $entry,
            'header_style' => $header,
            'stories_enabled' => $stories_enabled,
        ];
    }
}
