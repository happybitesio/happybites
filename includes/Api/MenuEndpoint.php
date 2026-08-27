<?php
/**
 * REST: menu endpoint.
 *
 * @package HappyBites
 */

namespace HappyBites\Api;

use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class MenuEndpoint
{
    private MenuService $service;

    private MenuSitemapService $sitemap;

    public function __construct(MenuService $service)
    {
        $this->service = $service;
        $this->sitemap = new MenuSitemapService();
    }

    public function register(): void
    {
        register_rest_route('happybites/v1', '/menu', [
            'methods' => 'GET',
            'callback' => [$this, 'handle'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('happybites/v1', '/menu/sitemap', [
            'methods' => 'GET',
            'callback' => [$this, 'sitemap'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle(WP_REST_Request $request): WP_REST_Response
    {
        $response = new WP_REST_Response($this->service->get_payload(), 200);
        $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

        return $response;
    }

    public function sitemap(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'success' => true,
            'data' => $this->sitemap->get(),
        ], 200);
    }
}
