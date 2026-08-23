<?php
/**
 * Main plugin orchestrator.
 *
 * @package HappyBites
 */

namespace HappyBites;

use HappyBites\Admin\Admin;
use HappyBites\Admin\ListColumns;
use HappyBites\Admin\MetaBoxes;
use HappyBites\Api\RestRegistrar;
use HappyBites\Data\PostTypes;
use HappyBites\Data\ReviewsTable;
use HappyBites\Data\Taxonomy;
use HappyBites\Api\Admin\McpAuth;
use HappyBites\Cli\Commands;
use HappyBites\Frontend\Router;
use HappyBites\Migration\Migrator;
use HappyBites\Public\Assets;

if (!defined('ABSPATH')) {
    exit;
}

final class Plugin
{
    private static ?self $instance = null;

    private Loader $loader;

    private function __construct()
    {
        $this->loader = new Loader();
        $this->register_hooks();
    }

    public static function instance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public static function activate(): void
    {
        PostTypes::register();
        Taxonomy::register();

        ReviewsTable::create();
        Migrator::run();

        Router::activate();
    }

    public static function deactivate(): void
    {
        Router::deactivate();
    }

    private function register_hooks(): void
    {
        $this->loader->add_action('init', $this, 'boot', 0);
        $this->loader->add_action('plugins_loaded', $this, 'load_textdomain');
        $this->loader->run();
    }

    public function load_textdomain(): void
    {
        load_plugin_textdomain(
            'happybites',
            false,
            dirname(HAPPYBITES_PLUGIN_BASENAME) . '/languages'
        );
    }

    public function boot(): void
    {
        McpAuth::bootstrap();

        PostTypes::register();
        Taxonomy::register();

        (new RestRegistrar($this->loader))->register();
        (new Router($this->loader))->register();
        (new Assets($this->loader))->register();

        if (is_admin()) {
            (new Admin())->register($this->loader);
            (new MetaBoxes($this->loader))->register();
            (new ListColumns($this->loader))->register();
        }

        Commands::register();

        $this->loader->run();

        do_action('happybites_init');
    }
}
