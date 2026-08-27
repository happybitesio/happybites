<?php
/**
 * Google reCAPTCHA v3 settings helpers.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class RecaptchaSettings
{
    public const OPTION_KEY = 'happybites_recaptcha';

    /**
     * @return array{site_key: string, secret_key: string}
     */
    public static function get(): array
    {
        $stored = get_option(self::OPTION_KEY, []);
        if (!is_array($stored)) {
            $stored = [];
        }

        return [
            'site_key' => sanitize_text_field((string) ($stored['site_key'] ?? '')),
            'secret_key' => (string) ($stored['secret_key'] ?? ''),
        ];
    }

    /**
     * @param array<string, mixed> $data
     * @return array{site_key: string, secret_key: string}
     */
    public static function save(array $data): array
    {
        $current = self::get();
        $next = [
            'site_key' => array_key_exists('site_key', $data)
                ? sanitize_text_field((string) $data['site_key'])
                : $current['site_key'],
            'secret_key' => $current['secret_key'],
        ];

        if (!empty($data['secret_key'])) {
            $next['secret_key'] = sanitize_text_field((string) $data['secret_key']);
        }

        update_option(self::OPTION_KEY, $next);

        return $next;
    }

    public static function is_enabled(): bool
    {
        $settings = self::get();

        return $settings['site_key'] !== '' && $settings['secret_key'] !== '';
    }

  /**
   * @return array{enabled: bool, site_key: string, has_secret_key: bool}
   */
    public static function public_config(): array
    {
        $settings = self::get();

        return [
            'enabled' => self::is_enabled(),
            'site_key' => $settings['site_key'],
        ];
    }

    /**
     * @return array{site_key: string, has_secret_key: bool}
   */
    public static function admin_config(): array
    {
        $settings = self::get();

        return [
            'site_key' => $settings['site_key'],
            'has_secret_key' => $settings['secret_key'] !== '',
        ];
    }
}
