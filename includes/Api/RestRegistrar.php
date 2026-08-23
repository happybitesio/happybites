<?php
/**
 * Registers REST API routes.
 *
 * @package HappyBites
 */

namespace HappyBites\Api;

use HappyBites\Api\Admin\AdminRestRegistrar;
use HappyBites\Loader;
use HappyBites\Mcp\McpHttpEndpoint;

if (!defined('ABSPATH')) {
    exit;
}

final class RestRegistrar
{
    private Loader $loader;

    public function __construct(Loader $loader)
    {
        $this->loader = $loader;
    }

    public function register(): void
    {
        $menu = new MenuEndpoint(new MenuService());
        $review = new ReviewEndpoint();

        $this->loader->add_action('rest_api_init', $menu, 'register');
        $this->loader->add_action('rest_api_init', $review, 'register');
        $this->loader->add_action('rest_api_init', new McpHttpEndpoint(), 'register');

        (new AdminRestRegistrar($this->loader))->register();
    }
}
