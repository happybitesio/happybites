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
   * WordPress admin session or add-on provided token auth.
   *
   * @param mixed $request
   */
    public static function check($request = null): bool
    {
        if (current_user_can('manage_options')) {
            return true;
        }

        /**
         * Extension point: add-ons (HappyBites Pro MCP) may authenticate
         * admin REST requests with their own bearer tokens.
         *
         * @param bool $authenticated Whether the request is authenticated.
         */
        return (bool) apply_filters('happybites_rest_token_auth', false);
    }

    public static function check_admin_only($request = null): bool
    {
        return current_user_can('manage_options');
    }
}
