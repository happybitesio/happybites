<?php
/**
 * Admin REST permission checks.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

if (!defined('ABSPATH')) {
    exit;
}

final class Permission
{
  /**
   * WordPress admin session or valid MCP bearer token.
   *
   * @param mixed $request
   */
    public static function check($request = null): bool
    {
        if (current_user_can('manage_options')) {
            return true;
        }

        return McpAuth::validate_request();
    }

    public static function check_admin_only($request = null): bool
    {
        return current_user_can('manage_options');
    }
}
