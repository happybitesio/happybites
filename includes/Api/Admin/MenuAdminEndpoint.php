<?php
/**
 * Admin REST: menu tree and ordering.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class MenuAdminEndpoint
{
    private MenuManagementService $service;

    public function __construct(MenuManagementService $service)
    {
        $this->service = $service;
    }

    public function register(): void
    {
        register_rest_route('happybites/v1', '/admin/menu', [
            'methods' => 'GET',
            'callback' => [$this, 'get_tree'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/menu/order', [
            'methods' => 'PUT',
            'callback' => [$this, 'save_order'],
            'permission_callback' => [Permission::class, 'check'],
        ]);
    }

    public function get_tree(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'success' => true,
            'data' => $this->service->get_tree(),
        ], 200);
    }

    public function save_order(WP_REST_Request $request): WP_REST_Response
    {
        $payload = $request->get_json_params();

        if (!is_array($payload)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid request body.', 'happybites'),
            ], 400);
        }

        $result = $this->service->save_order($payload);

        return new WP_REST_Response([
            'success' => true,
            'data' => $result,
        ], 200);
    }
}
