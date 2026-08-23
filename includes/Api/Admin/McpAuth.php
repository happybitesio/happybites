<?php
/**
 * Bearer token authentication for MCP REST access.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\McpSettings;

if (!defined('ABSPATH')) {
    exit;
}

final class McpAuth
{
    public static function bootstrap(): void
    {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return;
        }

        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $_SERVER['HTTP_AUTHORIZATION'] = sanitize_text_field(wp_unslash($_SERVER['REDIRECT_HTTP_AUTHORIZATION']));
            return;
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (!empty($headers['Authorization'])) {
                $_SERVER['HTTP_AUTHORIZATION'] = sanitize_text_field($headers['Authorization']);
            }
        }
    }

    public static function validate_request(): bool
    {
        self::bootstrap();

        $token = self::get_bearer_token();
        if ($token === null) {
            return false;
        }

        if (!McpSettings::verify_token($token)) {
            return false;
        }

        McpSettings::touch_last_used();

        return true;
    }

    private static function get_bearer_token(): ?string
    {
        $header = isset($_SERVER['HTTP_AUTHORIZATION'])
            ? (string) $_SERVER['HTTP_AUTHORIZATION']
            : '';

        if ($header === '' && isset($_SERVER['Authorization'])) {
            $header = (string) $_SERVER['Authorization'];
        }

        if (preg_match('/Bearer\s+(\S+)/i', $header, $matches) !== 1) {
            return null;
        }

        return trim($matches[1]);
    }
}
