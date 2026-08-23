<?php
/**
 * Seeds demo menu data for local development.
 *
 * @package HappyBites
 */

namespace HappyBites\Migration;

use HappyBites\Data\Options;
use HappyBites\Data\PostTypes;
use HappyBites\Data\Taxonomy;

if (!defined('ABSPATH')) {
    exit;
}

final class DemoSeeder
{
    private const OPTION_KEY = 'happybites_demo_seeded';

    public static function run(bool $force = false): bool
    {
        if (!$force && get_option(self::OPTION_KEY)) {
            return false;
        }

        self::seed_settings();
        self::seed_menu();

        update_option(self::OPTION_KEY, current_time('mysql'));

        return true;
    }

    private static function seed_settings(): void
    {
        update_option(Options::LANGUAGES, ['tr', 'en']);
        update_option(Options::DEFAULT_LANGUAGE, 'tr');
        update_option(Options::DEFAULT_CURRENCY, 'TRY');

        update_option(Options::RESTAURANT_INFO, [
            'title' => 'Stay Cafe & Bistro',
            'slogan' => 'Taze malzemeler, sıcak atmosfer',
            'logo_url' => '',
            'logo_id' => 0,
            'header_bg_url' => '',
            'header_bg_id' => 0,
        ]);

        update_option(Options::COLORS, [
            'active_color' => '#f2750a',
            'accent_color' => '#0ea5e9',
        ]);

        update_option(Options::THEME_MODE, ['mode' => 'light']);

        update_option(Options::WIFI, [
            'ssid' => 'StayGuest',
            'password' => 'welcome2026',
        ]);

        update_option(Options::SLUG, ['slug' => 'qrmenu']);

        update_option(Options::WORKING_HOURS, [
            'monday' => ['is_open' => 1, 'open_time' => '09:00', 'close_time' => '23:00'],
            'tuesday' => ['is_open' => 1, 'open_time' => '09:00', 'close_time' => '23:00'],
            'wednesday' => ['is_open' => 1, 'open_time' => '09:00', 'close_time' => '23:00'],
            'thursday' => ['is_open' => 1, 'open_time' => '09:00', 'close_time' => '23:00'],
            'friday' => ['is_open' => 1, 'open_time' => '09:00', 'close_time' => '00:00'],
            'saturday' => ['is_open' => 1, 'open_time' => '10:00', 'close_time' => '00:00'],
            'sunday' => ['is_open' => 1, 'open_time' => '10:00', 'close_time' => '22:00'],
        ]);

        update_option(Options::SOCIAL_MEDIA, [
            'facebook' => 'https://facebook.com/',
            'instagram' => 'https://instagram.com/',
            'twitter' => '',
            'linkedin' => '',
            'youtube' => '',
            'tiktok' => '',
            'whatsapp' => 'https://wa.me/905551234567',
            'tripadvisor' => '',
            'google_business' => '',
        ]);

        update_option(Options::INFORMATION, [
            'html_info' => '<p>Rezervasyon için lütfen garsonumuza danışın. Tüm fiyatlara KDV dahildir.</p>',
        ]);
    }

