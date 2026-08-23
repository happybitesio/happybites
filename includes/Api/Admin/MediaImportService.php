<?php
/**
 * Import remote images into the WordPress media library.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

if (!defined('ABSPATH')) {
    exit;
}

final class MediaImportService
{
    /**
     * @return int|\WP_Error
     */
    public function import_from_url(string $url, string $alt_text = '')
    {
        $url = esc_url_raw(trim($url));

        if ($url === '') {
            return new \WP_Error('invalid_url', __('Image URL cannot be empty.', 'happybites'));
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = download_url($url);

        if (is_wp_error($tmp)) {
            return $tmp;
        }

        $filename = $this->guess_filename($url, $tmp);
        $file_array = [
            'name' => $filename,
            'tmp_name' => $tmp,
        ];

        $attachment_id = media_handle_sideload($file_array, 0);

        if (is_wp_error($attachment_id)) {
            @unlink($tmp);
            return $attachment_id;
        }

        if ($alt_text !== '') {
            update_post_meta((int) $attachment_id, '_wp_attachment_image_alt', sanitize_text_field($alt_text));
        }

        return (int) $attachment_id;
    }

    public function update_alt_text(int $attachment_id, string $alt_text): void
    {
        if ($attachment_id <= 0) {
            return;
        }

        update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($alt_text));
    }

    private function guess_filename(string $url, string $tmp_path): string
    {
        $path = (string) wp_parse_url($url, PHP_URL_PATH);
        $basename = $path !== '' ? basename($path) : '';

        if ($basename !== '' && strpos($basename, '.') !== false) {
            return sanitize_file_name($basename);
        }

        $filetype = wp_check_filetype($tmp_path);

        if (!empty($filetype['ext'])) {
            return 'happybites-' . wp_generate_password(8, false, false) . '.' . $filetype['ext'];
        }

        return 'happybites-' . wp_generate_password(8, false, false) . '.jpg';
    }
}
