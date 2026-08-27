<?php
/**
 * Admin REST: product CRUD.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\PostTypes;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class ProductAdminEndpoint
{
    private ProductDetailsService $details;

    public function __construct()
    {
        $this->details = new ProductDetailsService();
    }

    public function register(): void
    {
        register_rest_route('happybites/v1', '/admin/products', [
            'methods' => 'POST',
            'callback' => [$this, 'create'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/products/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/products/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/products/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/products/(?P<id>\d+)/image', [
            'methods' => 'PUT',
            'callback' => [$this, 'set_image'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/products/(?P<id>\d+)/status', [
            'methods' => 'PATCH',
            'callback' => [$this, 'set_status'],
            'permission_callback' => [Permission::class, 'check'],
        ]);
    }

    public function get(WP_REST_Request $request): WP_REST_Response
    {
        $product_id = (int) $request->get_param('id');
        $product = $this->details->get($product_id);

        if ($product === null) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Product not found.', 'happybites'),
            ], 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $product,
        ], 200);
    }

    public function create(WP_REST_Request $request): WP_REST_Response
    {
        return $this->save($request, 0);
    }

    public function update(WP_REST_Request $request): WP_REST_Response
    {
        return $this->save($request, (int) $request->get_param('id'));
    }

    public function delete(WP_REST_Request $request): WP_REST_Response
    {
        $product_id = (int) $request->get_param('id');
        $post = get_post($product_id);

        if (!$post || $post->post_type !== PostTypes::POST_TYPE) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Product not found.', 'happybites'),
            ], 404);
        }

        $result = wp_delete_post($product_id, true);

        if (!$result) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to delete product.', 'happybites'),
            ], 400);
        }

        return new WP_REST_Response([
            'success' => true,
        ], 200);
    }

    public function set_status(WP_REST_Request $request): WP_REST_Response
    {
        $product_id = (int) $request->get_param('id');
        $params = $request->get_json_params();

        if (!is_array($params)) {
            $params = [];
        }

        $status = $params['status'] ?? $request->get_param('status') ?? '';
        $result = $this->details->set_status($product_id, (string) $status);

        if (is_wp_error($result)) {
            $code = $result->get_error_code() === 'not_found' ? 404 : 400;

            return new WP_REST_Response([
                'success' => false,
                'message' => $result->get_error_message(),
            ], $code);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $result,
        ], 200);
    }

    public function set_image(WP_REST_Request $request): WP_REST_Response
    {
        $product_id = (int) $request->get_param('id');
        $params = $request->get_json_params();

        if (!is_array($params)) {
            $params = [];
        }

        $result = $this->details->set_image($product_id, $params);

        if (is_wp_error($result)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $result->get_error_message(),
            ], 400);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $result,
        ], 200);
    }

    private function save(WP_REST_Request $request, int $product_id): WP_REST_Response
    {
        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $result_id = $this->details->save($product_id, $params);

        if (is_wp_error($result_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $result_id->get_error_message(),
            ], 400);
        }

        $product = $this->details->get((int) $result_id);

        return new WP_REST_Response([
            'success' => true,
            'data' => array_merge($product ?? [], [
                'mode' => $product_id > 0 ? 'updated' : 'created',
            ]),
        ], $product_id > 0 ? 200 : 201);
    }
}

