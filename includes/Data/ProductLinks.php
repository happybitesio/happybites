<?php
/**
 * Public URLs for menu entities.
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class ProductLinks
{
    public static function menu_url(): string
    {
        return home_url('/' . Options::menu_slug() . '/');
    }

    public static function product_url(int $product_id): string
    {
        if ($product_id <= 0) {
            return self::menu_url();
        }

        return add_query_arg('product', $product_id, self::menu_url());
    }

    public static function category_url(string $category_slug): string
    {
        $slug = sanitize_title($category_slug);

        if ($slug === '') {
            return self::menu_url();
        }

        return add_query_arg('category', $slug, self::menu_url());
    }
}
