<?php
/**
 * Privacy policy URL helpers.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class Privacy
{
    /**
     * The restaurant's own privacy policy URL.
     *
     * Falls back to the site's WordPress privacy policy page (Settings →
     * Privacy). Returns an empty string when neither is configured, in which
     * case the guest menu hides the link entirely.
     */
    public static function policy_url(): string
    {
        $info = get_option(Options::RESTAURANT_INFO, []);

        if (is_array($info)) {
            $url = esc_url_raw((string) ($info['privacy_policy_url'] ?? ''));

            if ($url !== '') {
                return $url;
            }
        }

        return esc_url_raw((string) get_privacy_policy_url());
    }
}
