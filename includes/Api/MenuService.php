<?php
/**
 * Menu data assembly for REST API.
 *
 * @package HappyBites
 */

namespace HappyBites\Api;

use HappyBites\Data\Options;
use HappyBites\Data\PostTypes;
use HappyBites\Data\ProductLinks;
use HappyBites\Data\Privacy;
use HappyBites\Data\RecaptchaSettings;
use HappyBites\Data\Taxonomy;
use HappyBites\Data\ThemeSettings;
use WP_Post;

if (!defined('ABSPATH')) {
    exit;
}

final class MenuService
{
    public function get_payload(): array
    {
        $active_languages = Options::active_languages();
        $default_language = get_option(Options::DEFAULT_LANGUAGE, 'en');

        $restaurant_info = get_option(Options::RESTAURANT_INFO, []);
        $working_hours = get_option(Options::WORKING_HOURS, []);
        $social_media = get_option(Options::SOCIAL_MEDIA, []);
        $colors = get_option(Options::COLORS, []);
        $theme_mode = get_option(Options::THEME_MODE, []);
        $resolved_mode = isset($theme_mode['mode']) && $theme_mode['mode'] === 'dark' ? 'dark' : 'light';
        $theme = ThemeSettings::for_api(is_array($colors) ? $colors : []);
        $active_palette = ThemeSettings::palette_for_mode(is_array($colors) ? $colors : [], $resolved_mode);
        $wifi = get_option(Options::WIFI, []);
        $information = get_option(Options::INFORMATION, []);
        $default_currency = get_option(Options::DEFAULT_CURRENCY, 'TRY');
        $header_bg_url = isset($restaurant_info['header_bg_url']) ? $restaurant_info['header_bg_url'] : '';

        $parent_categories = get_terms([
            'taxonomy' => Taxonomy::TAXONOMY,
            'hide_empty' => false,
            'parent' => 0,
            'orderby' => 'meta_value_num',
            'meta_key' => '_menu_order',
            'order' => 'ASC',
        ]);

        if (empty($parent_categories) || is_wp_error($parent_categories)) {
            $parent_categories = get_terms([
                'taxonomy' => Taxonomy::TAXONOMY,
                'hide_empty' => false,
                'parent' => 0,
            ]);
        }

        if (is_wp_error($parent_categories)) {
            $parent_categories = [];
        }

        $categories_data = [];

        foreach ($parent_categories as $parent_category) {
            $parent_data = [
                'id' => $parent_category->term_id,
                'slug' => $parent_category->slug,
                'public_url' => ProductLinks::category_url((string) $parent_category->slug),
                'name' => [],
                'description' => [],
                'subcategories' => [],
                'products' => [],
            ];

            foreach ($active_languages as $lang_code) {
                $translated_name = get_term_meta($parent_category->term_id, 'category_name_' . $lang_code, true);
                $translated_desc = get_term_meta($parent_category->term_id, 'category_description_' . $lang_code, true);

                $parent_data['name'][$lang_code] = $translated_name ?: $parent_category->name;
                $parent_data['description'][$lang_code] = $translated_desc ?: $parent_category->description;
            }

            $child_categories = get_terms([
                'taxonomy' => Taxonomy::TAXONOMY,
                'hide_empty' => false,
                'parent' => $parent_category->term_id,
                'orderby' => 'meta_value_num',
                'meta_key' => '_menu_order',
                'order' => 'ASC',
            ]);

            if (empty($child_categories) || is_wp_error($child_categories)) {
                $child_categories = get_terms([
                    'taxonomy' => Taxonomy::TAXONOMY,
                    'hide_empty' => false,
                    'parent' => $parent_category->term_id,
                ]);
            }

            if (is_wp_error($child_categories)) {
                $child_categories = [];
            }

            foreach ($child_categories as $child_category) {
                $child_order = get_term_meta($child_category->term_id, '_menu_order', true);

                if (empty($child_order)) {
                    update_term_meta($child_category->term_id, '_menu_order', 0);
                }

                $child_data = [
                    'id' => $child_category->term_id,
                    'slug' => $child_category->slug,
                    'public_url' => ProductLinks::category_url((string) $child_category->slug),
                    'name' => [],
                    'description' => [],
                    'products' => [],
                ];

                foreach ($active_languages as $lang_code) {
                    $translated_name = get_term_meta($child_category->term_id, 'category_name_' . $lang_code, true);
                    $translated_desc = get_term_meta($child_category->term_id, 'category_description_' . $lang_code, true);

                    $child_data['name'][$lang_code] = $translated_name ?: $child_category->name;
                    $child_data['description'][$lang_code] = $translated_desc ?: $child_category->description;
                }

                $child_products = get_posts([
                    'post_type' => PostTypes::POST_TYPE,
                    'posts_per_page' => -1,
                    'meta_query' => [
                        [
                            'key' => '_menu_category',
                            'value' => $child_category->term_id,
                            'compare' => '=',
                        ],
                    ],
                    'meta_key' => '_menu_order',
                    'orderby' => 'meta_value_num',
                    'order' => 'ASC',
                ]);

                foreach ($child_products as $product) {
                    $child_data['products'][] = $this->map_product($product, $active_languages);
                }

                $parent_data['subcategories'][] = $child_data;
            }

            $parent_products = get_posts([
                'post_type' => PostTypes::POST_TYPE,
                'posts_per_page' => -1,
                'meta_query' => [
                    [
                        'key' => '_menu_category',
                        'value' => $parent_category->term_id,
                        'compare' => '=',
                    ],
                ],
                'meta_key' => '_menu_order',
                'orderby' => 'meta_value_num',
                'order' => 'ASC',
            ]);

            foreach ($parent_products as $product) {
                $parent_data['products'][] = $this->map_product($product, $active_languages);
            }

            $categories_data[] = $parent_data;
        }

        $working_hours_data = [];
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        foreach ($days as $day) {
            $working_hours_data[$day] = [
                'isOpen' => isset($working_hours[$day]['is_open']) ? (bool) $working_hours[$day]['is_open'] : false,
                'openTime' => isset($working_hours[$day]['open_time']) ? $working_hours[$day]['open_time'] : '09:00',
                'closeTime' => isset($working_hours[$day]['close_time']) ? $working_hours[$day]['close_time'] : '18:00',
            ];
        }

        $total_products = array_sum(array_map(static function (array $cat) {
            $subcategory_products = array_sum(array_map(static function (array $sub) {
                return count($sub['products']);
            }, $cat['subcategories']));

            return count($cat['products']) + $subcategory_products;
        }, $categories_data));

        return [
            'success' => true,
            'data' => [
                'categories' => $categories_data,
                'languages' => $active_languages,
                'total_categories' => count($categories_data),
                'total_products' => $total_products,
                'settings' => [
                    'title' => isset($restaurant_info['title']) ? $restaurant_info['title'] : '',
                    'default_language' => $default_language,
                    'default_currency' => $default_currency,
                    'description' => isset($restaurant_info['slogan']) ? $restaurant_info['slogan'] : '',
                    'logo' => isset($restaurant_info['logo_url']) ? $restaurant_info['logo_url'] : '',
                    'header_background' => $header_bg_url,
                    'colors' => [
                        'primary' => $active_palette['primary'],
                        'secondary' => $active_palette['accent'],
                    ],
                    'theme' => $theme,
                    'appearance' => ThemeSettings::appearance_for_api(is_array($colors) ? $colors : []),
                    'workingHours' => $working_hours_data,
                    'socialMedia' => [
                        'facebook' => isset($social_media['facebook']) ? $social_media['facebook'] : '',
                        'instagram' => isset($social_media['instagram']) ? $social_media['instagram'] : '',
                        'twitter' => isset($social_media['twitter']) ? $social_media['twitter'] : '',
                        'linkedin' => isset($social_media['linkedin']) ? $social_media['linkedin'] : '',
                        'youtube' => isset($social_media['youtube']) ? $social_media['youtube'] : '',
                        'tiktok' => isset($social_media['tiktok']) ? $social_media['tiktok'] : '',
                        'pinterest' => isset($social_media['pinterest']) ? $social_media['pinterest'] : '',
                        'whatsapp' => isset($social_media['whatsapp']) ? $social_media['whatsapp'] : '',
                        'tripadvisor' => isset($social_media['tripadvisor']) ? $social_media['tripadvisor'] : '',
                        'googleBusiness' => isset($social_media['google_business']) ? $social_media['google_business'] : '',
                        'website' => isset($social_media['website']) ? $social_media['website'] : '',
                    ],
                    'contact' => [
                        'phone' => '',
                        'email' => '',
                        'address' => '',
                    ],
                    'wifi' => [
                        'ssid' => isset($wifi['ssid']) ? $wifi['ssid'] : '',
                        'password' => isset($wifi['password']) ? $wifi['password'] : '',
                    ],
                    'themeMode' => isset($theme_mode['mode']) ? $theme_mode['mode'] : 'light',
                    'information' => isset($information['html_info']) ? $information['html_info'] : '',
                    'menu_url' => ProductLinks::menu_url(),
                    'privacy_policy_url' => Privacy::policy_url(),
                    'recaptcha' => RecaptchaSettings::public_config(),
                    'rest_url' => esc_url_raw(rest_url('happybites/v1')),
                ],
            ],
        ];
    }

