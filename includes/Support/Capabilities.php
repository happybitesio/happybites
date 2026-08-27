<?php
/**
 * Feature capability gates.
 *
 * The free plugin ships no Pro feature code. Every gate below defaults to
 * "not available" and can be enabled by the HappyBites Pro plugin through
 * the corresponding filter.
 *
 * @package HappyBites
 */

namespace HappyBites\Support;

use HappyBites\Data\ThemePresets;
use HappyBites\Data\ThemeSettings;

if (!defined('ABSPATH')) {
    exit;
}

final class Capabilities
{
    /** Fallback upsell URL when Pro is not installed. */
    public const CHECKOUT_URL = 'https://happybites.io/checkout?utm_source=happybites-plugin&utm_medium=admin-upsell&utm_campaign=pro-checkout';

    public static function is_pro(): bool
    {
        return (bool) apply_filters('happybites_is_pro', false);
    }

    public static function can_mcp(): bool
    {
        return (bool) apply_filters('happybites_can_mcp', false);
    }

    public static function can_custom_design(): bool
    {
        return (bool) apply_filters('happybites_can_custom_design', false);
    }

    public static function can_stories(): bool
    {
        return (bool) apply_filters('happybites_can_stories', false);
    }

    public static function checkout_url(): string
    {
        return (string) apply_filters('happybites_checkout_url', self::CHECKOUT_URL);
    }

    /**
     * Pro status block for admin API responses.
     *
     * When Pro is installed it replaces this via the happybites_pro_status
     * filter with real license details.
     *
     * @return array<string, mixed>
     */
    public static function pro_status(): array
    {
        $default = [
            'is_pro' => self::is_pro(),
            'pro_installed' => false,
            'checkout_url' => self::checkout_url(),
            'license_key_masked' => '',
            'status' => 'inactive',
            'expires_at' => '',
            'last_check' => 0,
            'features' => [
                'mcp' => self::can_mcp(),
                'custom_design' => self::can_custom_design(),
                'stories' => self::can_stories(),
            ],
        ];

        $status = apply_filters('happybites_pro_status', $default);

        return is_array($status) ? $status : $default;
    }

    /**
     * Whether a colors payload needs Pro to be saved.
     *
     * Free installs may only use unmodified built-in presets.
     *
     * @param array<string, mixed> $data
     */
    public static function colors_require_pro(array $data): bool
    {
        if (self::can_custom_design()) {
            return false;
        }

        $preset_id = sanitize_key((string) ($data['preset'] ?? 'verdant_brew'));

        if ($preset_id === 'custom') {
            return true;
        }

        $presets = ThemePresets::all();

        if (!isset($presets[$preset_id])) {
            return false;
        }

        $defaults = $presets[$preset_id];

        if (!empty($data['light']) && is_array($data['light'])) {
            $light = ThemeSettings::sanitize_input(['preset' => $preset_id, 'light' => $data['light']])['light'];
            if ($light !== $defaults['light']) {
                return true;
            }
        }

        if (!empty($data['dark']) && is_array($data['dark'])) {
            $dark = ThemeSettings::sanitize_input(['preset' => $preset_id, 'dark' => $data['dark']])['dark'];
            if ($dark !== $defaults['dark']) {
                return true;
            }
        }

        return false;
    }

    /**
     * Theme presets available to the current install.
     *
     * @return array<int, array<string, string>>
     */
    public static function theme_presets_for_admin(): array
    {
        if (self::can_custom_design()) {
            return ThemePresets::for_admin();
        }

        $out = [];

        foreach (ThemePresets::for_admin() as $preset) {
            if (($preset['id'] ?? '') === 'custom') {
                continue;
            }

            $out[] = $preset;
        }

        return $out;
    }
}
