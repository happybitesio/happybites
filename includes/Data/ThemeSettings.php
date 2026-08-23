<?php
/**
 * Normalize and resolve stored theme / color options.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class ThemeSettings
{
    public const DEFAULT_HEADER_OVERLAY = [
        'light' => 65,
        'dark' => 70,
    ];

    /**
     * @param array<string, mixed> $stored
     * @return array<string, mixed>
     */
    public static function normalize(array $stored): array
    {
        $presets = ThemePresets::all();
        $preset_id = isset($stored['preset']) ? sanitize_key((string) $stored['preset']) : 'verdant_brew';

        if (!isset($presets[$preset_id])) {
            $preset_id = 'verdant_brew';
        }

        $preset = $presets[$preset_id];
        $light = self::sanitize_palette($preset['light']);
        $dark = self::sanitize_palette($preset['dark']);

        if ($preset_id === 'custom') {
            if (!empty($stored['light']) && is_array($stored['light'])) {
                $light = self::merge_palette($light, $stored['light']);
            }
            if (!empty($stored['dark']) && is_array($stored['dark'])) {
                $dark = self::merge_palette($dark, $stored['dark']);
            }
        }

        // Backward compatibility with legacy active_color / accent_color fields.
        if (!empty($stored['active_color'])) {
            $primary = sanitize_hex_color((string) $stored['active_color']);
            if ($primary) {
                $light['primary'] = $primary;
                if ($preset_id !== 'custom' && empty($stored['dark']['primary'])) {
                    $dark['primary'] = $primary;
                }
            }
        }

        if (!empty($stored['accent_color'])) {
            $accent = sanitize_hex_color((string) $stored['accent_color']);
            if ($accent) {
                $light['accent'] = $accent;
                if ($preset_id !== 'custom' && empty($stored['dark']['accent'])) {
                    $dark['accent'] = $accent;
                }
            }
        }

        return [
            'preset' => $preset_id,
            'active_color' => $light['primary'],
            'accent_color' => $light['accent'],
            'light' => $light,
            'dark' => $dark,
            'appearance' => self::normalize_appearance($stored['appearance'] ?? [], $light, $dark),
        ];
    }

    /**
     * @param array<string, mixed> $stored
     * @return array<string, mixed>
     */
    public static function for_api(array $stored): array
    {
        $normalized = self::normalize($stored);

        return [
            'preset' => $normalized['preset'],
            'light' => $normalized['light'],
            'dark' => $normalized['dark'],
            'appearance' => $normalized['appearance'],
        ];
    }

    /**
     * @param array<string, mixed> $stored
     * @return array<string, mixed>
     */
    public static function appearance_for_api(array $stored): array
    {
        $normalized = self::normalize($stored);

        return $normalized['appearance'];
    }

    /**
     * @param array<string, mixed> $stored
     * @return array<string, string>
     */
    public static function palette_for_mode(array $stored, string $mode): array
    {
        $normalized = self::normalize($stored);

        return $mode === 'dark' ? $normalized['dark'] : $normalized['light'];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public static function sanitize_input(array $data): array
    {
        $presets = ThemePresets::all();
        $preset_id = isset($data['preset']) ? sanitize_key((string) $data['preset']) : 'verdant_brew';

        if (!isset($presets[$preset_id])) {
            $preset_id = 'verdant_brew';
        }

        $preset = $presets[$preset_id];
        $light = self::sanitize_palette($preset['light']);
        $dark = self::sanitize_palette($preset['dark']);

        if ($preset_id === 'custom') {
            if (!empty($data['light']) && is_array($data['light'])) {
                $light = self::merge_palette($light, $data['light']);
            }
            if (!empty($data['dark']) && is_array($data['dark'])) {
                $dark = self::merge_palette($dark, $data['dark']);
            }
        }

        $appearance = self::DEFAULT_HEADER_OVERLAY;
        if (!empty($data['appearance']) && is_array($data['appearance'])) {
            $appearance = self::sanitize_appearance_input($data['appearance'], $light, $dark);
        } else {
            $appearance = self::normalize_appearance([], $light, $dark);
        }

        return [
            'preset' => $preset_id,
            'active_color' => $light['primary'],
            'accent_color' => $light['accent'],
            'light' => $light,
            'dark' => $dark,
            'appearance' => $appearance,
        ];
    }

    /**
     * @param array<string, mixed> $appearance
     * @param array<string, string> $light
     * @param array<string, string> $dark
     * @return array<string, mixed>
     */
    private static function normalize_appearance(array $appearance, array $light, array $dark): array
    {
        $theme_color = is_array($appearance['theme_color'] ?? null) ? $appearance['theme_color'] : [];
        $header_overlay = is_array($appearance['header_overlay'] ?? null) ? $appearance['header_overlay'] : [];

        $light_color = sanitize_hex_color((string) ($theme_color['light'] ?? ''));
        $dark_color = sanitize_hex_color((string) ($theme_color['dark'] ?? ''));

        return [
            'theme_color' => [
                'light' => $light_color ?: ($light['background'] ?? '#ffffff'),
                'dark' => $dark_color ?: ($dark['background'] ?? '#121212'),
            ],
            'header_overlay' => [
                'light' => self::sanitize_overlay($header_overlay['light'] ?? self::DEFAULT_HEADER_OVERLAY['light']),
                'dark' => self::sanitize_overlay($header_overlay['dark'] ?? self::DEFAULT_HEADER_OVERLAY['dark']),
            ],
        ];
    }

    /**
     * @param array<string, mixed> $appearance
     * @param array<string, string> $light
     * @param array<string, string> $dark
     * @return array<string, mixed>
     */
    private static function sanitize_appearance_input(array $appearance, array $light, array $dark): array
    {
        return self::normalize_appearance($appearance, $light, $dark);
    }

    private static function sanitize_overlay(mixed $value): int
    {
        if (!is_numeric($value)) {
            return self::DEFAULT_HEADER_OVERLAY['light'];
        }

        return max(0, min(100, (int) $value));
    }

    /**
     * @param array<string, mixed> $base
     * @param array<string, mixed> $overrides
     * @return array<string, string>
     */
    private static function merge_palette(array $base, array $overrides): array
    {
        $merged = self::sanitize_palette($base);

        foreach (ThemePresets::PALETTE_KEYS as $key) {
            if (!isset($overrides[$key])) {
                continue;
            }

            $color = sanitize_hex_color((string) $overrides[$key]);
            if ($color) {
                $merged[$key] = $color;
            }
        }

        return $merged;
    }

    /**
     * @param array<string, mixed> $palette
     * @return array<string, string>
     */
    private static function sanitize_palette(array $palette): array
    {
        $defaults = ThemePresets::all()['verdant_brew'];
        $fallback_light = $defaults['light'];
        $out = [];

        foreach (ThemePresets::PALETTE_KEYS as $key) {
            $fallback = $fallback_light[$key] ?? '#000000';
            $color = sanitize_hex_color((string) ($palette[$key] ?? $fallback));

            $out[$key] = $color ?: $fallback;
        }

        return $out;
    }
}
