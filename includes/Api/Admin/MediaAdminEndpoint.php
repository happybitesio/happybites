<?php
/**
 * Admin REST: media uploads for MCP and admin API.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class MediaAdminEndpoint
{
    public function register(): void
    {
        register_rest_route('happybites/v1', '/admin/media', [
            'methods' => 'POST',
            'callback' => [$this, 'upload'],
            'permission_callback' => [Permission::class, 'check'],
        ]);
    }

    public function upload(WP_REST_Request $request): WP_REST_Response
    {
        $params = $request->get_json_params();

        if (!is_array($params)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid request body.', 'happybites'),
            ], 400);
        }

        $content = trim((string) ($params['content_base64'] ?? ''));

        if ($content === '') {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('content_base64 is required.', 'happybites'),
            ], 400);
        }

        $filename = sanitize_file_name((string) ($params['filename'] ?? 'upload.jpg'));
        $mime_type = sanitize_mime_type((string) ($params['mime_type'] ?? ''));
        $alt_text = sanitize_text_field((string) ($params['alt_text'] ?? ''));

        if ($filename === '') {
            $filename = 'upload.jpg';
        }

        $media = new MediaImportService();
        $attachment_id = $media->import_from_base64($content, $filename, $mime_type, $alt_text);

        if (is_wp_error($attachment_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $attachment_id->get_error_message(),
                'code' => $attachment_id->get_error_code(),
            ], 400);
        }

        $url = wp_get_attachment_url((int) $attachment_id) ?: '';

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'id' => (int) $attachment_id,
                'url' => $url,
                'mime_type' => (string) get_post_mime_type((int) $attachment_id),
                'alt_text' => $alt_text !== '' ? $alt_text : (string) get_post_meta((int) $attachment_id, '_wp_attachment_image_alt', true),
            ],
        ], 201);
    }
}