    /**
     * @param array<int, string> $active_languages
     */
    private function map_product(WP_Post $product, array $active_languages): array
    {
        $product_data = [
            'id' => $product->ID,
            'public_url' => ProductLinks::product_url((int) $product->ID),
            'title' => [],
            'description' => [],
            'price' => get_post_meta($product->ID, '_menu_price', true) ?: '',
            'weight' => get_post_meta($product->ID, '_menu_weight', true) ?: '',
            'spice_level' => get_post_meta($product->ID, '_menu_spice_level', true) ?: '',
            'preparation_time' => get_post_meta($product->ID, '_menu_preparation_time', true) ?: '',
            'tags' => get_post_meta($product->ID, '_menu_tags', true) ?: '',
            'origin_country' => get_post_meta($product->ID, '_menu_origin_country', true) ?: '',
            'portion_size' => get_post_meta($product->ID, '_menu_portion_size', true) ?: '',
            'nutrition' => get_post_meta($product->ID, '_menu_nutrition', true) ?: [],
            'additives' => get_post_meta($product->ID, '_menu_additives', true) ?: [],
            'allergen_notes' => [],
            'ingredients' => [],
            'allergens' => [],
            'image' => null,
        ];

        foreach ($active_languages as $lang_code) {
            $translated_title = get_post_meta($product->ID, '_menu_title_' . $lang_code, true);
            $translated_desc = get_post_meta($product->ID, '_menu_description_' . $lang_code, true);

            $product_data['title'][$lang_code] = $translated_title ?: $product->post_title;
            $product_data['description'][$lang_code] = $translated_desc ?: $product->post_content;

            $ingredients = get_post_meta($product->ID, '_menu_ingredients_' . $lang_code, true);
            $allergens = get_post_meta($product->ID, '_menu_allergens_' . $lang_code, true);
            $allergen_notes = get_post_meta($product->ID, '_menu_allergen_notes_' . $lang_code, true);

            $product_data['ingredients'][$lang_code] = (is_array($ingredients) && !empty($ingredients)) ? $ingredients : [];
            $product_data['allergens'][$lang_code] = (is_array($allergens) && !empty($allergens)) ? $allergens : [];
            $product_data['allergen_notes'][$lang_code] = $allergen_notes ?: '';
        }

        if (has_post_thumbnail($product->ID)) {
            $thumbnail_id = get_post_thumbnail_id($product->ID);
            $thumbnail_url = wp_get_attachment_image_src($thumbnail_id, 'medium');

            if ($thumbnail_url) {
                $product_data['image'] = [
                    'url' => $thumbnail_url[0],
                    'width' => $thumbnail_url[1],
                    'height' => $thumbnail_url[2],
                    'alt' => (string) get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true),
                ];
            }
        }

        return $product_data;
    }
}
