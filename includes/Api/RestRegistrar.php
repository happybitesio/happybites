<?php
/**
 * Registers REST API routes.
 *
 * @package HappyBites
 */

namespace HappyBites\Api;

use HappyBites\Api\Admin\AdminRestRegistrar;
use HappyBites\Loader;

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

        (new AdminRestRegistrar($this->loader))->register();

        /**
         * Extension point: add-ons register their own REST endpoints here.
         *
         * @param Loader $loader Hook loader shared with the free plugin boot.
         */
        do_action('happybites_register_rest_routes', $this->loader);
    }
}
