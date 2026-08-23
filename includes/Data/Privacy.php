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
    public const DEFAULT_POLICY_URL = 'https://happybites.io/privacy-policy';

    public static function policy_url(): string
    {
        $info = get_option(Options::RESTAURANT_INFO, []);

        if (!is_array($info)) {
            return self::DEFAULT_POLICY_URL;
        }

        $url = esc_url_raw((string) ($info['privacy_policy_url'] ?? ''));

        return $url !== '' ? $url : self::DEFAULT_POLICY_URL;
    }
}
