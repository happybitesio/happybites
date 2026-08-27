<?php
/**
 * Admin bootstrap.
 *
 * @package HappyBites
 */

namespace HappyBites\Admin;

use HappyBites\Loader;

if (!defined('ABSPATH')) {
    exit;
}

final class Admin
{
    public function register(Loader $loader): void
    {
        (new Panel($loader))->register();
        (new ReactAssets($loader))->register();
        (new ProductEditScreen($loader))->register();
    }
}
