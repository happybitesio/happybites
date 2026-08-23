<?php
/**
 * REST: customer review endpoint.
 *
 * @package HappyBites
 */

namespace HappyBites\Api;

use HappyBites\Data\ReviewsTable;
use HappyBites\Security\RecaptchaVerifier;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class ReviewEndpoint
{
    private const RATE_LIMIT_WINDOW = 3600;
    private const RATE_LIMIT_MAX = 5;

    public function register(): void
    {
        register_rest_route('happybites/v1', '/review', [
            'methods' => 'POST',
            'callback' => [$this, 'handle'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle(WP_REST_Request $request): WP_REST_Response
    {
        if ($this->is_rate_limited()) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Too many reviews submitted. Please try again later.', 'happybites'),
            ], 429);
        }

        $params = $request->get_params();
        $recaptcha = RecaptchaVerifier::verify((string) ($params['recaptcha_token'] ?? ''), 'review_submit');

        if (is_wp_error($recaptcha)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $recaptcha->get_error_message(),
            ], 403);
        }

        $required = ['service', 'taste', 'cleanliness', 'language'];

        foreach ($required as $field) {
            if (!isset($params[$field])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Missing required field: ' . $field,
                ], 400);
            }
        }

        $service = (int) $params['service'];
        $taste = (int) $params['taste'];
        $cleanliness = (int) $params['cleanliness'];

        foreach ([$service, $taste, $cleanliness] as $score) {
            if ($score < 1 || $score > 5) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('Ratings must be between 1 and 5.', 'happybites'),
                ], 400);
            }
        }

        $comment = sanitize_textarea_field((string) ($params['comment'] ?? ''));

        if (strlen($comment) > 2000) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Comment is too long.', 'happybites'),
            ], 400);
        }

        global $wpdb;

        $inserted = $wpdb->insert(
            ReviewsTable::table_name(),
            [
                'service' => $service,
                'taste' => $taste,
                'cleanliness' => $cleanliness,
                'comment' => $comment,
                'language' => sanitize_text_field($params['language']),
                'customer_name' => isset($params['customerName']) ? sanitize_text_field($params['customerName']) : '',
                'customer_email' => isset($params['customerEmail']) ? sanitize_email($params['customerEmail']) : '',
                'ip_address' => $this->client_ip(),
                'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '',
                'created_at' => current_time('mysql'),
                'is_read' => 0,
            ],
            ['%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d']
        );

        if ($inserted === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Failed to save review',
            ], 500);
        }

        $this->record_submission();

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Review saved successfully',
            'data' => [
                'review_id' => (int) $wpdb->insert_id,
            ],
        ], 200);
    }

    private function is_rate_limited(): bool
    {
        $ip = $this->client_ip();
        $key = 'hb_review_' . md5($ip);
        $count = (int) get_transient($key);

        return $count >= self::RATE_LIMIT_MAX;
    }

    private function record_submission(): void
    {
        $ip = $this->client_ip();
        $key = 'hb_review_' . md5($ip);
        $count = (int) get_transient($key);

        set_transient($key, $count + 1, self::RATE_LIMIT_WINDOW);
    }

    private function client_ip(): string
    {
        $keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];

        foreach ($keys as $key) {
            if (!empty($_SERVER[$key])) {
                foreach (explode(',', (string) $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);

                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                        return $ip;
                    }
                }
            }
        }

        return isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
    }
}
