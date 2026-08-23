<?php
/**
 * Shortcode View
 *
 * @package HappyBites
 * @since 1.0.0
 */

// Doğrudan erişimi engelle
if (!defined('ABSPATH')) {
    exit;
}

$type = isset($atts['type']) ? sanitize_text_field($atts['type']) : 'default';
$id = isset($atts['id']) ? sanitize_text_field($atts['id']) : '';
$class = isset($atts['class']) ? sanitize_text_field($atts['class']) : '';

$container_class = 'happybites-container';
if (!empty($class)) {
    $container_class .= ' ' . $class;
}
?>

<div id="<?php echo esc_attr($id); ?>" class="<?php echo esc_attr($container_class); ?>" data-type="<?php echo esc_attr($type); ?>">
    <div class="happybites-content">
        <h3><?php _e('HappyBites', 'happybites'); ?></h3>
        <p><?php _e('Bu bir HappyBites shortcode örneğidir.', 'happybites'); ?></p>
        
        <?php if ($type === 'advanced'): ?>
            <div class="happybites-advanced">
                <p><?php _e('Gelişmiş özellikler burada görüntülenir.', 'happybites'); ?></p>
                <button class="happybites-button" onclick="happybitesAction()">
                    <?php _e('Aksiyon', 'happybites'); ?>
                </button>
            </div>
        <?php endif; ?>
        
        <div class="happybites-footer">
            <small><?php _e('HappyBites Plugin v', 'happybites'); ?><?php echo HAPPYBITES_VERSION; ?></small>
        </div>
    </div>
</div> 