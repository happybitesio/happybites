<?php
/**
 * Registers admin REST API routes.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Loader;

if (!defined('ABSPATH')) {
    exit;
}

final class AdminRestRegistrar
{
    private Loader $loader;

    public function __construct(Loader $loader)
    {
        $this->loader = $loader;
    }

    public function register(): void
    {
        $menu_service = new MenuManagementService();
        $endpoints = [
            new MenuAdminEndpoint($menu_service),
            new CategoryAdminEndpoint(),
            new ProductAdminEndpoint(),
            new SettingsAdminEndpoint(),
            new ReviewsAdminEndpoint(),
            new McpAdminEndpoint(),
        ];

        foreach ($endpoints as $endpoint) {
            $this->loader->add_action('rest_api_init', $endpoint, 'register');
        }
    }
}
