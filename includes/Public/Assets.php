<?php
/**
 * Public-facing assets and shortcodes.
 *
 * @package HappyBites
 */

namespace HappyBites\Public;

use HappyBites\Data\Options;
use HappyBites\Loader;

if (!defined('ABSPATH')) {
    exit;
}

final class Assets
{
    private Loader $loader;

    public function __construct(Loader $loader)
    {
        $this->loader = $loader;
    }

    public function register(): void
    {
        $this->loader->add_shortcode('happybites_qr_menu', $this, 'qr_menu_shortcode');
        $this->loader->add_shortcode('happybites', $this, 'qr_menu_shortcode');
    }

    private function enqueue_shortcode_style(): void
    {
        wp_enqueue_style(
            'happybites-public',
            HAPPYBITES_PLUGIN_URL . 'public/css/public.css',
            [],
            HAPPYBITES_VERSION
        );
    }

    /**
     * @param array<string, string> $atts
     */
    public function qr_menu_shortcode(array $atts = []): string
    {
        $atts = shortcode_atts([
            'title' => __('QR Menu', 'happybites'),
            'description' => __('Scan the QR code to view the mobile menu', 'happybites'),
            'button_text' => __('Open QR Menu', 'happybites'),
            'class' => '',
        ], $atts, 'happybites_qr_menu');

        $menu_url = home_url('/' . Options::menu_slug() . '/');

        $this->enqueue_shortcode_style();

        ob_start();
        ?>
        <div class="happybites-qr-menu-container <?php echo esc_attr($atts['class']); ?>">
            <div class="qr-menu-content">
                <h3 class="qr-menu-title"><?php echo esc_html($atts['title']); ?></h3>
                <p class="qr-menu-description"><?php echo esc_html($atts['description']); ?></p>
                <div class="qr-menu-actions">
                    <a href="<?php echo esc_url($menu_url); ?>" target="_blank" rel="noopener noreferrer" class="qr-menu-button">
                        <?php echo esc_html($atts['button_text']); ?>
                    </a>
                </div>
            </div>
        </div>
        <?php

        return (string) ob_get_clean();
    }
}