    private static function seed_menu(): void
    {
        $starters = self::create_category([
            'tr' => 'Başlangıçlar',
            'en' => 'Starters',
        ], 0, 0);

        $soups = self::create_category([
            'tr' => 'Çorbalar',
            'en' => 'Soups',
        ], $starters, 0);

        $mains = self::create_category([
            'tr' => 'Ana Yemekler',
            'en' => 'Main Courses',
        ], 0, 1);

        $desserts = self::create_category([
            'tr' => 'Tatlılar',
            'en' => 'Desserts',
        ], 0, 2);

        $drinks = self::create_category([
            'tr' => 'İçecekler',
            'en' => 'Drinks',
        ], 0, 3);

        self::create_product([
            'tr' => ['title' => 'Mercimek Çorbası', 'description' => 'Geleneksel kırmızı mercimek çorbası, limon ve kruton ile.'],
            'en' => ['title' => 'Lentil Soup', 'description' => 'Classic red lentil soup served with lemon and croutons.'],
            'price' => 95,
            'category_id' => $soups,
            'order' => 0,
            'tags' => ['popular'],
            'spice_level' => '1',
        ]);

        self::create_product([
            'tr' => ['title' => 'Humus & Pita', 'description' => 'Ev yapımı humus, sıcak pita ve zeytinyağı.'],
            'en' => ['title' => 'Hummus & Pita', 'description' => 'House-made hummus with warm pita and olive oil.'],
            'price' => 145,
            'category_id' => $starters,
            'order' => 0,
            'tags' => ['vegan', 'popular'],
            'spice_level' => '0',
        ]);

        self::create_product([
            'tr' => ['title' => 'Çıtır Kalamar', 'description' => 'Özel baharatlı panelenmiş kalamar, sarımsaklı aioli.'],
            'en' => ['title' => 'Crispy Calamari', 'description' => 'Seasoned fried calamari with garlic aioli.'],
            'price' => 220,
            'category_id' => $starters,
            'order' => 1,
            'tags' => ['new_product'],
            'spice_level' => '1',
        ]);

        self::create_product([
            'tr' => ['title' => 'Izgara Köfte', 'description' => 'Dana köfte, pilav, közlenmiş biber ve domates.'],
            'en' => ['title' => 'Grilled Meatballs', 'description' => 'Beef meatballs with rice, grilled pepper and tomato.'],
            'price' => 320,
            'category_id' => $mains,
            'order' => 0,
            'tags' => ['chef_special', 'popular'],
            'spice_level' => '2',
            'weight' => '280g',
        ]);

        self::create_product([
            'tr' => ['title' => 'Fırın Somon', 'description' => 'Kremalı ıspanak ve fırın patates ile servis edilir.'],
            'en' => ['title' => 'Baked Salmon', 'description' => 'Served with creamy spinach and roasted potatoes.'],
            'price' => 385,
            'category_id' => $mains,
            'order' => 1,
            'tags' => ['gluten_free'],
            'spice_level' => '0',
            'weight' => '250g',
        ]);

        self::create_product([
            'tr' => ['title' => 'Mantarlı Risotto', 'description' => 'Porcini mantarı ve parmesan peyniri ile.'],
            'en' => ['title' => 'Mushroom Risotto', 'description' => 'Creamy risotto with porcini mushrooms and parmesan.'],
            'price' => 295,
            'category_id' => $mains,
            'order' => 2,
            'tags' => ['vegetarian'],
            'spice_level' => '0',
        ]);

        self::create_product([
            'tr' => ['title' => 'Sufle', 'description' => 'Sıcak çikolatalı sufle, vanilyalı dondurma ile.'],
            'en' => ['title' => 'Chocolate Soufflé', 'description' => 'Warm chocolate soufflé with vanilla ice cream.'],
            'price' => 165,
            'category_id' => $desserts,
            'order' => 0,
            'tags' => ['popular'],
            'spice_level' => '0',
        ]);

        self::create_product([
            'tr' => ['title' => 'Tiramisu', 'description' => 'Klasik İtalyan tiramisu.'],
            'en' => ['title' => 'Tiramisu', 'description' => 'Classic Italian tiramisu.'],
            'price' => 155,
            'category_id' => $desserts,
            'order' => 1,
            'tags' => [],
            'spice_level' => '0',
        ]);

        self::create_product([
            'tr' => ['title' => 'Türk Kahvesi', 'description' => 'Geleneksel pişirim, lokum ile.'],
            'en' => ['title' => 'Turkish Coffee', 'description' => 'Traditionally brewed, served with Turkish delight.'],
            'price' => 75,
            'category_id' => $drinks,
            'order' => 0,
            'tags' => ['popular'],
            'spice_level' => '0',
        ]);

        self::create_product([
            'tr' => ['title' => 'Taze Sıkılmış Portakal', 'description' => 'Günlük taze portakal suyu.'],
            'en' => ['title' => 'Fresh Orange Juice', 'description' => 'Freshly squeezed daily.'],
            'price' => 90,
            'category_id' => $drinks,
            'order' => 1,
            'tags' => ['vegan', 'organic'],
            'spice_level' => '0',
        ]);

        self::create_product([
            'tr' => ['title' => 'Ev Yapımı Limonata', 'description' => 'Nane ve buz ile.'],
            'en' => ['title' => 'Homemade Lemonade', 'description' => 'With mint and ice.'],
            'price' => 85,
            'category_id' => $drinks,
            'order' => 2,
            'tags' => ['vegan'],
            'spice_level' => '0',
        ]);
    }

    /**
     * @param array{tr: string, en: string} $names
     */
    private static function create_category(array $names, int $parent_id, int $order): int
    {
        $result = wp_insert_term($names['tr'], Taxonomy::TAXONOMY, [
            'parent' => $parent_id,
            'slug' => sanitize_title($names['en']),
        ]);

        if (is_wp_error($result)) {
            return 0;
        }

        $term_id = (int) $result['term_id'];
        update_term_meta($term_id, '_menu_order', $order);
        update_term_meta($term_id, 'category_name_tr', $names['tr']);
        update_term_meta($term_id, 'category_name_en', $names['en']);
        update_term_meta($term_id, 'category_description_tr', '');
        update_term_meta($term_id, 'category_description_en', '');

        return $term_id;
    }

    /**
     * @param array{
     *   tr: array{title: string, description: string},
     *   en: array{title: string, description: string},
     *   price: float|int,
     *   category_id: int,
     *   order: int,
     *   tags?: array<int, string>,
     *   spice_level?: string,
     *   weight?: string
     * } $data
     */
    private static function create_product(array $data): int
    {
        $post_id = wp_insert_post([
            'post_title' => $data['tr']['title'],
            'post_content' => $data['tr']['description'],
            'post_type' => PostTypes::POST_TYPE,
            'post_status' => 'publish',
        ], true);

        if (is_wp_error($post_id)) {
            return 0;
        }

        update_post_meta($post_id, '_menu_price', $data['price']);
        update_post_meta($post_id, '_menu_order', $data['order']);
        update_post_meta($post_id, '_menu_tags', $data['tags'] ?? []);
        update_post_meta($post_id, '_menu_spice_level', $data['spice_level'] ?? '0');

        if (!empty($data['weight'])) {
            update_post_meta($post_id, '_menu_weight', $data['weight']);
        }

        foreach (['tr', 'en'] as $lang) {
            update_post_meta($post_id, '_menu_title_' . $lang, $data[$lang]['title']);
            update_post_meta($post_id, '_menu_description_' . $lang, $data[$lang]['description']);
        }

        if ($data['category_id'] > 0) {
            update_post_meta($post_id, '_menu_category', $data['category_id']);
            wp_set_object_terms($post_id, $data['category_id'], Taxonomy::TAXONOMY, false);
        }

        return (int) $post_id;
    }
}
