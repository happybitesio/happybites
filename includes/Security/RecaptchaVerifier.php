<?php
/**
 * Verify Google reCAPTCHA v3 tokens.
 *
 * @package HappyBites
 */

namespace HappyBites\Security;

use HappyBites\Data\RecaptchaSettings;

if (!defined('ABSPATH')) {
    exit;
}

final class RecaptchaVerifier
{
    private const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
    private const MIN_SCORE = 0.5;

    /**
     * @return true|\WP_Error
     */
    public static function verify(string $token, string $action = 'review_submit')
    {
        if (!RecaptchaSettings::is_enabled()) {
            return true;
        }

        $token = trim($token);

        if ($token === '') {
            return new \WP_Error('recaptcha_missing', __('reCAPTCHA verification is required.', 'happybites'));
        }

        $settings = RecaptchaSettings::get();

        $response = wp_remote_post(self::VERIFY_URL, [
            'timeout' => 10,
            'body' => [
                'secret' => $settings['secret_key'],
                'response' => $token,
                'remoteip' => self::client_ip(),
            ],
        ]);

        if (is_wp_error($response)) {
            return new \WP_Error('recaptcha_request_failed', __('reCAPTCHA verification failed.', 'happybites'));
        }

        $payload = json_decode((string) wp_remote_retrieve_body($response), true);

        if (!is_array($payload) || empty($payload['success'])) {
            return new \WP_Error('recaptcha_invalid', __('reCAPTCHA verification is invalid.', 'happybites'));
        }

        $score = isset($payload['score']) ? (float) $payload['score'] : 0.0;
        $payload_action = (string) ($payload['action'] ?? '');

        if ($payload_action !== '' && $payload_action !== $action) {
            return new \WP_Error('recaptcha_action_mismatch', __('reCAPTCHA verification is invalid.', 'happybites'));
        }

        if ($score < self::MIN_SCORE) {
            return new \WP_Error('recaptcha_low_score', __('Security verification failed. Please try again.', 'happybites'));
        }

        return true;
    }

    private static function client_ip(): string
    {
        if (!isset($_SERVER['REMOTE_ADDR'])) {
            return '0.0.0.0';
        }

        $remote = sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR']));

        return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '0.0.0.0';
    }
}
