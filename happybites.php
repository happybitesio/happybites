<?php
/**
 * Plugin Name: HappyBites – QR Code Food Menu
 * Plugin URI: https://happybites.io
 * Description: Create a modern, mobile-friendly QR food menu for your restaurant, fully integrated with WordPress.
     * Version: 2.0.4
 * Requires at least: 5.8
 * Tested up to: 7.1
 * Requires PHP: 7.4
 * Author: HappyBites Team
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: happybites
 * Domain Path: /languages
 *
 * @package HappyBites
 */

if (!defined('ABSPATH')) {
    exit;
}

define('HAPPYBITES_VERSION', '2.0.4');
define('HAPPYBITES_PLUGIN_FILE', __FILE__);
define('HAPPYBITES_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HAPPYBITES_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('HAPPYBITES_PLUGIN_BASENAME', plugin_basename(__FILE__));

require_once HAPPYBITES_PLUGIN_PATH . 'includes/Autoloader.php';

HappyBites\Autoloader::register(HAPPYBITES_PLUGIN_PATH . 'includes');

register_activation_hook(__FILE__, static function () {
    HappyBites\Plugin::activate();
});

register_deactivation_hook(__FILE__, static function () {
    HappyBites\Plugin::deactivate();
});

HappyBites\Plugin::instance();
