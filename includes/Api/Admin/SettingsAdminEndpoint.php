<?php
/**
 * Admin REST: plugin settings.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\MenuDisplaySettings;
use HappyBites\Data\Options;
use HappyBites\Data\RecaptchaSettings;
use HappyBites\Data\ThemePresets;
use HappyBites\Data\ThemeSettings;
use HappyBites\Support\Capabilities;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class SettingsAdminEndpoint
{
    public function register(): void
    {
        register_rest_route('happybites/v1', '/admin/settings', [
            'methods' => 'GET',
            'callback' => [$this, 'get'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/settings', [
            'methods' => 'PUT',
            'callback' => [$this, 'update'],
            'permission_callback' => [Permission::class, 'check'],
        ]);
    }

    public function get(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'success' => true,
            'data' => $this->all_settings(),
        ], 200);
    }

    public function update(WP_REST_Request $request): WP_REST_Response
    {
        $params = $request->get_json_params();

        if (!is_array($params)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid request body.', 'happybites'),
            ], 400);
        }

        if (isset($params['restaurant_info']) && is_array($params['restaurant_info'])) {
            update_option(Options::RESTAURANT_INFO, $this->sanitize_restaurant_info($params['restaurant_info']));
        }

        if (isset($params['working_hours']) && is_array($params['working_hours'])) {
            update_option(Options::WORKING_HOURS, $this->sanitize_working_hours($params['working_hours']));
        }

        if (isset($params['social_media']) && is_array($params['social_media'])) {
            update_option(Options::SOCIAL_MEDIA, $this->sanitize_social_media($params['social_media']));
        }

        if (isset($params['menu_display']) && is_array($params['menu_display'])) {
            MenuDisplaySettings::save($params['menu_display']);
        }

        if (isset($params['colors']) && is_array($params['colors'])) {
            if (Capabilities::colors_require_pro($params['colors'])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('Custom design is a HappyBites Pro feature.', 'happybites'),
                    'code' => 'pro_required',
                ], 403);
            }

            update_option(Options::COLORS, $this->sanitize_colors($params['colors']));
        }

        if (isset($params['theme_mode']) && is_array($params['theme_mode'])) {
            update_option(Options::THEME_MODE, [
                'mode' => in_array($params['theme_mode']['mode'] ?? 'light', ['light', 'dark'], true)
                    ? $params['theme_mode']['mode']
                    : 'light',
            ]);
        }

        if (isset($params['wifi']) && is_array($params['wifi'])) {
            update_option(Options::WIFI, [
                'ssid' => sanitize_text_field($params['wifi']['ssid'] ?? ''),
                'password' => sanitize_text_field($params['wifi']['password'] ?? ''),
            ]);
        }

        if (isset($params['information']) && is_array($params['information'])) {
            update_option(Options::INFORMATION, [
                'html_info' => wp_kses_post($params['information']['html_info'] ?? ''),
            ]);
        }

        if (isset($params['slug']) && is_array($params['slug'])) {
            $slug = sanitize_title($params['slug']['slug'] ?? 'qrmenu');
            update_option(Options::SLUG, ['slug' => $slug]);
        }

        if (isset($params['languages']) && is_array($params['languages'])) {
            $languages = array_values(array_filter(array_map('sanitize_text_field', $params['languages'])));
            update_option(Options::LANGUAGES, $languages);
        }

        if (isset($params['default_language'])) {
            update_option(Options::DEFAULT_LANGUAGE, sanitize_text_field($params['default_language']));
        }

        if (isset($params['default_currency'])) {
            update_option(Options::DEFAULT_CURRENCY, sanitize_text_field($params['default_currency']));
        }

        if (isset($params['recaptcha']) && is_array($params['recaptcha'])) {
            RecaptchaSettings::save($params['recaptcha']);
        }

        flush_rewrite_rules();

        return new WP_REST_Response([
            'success' => true,
            'data' => $this->all_settings(),
        ], 200);
    }

    /**
     * @return array<string, mixed>
     */
    private function all_settings(): array
    {
        $languages = get_option(Options::LANGUAGES, ['en']);
        if (is_string($languages)) {
            $languages = [$languages];
        }

        return [
            'restaurant_info' => get_option(Options::RESTAURANT_INFO, []),
            'working_hours' => $this->sanitize_working_hours(get_option(Options::WORKING_HOURS, [])),
            'social_media' => get_option(Options::SOCIAL_MEDIA, []),
            'colors' => ThemeSettings::normalize(get_option(Options::COLORS, [])),
            'theme_mode' => get_option(Options::THEME_MODE, ['mode' => 'light']),
            'theme_presets' => Capabilities::theme_presets_for_admin(),
            'theme_preset_palettes' => ThemePresets::palettes_for_admin(),
            'palette_keys' => ThemePresets::PALETTE_KEYS,
            'wifi' => get_option(Options::WIFI, []),
            'information' => get_option(Options::INFORMATION, []),
            'slug' => get_option(Options::SLUG, ['slug' => 'qrmenu']),
            'languages' => is_array($languages) ? $languages : ['en'],
            'default_language' => get_option(Options::DEFAULT_LANGUAGE, 'en'),
            'default_currency' => get_option(Options::DEFAULT_CURRENCY, 'TRY'),
            'menu_url' => home_url('/' . Options::menu_slug() . '/'),
            'home_url' => home_url('/'),
            'recaptcha' => RecaptchaSettings::admin_config(),
            'pro' => Capabilities::pro_status(),
            'menu_display' => MenuDisplaySettings::get(),
        ];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function sanitize_restaurant_info(array $data): array
    {
        return [
            'title' => sanitize_text_field($data['title'] ?? ''),
            'logo_url' => esc_url_raw($data['logo_url'] ?? ''),
            'logo_id' => (int) ($data['logo_id'] ?? 0),
            'header_bg_url' => esc_url_raw($data['header_bg_url'] ?? ''),
            'header_bg_id' => (int) ($data['header_bg_id'] ?? 0),
            'slogan' => sanitize_text_field($data['slogan'] ?? ''),
            'privacy_policy_url' => esc_url_raw($data['privacy_policy_url'] ?? ''),
            'show_credit' => !empty($data['show_credit']) && $data['show_credit'] !== '0' && $data['show_credit'] !== false
                ? '1'
                : '0',
        ];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function sanitize_working_hours(array $data): array
    {
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        $out = [];

        foreach ($days as $day) {
            $row = is_array($data[$day] ?? null) ? $data[$day] : [];
            $out[$day] = [
                'is_open' => !empty($row['is_open']) ? 1 : 0,
                'open_time' => sanitize_text_field($row['open_time'] ?? '09:00'),
                'close_time' => sanitize_text_field($row['close_time'] ?? '18:00'),
            ];
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, string>
     */
    private function sanitize_social_media(array $data): array
    {
        $keys = [
            'facebook', 'twitter', 'instagram', 'linkedin', 'youtube',
            'tiktok', 'whatsapp', 'tripadvisor', 'google_business',
        ];
        $out = [];

        foreach ($keys as $key) {
            $out[$key] = esc_url_raw($data[$key] ?? '');
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, string>
     */
    private function sanitize_colors(array $data): array
    {
        return ThemeSettings::sanitize_input($data);
    }
}
