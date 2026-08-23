<?php
/**
 * Admin REST: MCP connection settings (WP admin only).
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\McpSettings;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class McpAdminEndpoint
{
    public function register(): void
    {
        register_rest_route('happybites/v1', '/admin/mcp', [
            'methods' => 'GET',
            'callback' => [$this, 'get'],
            'permission_callback' => [Permission::class, 'check_admin_only'],
        ]);

        register_rest_route('happybites/v1', '/admin/mcp', [
            'methods' => 'PUT',
            'callback' => [$this, 'update'],
            'permission_callback' => [Permission::class, 'check_admin_only'],
        ]);

        register_rest_route('happybites/v1', '/admin/mcp/rotate', [
            'methods' => 'POST',
            'callback' => [$this, 'rotate'],
            'permission_callback' => [Permission::class, 'check_admin_only'],
        ]);
    }

    public function get(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'success' => true,
            'data' => McpSettings::public_config(),
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

        if (array_key_exists('enabled', $params)) {
            McpSettings::set_enabled((bool) $params['enabled']);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => McpSettings::public_config(),
        ], 200);
    }

    public function rotate(WP_REST_Request $request): WP_REST_Response
    {
        $result = McpSettings::rotate_token();

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                ...McpSettings::public_config(),
                'token' => $result['token'],
            ],
            'message' => __('A new MCP token was generated. Copy it now; it will not be shown again.', 'happybites'),
        ], 200);
    }
}
