<?php
/**
 * React admin mount shell.
 *
 * @package HappyBites
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <div id="happybites-admin-root" data-title="<?php echo esc_attr($title ?? get_admin_page_title()); ?>"></div>
</div>
