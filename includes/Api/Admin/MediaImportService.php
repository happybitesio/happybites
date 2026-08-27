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
     * @var array<int, string>
     */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
    ];

    private const MAX_BYTES = 8388608;

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
            wp_delete_file($tmp);
            return $attachment_id;
        }

        if ($alt_text !== '') {
            update_post_meta((int) $attachment_id, '_wp_attachment_image_alt', sanitize_text_field($alt_text));
        }

        return (int) $attachment_id;
    }

    /**
     * @return int|\WP_Error
     */
    public function import_from_base64(string $content_base64, string $filename, string $mime_type = '', string $alt_text = '')
    {
        [$binary, $mime_type] = $this->decode_base64_payload($content_base64, $mime_type);

        if ($binary === null) {
            return new \WP_Error('invalid_base64', __('Invalid base64 media payload.', 'happybites'));
        }

        $max_bytes = (int) apply_filters('happybites_media_upload_max_bytes', self::MAX_BYTES);

        if (strlen($binary) > $max_bytes) {
            return new \WP_Error(
                'file_too_large',
                sprintf(
                    /* translators: %s: max file size in megabytes */
                    __('File exceeds the maximum upload size of %s MB.', 'happybites'),
                    (string) round($max_bytes / 1048576, 1)
                )
            );
        }

        $filename = sanitize_file_name($filename);

        if ($filename === '') {
            $filename = 'happybites-upload.jpg';
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = wp_tempnam($filename);

        if ($tmp === '') {
            return new \WP_Error('temp_file', __('Could not create a temporary upload file.', 'happybites'));
        }

        $written = file_put_contents($tmp, $binary);

        if ($written === false) {
            wp_delete_file($tmp);
            return new \WP_Error('write_failed', __('Could not write the uploaded file.', 'happybites'));
        }

        $validated = $this->validate_upload($tmp, $filename, $mime_type);

        if (is_wp_error($validated)) {
            wp_delete_file($tmp);
            return $validated;
        }

        $file_array = [
            'name' => $validated['filename'],
            'tmp_name' => $tmp,
            'type' => $validated['mime_type'],
        ];

        $attachment_id = media_handle_sideload($file_array, 0);

        wp_delete_file($tmp);

        if (is_wp_error($attachment_id)) {
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

    /**
     * @return array{0: string|null, 1: string}
     */
    private function decode_base64_payload(string $payload, string $mime_type): array
    {
        $payload = trim($payload);

        if (preg_match('/^data:([^;]+);base64,(.+)$/is', $payload, $matches) === 1) {
            if ($mime_type === '') {
                $mime_type = sanitize_mime_type($matches[1]);
            }

            $payload = $matches[2];
        }

        $payload = preg_replace('/\s+/', '', $payload) ?? '';
        $binary = base64_decode($payload, true);

        if ($binary === false) {
            return [null, $mime_type];
        }

        return [$binary, $mime_type];
    }

    /**
     * @return array{filename: string, mime_type: string}|\WP_Error
     */
    private function validate_upload(string $tmp_path, string $filename, string $mime_type)
    {
        $checked = wp_check_filetype_and_ext($tmp_path, $filename);

        $resolved_mime = sanitize_mime_type((string) ($checked['type'] ?? ''));

        if ($resolved_mime === '' && $mime_type !== '') {
            $resolved_mime = sanitize_mime_type($mime_type);
        }

        if ($resolved_mime === '' || !in_array($resolved_mime, self::ALLOWED_MIME_TYPES, true)) {
            return new \WP_Error(
                'invalid_mime_type',
                __('Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM.', 'happybites')
            );
        }

        if (strpos($resolved_mime, 'image/') === 0 && function_exists('getimagesize')) {
            $image_info = @getimagesize($tmp_path);

            if ($image_info === false) {
                return new \WP_Error('invalid_image', __('The uploaded file is not a valid image.', 'happybites'));
            }
        }

        $resolved_filename = sanitize_file_name((string) ($checked['ext'] !== '' ? $this->ensure_extension($filename, (string) $checked['ext']) : $filename));

        if ($resolved_filename === '') {
            $resolved_filename = 'happybites-upload.' . ($checked['ext'] !== '' ? $checked['ext'] : 'jpg');
        }

        return [
            'filename' => $resolved_filename,
            'mime_type' => $resolved_mime,
        ];
    }

    private function ensure_extension(string $filename, string $extension): string
    {
        $extension = ltrim(strtolower($extension), '.');

        if ($extension === '') {
            return $filename;
        }

        if (preg_match('/\.' . preg_quote($extension, '/') . '$/i', $filename) === 1) {
            return $filename;
        }

        $base = pathinfo($filename, PATHINFO_FILENAME);

        return sanitize_file_name($base . '.' . $extension);
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
