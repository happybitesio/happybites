<?php
/**
 * MCP API token and connection settings.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class McpSettings
{
    public const OPTION_KEY = 'happybites_mcp_settings';

    /**
     * @return array{enabled: bool, token_hash: string, token_prefix: string, created_at: string, last_used_at: string}
     */
    public static function get(): array
    {
        $stored = get_option(self::OPTION_KEY, []);
        if (!is_array($stored)) {
            $stored = [];
        }

        return [
            'enabled' => !empty($stored['enabled']),
            'token_hash' => (string) ($stored['token_hash'] ?? ''),
            'token_prefix' => (string) ($stored['token_prefix'] ?? ''),
            'created_at' => (string) ($stored['created_at'] ?? ''),
            'last_used_at' => (string) ($stored['last_used_at'] ?? ''),
        ];
    }

    /**
     * @return array{enabled: bool, token_hash: string, token_prefix: string, created_at: string, last_used_at: string}
     */
    public static function save(array $data): array
    {
        $current = self::get();
        $next = [
            'enabled' => array_key_exists('enabled', $data) ? (bool) $data['enabled'] : $current['enabled'],
            'token_hash' => (string) ($data['token_hash'] ?? $current['token_hash']),
            'token_prefix' => (string) ($data['token_prefix'] ?? $current['token_prefix']),
            'created_at' => (string) ($data['created_at'] ?? $current['created_at']),
            'last_used_at' => (string) ($data['last_used_at'] ?? $current['last_used_at']),
        ];

        update_option(self::OPTION_KEY, $next);

        return $next;
    }

    public static function set_enabled(bool $enabled): array
    {
        return self::save(['enabled' => $enabled]);
    }

    public static function touch_last_used(): void
    {
        $current = self::get();
        self::save([
            ...$current,
            'last_used_at' => current_time('mysql'),
        ]);
    }

    /**
     * @return array{token: string, settings: array<string, mixed>}
     */
    public static function rotate_token(): array
    {
        $token = 'hb_' . bin2hex(random_bytes(24));
        $settings = self::save([
            'enabled' => true,
            'token_hash' => password_hash($token, PASSWORD_DEFAULT),
            'token_prefix' => substr($token, 0, 12) . '…',
            'created_at' => current_time('mysql'),
            'last_used_at' => '',
        ]);

        return [
            'token' => $token,
            'settings' => $settings,
        ];
    }

    public static function verify_token(string $token): bool
    {
        $settings = self::get();

        if (!$settings['enabled'] || $settings['token_hash'] === '') {
            return false;
        }

        if (!preg_match('/^hb_[a-f0-9]{48}$/', $token)) {
            return false;
        }

        return password_verify($token, $settings['token_hash']);
    }

    /**
     * @return array<string, mixed>
     */
    public static function public_config(): array
    {
        $settings = self::get();

        return [
            'enabled' => $settings['enabled'],
            'has_token' => $settings['token_hash'] !== '',
            'token_prefix' => $settings['token_prefix'],
            'created_at' => $settings['created_at'],
            'last_used_at' => $settings['last_used_at'],
            'mcp_url' => esc_url_raw(rest_url('happybites/v1/mcp')),
            'site_url' => esc_url_raw(home_url('/')),
        ];
    }

    public static function endpoint_url(): string
    {
        return esc_url_raw(rest_url('happybites/v1/mcp'));
    }
}
