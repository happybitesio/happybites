<?php
/**
 * Category cover image stored on taxonomy term meta.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class CategoryImage
{
    public const META_KEY = '_category_image_id';

    /**
     * @return array{url: string, alt: string}|null
     */
    public static function for_api(int $term_id): ?array
    {
        $image_id = (int) get_term_meta($term_id, self::META_KEY, true);

        if ($image_id <= 0) {
            return null;
        }

        $url = wp_get_attachment_image_url($image_id, 'medium');

        if (!$url) {
            return null;
        }

        $alt = (string) get_post_meta($image_id, '_wp_attachment_image_alt', true);

        return [
            'url' => $url,
            'alt' => $alt,
        ];
    }

    public static function save(int $term_id, int $image_id): void
    {
        if ($image_id > 0) {
            update_term_meta($term_id, self::META_KEY, $image_id);

            return;
        }

        delete_term_meta($term_id, self::META_KEY);
    }
}
