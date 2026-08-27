<?php
namespace HappyBites\Admin;

use HappyBites\Data\Taxonomy;
use HappyBites\Data\ThemeSettings;
use HappyBites\Loader;

if (!defined('ABSPATH')) {
    exit;
}


/**
 * HappyBites Admin Class
 */
final class Panel
{

    /**
     * Loader instance
     */
    private $loader;

    /**
     * Constructor
     */
    public function __construct(Loader $loader)
    {
        $this->loader = $loader;
    }

    /**
     * Verify nonce and capability for admin-ajax handlers.
     */
    private function require_ajax_cap(string $nonce_action): void
    {
        check_ajax_referer($nonce_action, 'nonce');

        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You are not allowed to do this.', 'happybites'));
        }
    }

    public function register()
    {
        $this->loader->add_action('admin_menu', $this, 'add_admin_menu');
        $this->loader->add_action('admin_menu', $this, 'move_the_title', 999);
        $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_admin_chrome');

        // Quick Edit'te taksonomi alanını gizle

        $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_admin_scripts');
        $this->loader->add_action('admin_init', $this, 'init_settings');
        $this->loader->add_action('wp_ajax_happybites_update_category_order', $this, 'update_category_order');
        $this->loader->add_action('wp_ajax_happybites_update_subcategory_order', $this, 'update_subcategory_order');
        $this->loader->add_action('wp_ajax_happybites_update_product_order', $this, 'update_product_order');
        $this->loader->add_action('wp_ajax_happybites_save_quick_edit_category', $this, 'save_quick_edit_category');
        $this->loader->add_action('wp_ajax_happybites_get_post_category', $this, 'get_post_category');
        $this->loader->add_action('wp_ajax_happybites_save_category', $this, 'save_category');
        $this->loader->add_action('wp_ajax_happybites_save_product', $this, 'save_product');
        $this->loader->add_action('wp_ajax_happybites_update_category_name', $this, 'update_category_name');

        // Menü öğeleri listesinde "Menü Kategorileri" sütununu kaldır
        $this->loader->add_filter('manage_edit-happybites_menu_item_columns', $this, 'remove_menu_categories_column', 100);

        // Kategori listesinden slug/description sütunlarını kaldır
        $this->loader->add_filter('manage_edit-happybites_menu_category_columns', $this, 'remove_term_columns', 100);

        $this->remove_default_category();
    }

    /**
     * Admin listesinde taxonomy sütununu kaldır
     */
    public function remove_menu_categories_column($columns)
    {
        // Taxonomy sütun anahtarı: taxonomy-{taxonomy_slug}
        unset($columns['taxonomy-happybites_menu_category']);
        return $columns;
    }

    /**
     * happybites_menu_category taxonomy listesinde slug ve description sütunlarını kaldır
     */
    public function remove_term_columns($columns)
    {
        // Varsayılan anahtarlar: 'cb','name','description','slug','posts'
        unset($columns['slug']);
        unset($columns['description']);
        return $columns;
    }

    /**
     * Global admin chrome: submenu divider and taxonomy field hide.
     */
    public function enqueue_admin_chrome(): void
    {
        wp_enqueue_style(
            'happybites-admin-chrome',
            HAPPYBITES_PLUGIN_URL . 'admin/css/admin-chrome.css',
            [],
            HAPPYBITES_VERSION
        );
    }

    /**
     * Admin menü ekle
     */
    public function add_admin_menu()
    {
        // Ana menü
        add_menu_page(
            __('HappyBites', 'happybites'),
            __('HappyBites', 'happybites'),
            'manage_options',
            'happybites',
            [$this, 'admin_page'],
            'dashicons-smiley',
            100
        );

        // CPT üst menüsünü gizle (listeyi HappyBites altına taşıyacağız)
        remove_menu_page('edit.php?post_type=happybites_menu_item');

        // Alt menü: WP’nin CPT listesi
        add_submenu_page(
            'happybites',
            __('Menu Items', 'happybites'),
            __('Menu Items', 'happybites'),
            'manage_options',
            'edit.php?post_type=happybites_menu_item'
        );

        // Alt menü: Kategoriler (tax ekranı)
        add_submenu_page(
            'happybites',
            __('Categories', 'happybites'),
            __('Categories', 'happybites'),
            'manage_options',
            'edit-tags.php?taxonomy=happybites_menu_category&post_type=happybites_menu_item'
        );

        add_submenu_page(
            'happybites',
            __('Menu Management', 'happybites'),
            __('Menu Management', 'happybites'),
            'manage_options',
            'happybites-manage-menu',
            [$this, 'manage_menu_page']
        );

        add_submenu_page(
            'happybites',
            __('Customer Reviews', 'happybites'),
            __('Customer Reviews', 'happybites'),
            'manage_options',
            'happybites-reviews',
            [$this, 'reviews_page']
        );

        /**
         * Extension point: add-ons (HappyBites Pro) register their submenu
         * pages between Reviews and Settings.
         */
        do_action('happybites_admin_menu', 'happybites');

        add_submenu_page(
            'happybites',
            __('Settings', 'happybites'),
            __('Settings', 'happybites'),
            'manage_options',
            'happybites-settings',
            [$this, 'settings_page']
        );

        /* Deprecated legacy sort page kept for reference
        add_submenu_page(
            'happybites',
            __('Edit Ordering', 'happybites'),
            __('Edit Ordering', 'happybites'),
            'manage_options',
            'happybites-sort',
            array($this, 'sort_page')
        );
        */
    }

    /**
     * HappyBites alt menüsünde:
     * - Ana sayfa linkini (slug=happybites) en alta indir
     * - Ayarlardan önce divider ekle
     */
    public function move_the_title()
    {
        global $submenu;
        $parent = 'happybites';
        if (empty($submenu[$parent])) return;

        $items = $submenu[$parent];

        // 1) Ana sayfa alt menü öğesini bul → sona taşı
        $moved = null;
        foreach ($items as $i => $item) {
            if (!empty($item[2]) && $item[2] === $parent) { // slug = 'happybites'
                $moved = $item;
                unset($items[$i]);
                break;
            }
        }
        if ($moved) {
            $items = array_values($items);
            $items[] = $moved;
        }

        // 2) "Ayarlar"dan önce divider ekle
        $insertAt = null;
        foreach ($items as $i => $item) {
            if (!empty($item[2]) && $item[2] === 'happybites-settings') {
                $insertAt = $i;
                break;
            }
        }
        if ($insertAt !== null) {
            array_splice($items, $insertAt, 0, [
                ['<span class="hb-divider"></span>', 'read', '#', 'hb-divider']
            ]);
        }

        $submenu[$parent] = $items;
    }

    /**
     * Admin sayfası
     */
    public function admin_page()
    {
        $this->render_react_shell(__('HappyBites', 'happybites'));
    }

    public function manage_menu_page()
    {
        $this->render_react_shell(__('Menu Management', 'happybites'));
    }

    /**
     * Ayarlar sayfası
     */
    public function settings_page()
    {
        $this->render_react_shell(__('Settings', 'happybites'));
    }

    /**
     * Review sayfası
     */
    public function reviews_page()
    {
        $this->render_react_shell(__('Customer Reviews', 'happybites'));
    }

    private function render_react_shell(string $title): void
    {
        include HAPPYBITES_PLUGIN_PATH . 'admin/views/react-shell.php';
    }

    /**
     * Sıralama sayfası
     */
    // public function sort_page()
    // {
    //     include HAPPYBITES_PLUGIN_PATH . 'admin/views/sort-page.php';
    // }

    /**
     * Admin script'lerini yükle
     */
    public function enqueue_admin_scripts($hook)
    {
        global $post_type;

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- admin screen routing only.
        $taxonomy = isset($_GET['taxonomy']) ? sanitize_key(wp_unslash($_GET['taxonomy'])) : '';
        $is_menu_category_screen = $hook === 'edit-tags.php' && $taxonomy === Taxonomy::TAXONOMY;

        // HappyBites admin sayfalarında veya menü öğesi sayfalarında yükle
        if (strpos($hook, 'happybites') !== false || $post_type === 'happybites_menu_item' || $is_menu_category_screen) {
            // React admin pages use their own bundle.
            // phpcs:disable WordPress.Security.NonceVerification.Recommended -- admin page slug used only to enqueue assets.
            $react_pages = apply_filters('happybites_react_admin_pages', [
                'happybites',
                'happybites-manage-menu',
                'happybites-settings',
                'happybites-reviews',
            ]);
            $page_slug = isset($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : '';
            if ($page_slug !== '' && in_array($page_slug, $react_pages, true)) {
                return;
            }
            // phpcs:enable WordPress.Security.NonceVerification.Recommended

            // WordPress Media Library'yi yükle
            wp_enqueue_media();

            wp_enqueue_style(
                'happybites-admin',
                HAPPYBITES_PLUGIN_URL . 'admin/css/admin.css',
                array(),
                HAPPYBITES_VERSION
            );

            wp_enqueue_script(
                'happybites-admin',
                HAPPYBITES_PLUGIN_URL . 'admin/js/admin.js',
                array('jquery', 'jquery-ui-sortable', 'media-upload', 'thickbox', 'media-views', 'editor', 'quicktags'),
                HAPPYBITES_VERSION,
                false
            );

            wp_enqueue_script(
                'happybites-post-types',
                HAPPYBITES_PLUGIN_URL . 'admin/js/post-types.js',
                array('jquery', 'jquery-ui-sortable', 'media-upload', 'thickbox', 'media-views', 'editor', 'quicktags'),
                HAPPYBITES_VERSION,
                false
            );

            // Sıralama için nonce
            $nonce = wp_create_nonce('happybites_sort_nonce');
            wp_add_inline_script(
                'happybites-admin',
                'window.happybites_sort_nonce = "' . esc_js($nonce) . '";',
                'before'
            );
        }
    }

    /**
     * Ayarları başlat
     */
    public function init_settings()
    {
        $this->register_settings();
        $this->add_settings_sections();
        $this->add_settings_fields();
    }

    /**
     * Ayarları kaydet
     */
    private function register_settings()
    {
        $array_args = [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_option_array'],
            'default' => [],
        ];
        $string_args = [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => '',
        ];

        register_setting('happybites_options', 'happybites_settings', $array_args);
        register_setting('happybites_options', 'happybites_languages', $array_args);
        register_setting('happybites_options', 'happybites_restaurant_info', [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_restaurant_info_option'],
            'default' => [],
        ]);
        register_setting('happybites_options', 'happybites_working_hours', $array_args);
        register_setting('happybites_options', 'happybites_social_media', [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_social_media_option'],
            'default' => [],
        ]);
        register_setting('happybites_options', 'happybites_colors', [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_colors_option'],
            'default' => [],
        ]);
        register_setting('happybites_options', 'happybites_theme_mode', $array_args);
        register_setting('happybites_options', 'happybites_wifi', [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_wifi_option'],
            'default' => [],
        ]);
        register_setting('happybites_options', 'happybites_information', [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_information_option'],
            'default' => [],
        ]);
        register_setting('happybites_options', 'happybites_slug', [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_slug_option'],
            'default' => ['slug' => 'qrmenu'],
        ]);
        register_setting('happybites_options', 'happybites_default_language', $string_args);
        register_setting('happybites_options', 'happybites_default_currency', $string_args);
    }

    /**
     * @param mixed $value
     * @return array<mixed>|string
     */
    public function sanitize_option_array($value)
    {
        if (!is_array($value)) {
            return is_string($value) ? sanitize_text_field($value) : [];
        }

        return map_deep($value, 'sanitize_text_field');
    }

    /**
     * @param mixed $value
     * @return array<string, mixed>
     */
    public function sanitize_restaurant_info_option($value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $show_credit = $value['show_credit'] ?? '0';

        return [
            'title' => sanitize_text_field((string) ($value['title'] ?? '')),
            'logo_url' => esc_url_raw((string) ($value['logo_url'] ?? '')),
            'logo_id' => absint($value['logo_id'] ?? 0),
            'header_bg_url' => esc_url_raw((string) ($value['header_bg_url'] ?? '')),
            'header_bg_id' => absint($value['header_bg_id'] ?? 0),
            'slogan' => sanitize_text_field((string) ($value['slogan'] ?? '')),
            'privacy_policy_url' => esc_url_raw((string) ($value['privacy_policy_url'] ?? '')),
            'show_credit' => (!empty($show_credit) && $show_credit !== '0' && $show_credit !== false) ? '1' : '0',
        ];
    }

    /**
     * @param mixed $value
     * @return array<string, string>
     */
    public function sanitize_social_media_option($value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $keys = [
            'facebook', 'twitter', 'instagram', 'linkedin', 'youtube',
            'tiktok', 'whatsapp', 'tripadvisor', 'google_business',
        ];
        $out = [];

        foreach ($keys as $key) {
            $out[$key] = esc_url_raw((string) ($value[$key] ?? ''));
        }

        return $out;
    }

    /**
     * @param mixed $value
     * @return array<string, mixed>
     */
    public function sanitize_colors_option($value): array
    {
        if (!is_array($value)) {
            return [];
        }

        return ThemeSettings::sanitize_input($value);
    }

    /**
     * WiFi SSID is plain text; the password must not run through sanitize_text_field().
     *
     * @param mixed $value
     * @return array<string, string>
     */
    public function sanitize_wifi_option($value): array
    {
        if (!is_array($value)) {
            return [];
        }

        return [
            'ssid' => sanitize_text_field((string) ($value['ssid'] ?? '')),
            'password' => $this->sanitize_wifi_password((string) ($value['password'] ?? '')),
        ];
    }

    private function sanitize_wifi_password(string $password): string
    {
        $password = wp_unslash($password);

        return (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $password);
    }

    /**
     * @param mixed $value
     * @return array<string, string>
     */
    public function sanitize_information_option($value): array
    {
        if (!is_array($value)) {
            return [];
        }

        return [
            'html_info' => wp_kses_post((string) ($value['html_info'] ?? '')),
        ];
    }

    /**
     * @param mixed $value
     * @return array<string, string>
     */
    public function sanitize_slug_option($value): array
    {
        $raw = is_array($value) ? (string) ($value['slug'] ?? '') : (string) $value;
        $slug = sanitize_title($raw);

        if ($slug === '') {
            $slug = 'qrmenu';
        }

        return ['slug' => $slug];
    }

    /**
     * Ayarlar bölümlerini ekle
     */
    private function add_settings_sections()
    {
        // Restaurant Bilgileri bölümü
        add_settings_section(
            'happybites_restaurant_info',
            __('Restaurant Information', 'happybites'),
            array($this, 'restaurant_info_section_callback'),
            'happybites-settings'
        );

        // Çalışma Saatleri bölümü
        add_settings_section(
            'happybites_working_hours',
            __('Working Hours', 'happybites'),
            array($this, 'working_hours_section_callback'),
            'happybites-settings'
        );

        // Sosyal Medya bölümü
        add_settings_section(
            'happybites_social_media',
            __('Social Media Links', 'happybites'),
            array($this, 'social_media_section_callback'),
            'happybites-settings'
        );

        // Renkler bölümü
        add_settings_section(
            'happybites_colors',
            __('Color Settings', 'happybites'),
            array($this, 'colors_section_callback'),
            'happybites-settings'
        );

        // Tema Modu bölümü
        add_settings_section(
            'happybites_theme_mode',
            __('Theme Mode', 'happybites'),
            array($this, 'theme_mode_section_callback'),
            'happybites-settings'
        );

        // WiFi bölümü
        add_settings_section(
            'happybites_wifi',
            __('WiFi Information', 'happybites'),
            array($this, 'wifi_section_callback'),
            'happybites-settings'
        );

        // Bilgi bölümü
        add_settings_section(
            'happybites_information',
            __('Additional Information', 'happybites'),
            array($this, 'information_section_callback'),
            'happybites-settings'
        );

        // Slug Bölümü
        add_settings_section(
            'happybites_slug',
            __('Menu Address', 'happybites'),
            array($this, 'slug_section_callback'),
            'happybites-settings'
        );

        // Dil ayarları bölümü
        add_settings_section(
            'happybites_languages',
            __('Language Settings', 'happybites'),
            array($this, 'languages_section_callback'),
            'happybites-settings'
        );

        // Varsayılanlar bölümü
        add_settings_section(
            'happybites_defaults',
            __('Defaults', 'happybites'),
            function () {
                echo '<p>' . esc_html__('Select the default language and currency for the application.', 'happybites') . '</p>';
            },
            'happybites-settings'
        );
    }

    /**
     * Ayarlar alanlarını ekle
     */
    private function add_settings_fields()
    {
        // Restaurant bilgileri alanları
        add_settings_field(
            'happybites_title',
            __('Restaurant Name', 'happybites'),
            array($this, 'title_field_callback'),
            'happybites-settings',
            'happybites_restaurant_info'
        );

        add_settings_field(
            'happybites_logo',
            __('Logo URL', 'happybites'),
            array($this, 'logo_field_callback'),
            'happybites-settings',
            'happybites_restaurant_info'
        );

        // Header Background Image alanı
        add_settings_field(
            'happybites_header_bg',
            __('Header Background Image', 'happybites'),
            array($this, 'header_bg_field_callback'),
            'happybites-settings',
            'happybites_restaurant_info'
        );

        add_settings_field(
            'happybites_slogan',
            __('Slogan', 'happybites'),
            array($this, 'slogan_field_callback'),
            'happybites-settings',
            'happybites_restaurant_info'
        );

        // Çalışma saatleri alanı
        add_settings_field(
            'happybites_working_hours',
            __('Working Hours', 'happybites'),
            array($this, 'working_hours_field_callback'),
            'happybites-settings',
            'happybites_working_hours'
        );

        // Sosyal medya alanı
        add_settings_field(
            'happybites_social_media',
            __('Social Media', 'happybites'),
            array($this, 'social_media_field_callback'),
            'happybites-settings',
            'happybites_social_media'
        );

        // Renk alanları
        add_settings_field(
            'happybites_active_color',
            __('Primary Color', 'happybites'),
            array($this, 'active_color_field_callback'),
            'happybites-settings',
            'happybites_colors'
        );

        add_settings_field(
            'happybites_accent_color',
            __('Accent Color', 'happybites'),
            array($this, 'accent_color_field_callback'),
            'happybites-settings',
            'happybites_colors'
        );

        // Tema modu alanı
        add_settings_field(
            'happybites_theme_mode',
            __('Theme Mode', 'happybites'),
            array($this, 'theme_mode_field_callback'),
            'happybites-settings',
            'happybites_theme_mode'
        );

        // WiFi alanları
        add_settings_field(
            'happybites_wifi_ssid',
            __('WiFi SSID', 'happybites'),
            array($this, 'wifi_ssid_field_callback'),
            'happybites-settings',
            'happybites_wifi'
        );

        add_settings_field(
            'happybites_wifi_password',
            __('WiFi Password', 'happybites'),
            array($this, 'wifi_password_field_callback'),
            'happybites-settings',
            'happybites_wifi'
        );

        // Bilgi alanı
        add_settings_field(
            'happybites_information',
            __('HTML Information', 'happybites'),
            array($this, 'information_field_callback'),
            'happybites-settings',
            'happybites_information'
        );

        // Slug alanı
        add_settings_field(
            'happybites_slug',
            __('URL Slug', 'happybites'),
            array($this, 'slug_field_callback'),
            'happybites-settings',
            'happybites_slug'
        );

        // Dil alanı
        add_settings_field(
            'happybites_languages',
            __('Active Languages', 'happybites'),
            array($this, 'languages_field_callback'),
            'happybites-settings',
            'happybites_languages'
        );

        // Varsayılan dil alanı
        add_settings_field(
            'happybites_default_language',
            __('Default Language', 'happybites'),
            array($this, 'default_language_field_callback'),
            'happybites-settings',
            'happybites_defaults'
        );

        // Varsayılan para birimi alanı
        add_settings_field(
            'happybites_default_currency',
            __('Default Currency', 'happybites'),
            array($this, 'default_currency_field_callback'),
            'happybites-settings',
            'happybites_defaults'
        );
    }

    /**
     * Restaurant Bilgileri bölümü callback
     */
    public function restaurant_info_section_callback()
    {
        echo '<p>' . esc_html__('You can configure your restaurant information here.', 'happybites') . '</p>';
    }

    /**
     * Restaurant Adı alanı callback
     */
    public function title_field_callback()
    {
        $options = get_option('happybites_restaurant_info');
        $title = isset($options['title']) ? $options['title'] : '';

        echo '<input type="text" name="happybites_restaurant_info[title]" value="' . esc_attr($title) . '" class="regular-text" />';
        echo '<p class="description">' . esc_html__('Enter your restaurant name.', 'happybites') . '</p>';
    }

    /**
     * Logo URL alanı callback
     */
    public function logo_field_callback()
    {
        $options = get_option('happybites_restaurant_info');
        $logo_url = isset($options['logo_url']) ? $options['logo_url'] : '';
        $logo_id = isset($options['logo_id']) ? $options['logo_id'] : '';

        echo '<div id="logo_preview" style="display:inline-block; margin-bottom: 10px; ' . ($logo_url ? '' : 'display: none;') . '">';
        if ($logo_url) {
            echo '<img src="' . esc_url($logo_url) . '" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd; border-radius: 4px;" />';
        }
        echo '</div>';

        echo '<div class="logo-upload-container">';
        echo '<input type="hidden" name="happybites_restaurant_info[logo_id]" value="' . esc_attr($logo_id) . '" id="logo_id" />';
        echo '<input type="text" name="happybites_restaurant_info[logo_url]" value="' . esc_url($logo_url) . '" class="regular-text" id="logo_url" readonly />';
        echo '<button type="button" class="button" id="upload_logo_button">' . esc_html__('Choose Logo', 'happybites') . '</button>';
        echo '<button type="button" class="button" id="remove_logo_button" style="display: ' . ($logo_url ? 'inline-block' : 'none') . ';">' . esc_html__('Remove Logo', 'happybites') . '</button>';
        echo '</div>';

        echo '<p class="description">' . esc_html__('Click "Choose Logo" to select your restaurant logo.', 'happybites') . '</p>';
    }

    /**
     * Header Background Image alanı callback
     */
    public function header_bg_field_callback()
    {
        $options = get_option('happybites_restaurant_info');
        $bg_url = isset($options['header_bg_url']) ? $options['header_bg_url'] : '';
        $bg_id = isset($options['header_bg_id']) ? $options['header_bg_id'] : '';

        echo '<div id="header_bg_preview" style="display:inline-block; margin-bottom: 10px; ' . ($bg_url ? '' : 'display: none;') . '">';
        if ($bg_url) {
            echo '<img src="' . esc_url($bg_url) . '" style="max-width: 400px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px; object-fit: cover;" />';
        }
        echo '</div>';

        echo '<div class="header-bg-upload-container">';
        echo '<input type="hidden" name="happybites_restaurant_info[header_bg_id]" value="' . esc_attr($bg_id) . '" id="header_bg_id" />';
        echo '<input type="text" name="happybites_restaurant_info[header_bg_url]" value="' . esc_url($bg_url) . '" class="regular-text" id="header_bg_url" readonly />';
        echo '<button type="button" class="button" id="upload_header_bg_button">' . esc_html__('Choose Image', 'happybites') . '</button>';
        echo '<button type="button" class="button" id="remove_header_bg_button" style="display: ' . ($bg_url ? 'inline-block' : 'none') . ';">' . esc_html__('Remove Image', 'happybites') . '</button>';
        echo '</div>';

        echo '<p class="description">' . esc_html__('Select a background image for the header area. Recommended ratio ~16:9.', 'happybites') . '</p>';
    }

    /**
     * Slogan alanı callback
     */
    public function slogan_field_callback()
    {
        $options = get_option('happybites_restaurant_info');
        $slogan = isset($options['slogan']) ? $options['slogan'] : '';

        echo '<input type="text" name="happybites_restaurant_info[slogan]" value="' . esc_attr($slogan) . '" class="regular-text" />';
        echo '<p class="description">' . esc_html__('Enter your restaurant slogan.', 'happybites') . '</p>';
    }

    /**
     * Çalışma Saatleri bölümü callback
     */
    public function working_hours_section_callback()
    {
        echo '<p>' . esc_html__('You can configure restaurant working hours here.', 'happybites') . '</p>';
    }

    /**
     * Çalışma Saatleri alanı callback
     */
    public function working_hours_field_callback()
    {
        $options = get_option('happybites_working_hours');

        $days = array(
            'monday' => __('Monday', 'happybites'),
            'tuesday' => __('Tuesday', 'happybites'),
            'wednesday' => __('Wednesday', 'happybites'),
            'thursday' => __('Thursday', 'happybites'),
            'friday' => __('Friday', 'happybites'),
            'saturday' => __('Saturday', 'happybites'),
            'sunday' => __('Sunday', 'happybites')
        );

        $hours = array();
        for ($i = 0; $i <= 23; $i++) {
            $hour = sprintf('%02d:00', $i);
            $hours[$hour] = $hour;
        }

        echo '<div class="happybites-working-hours-container">';
        foreach ($days as $day_key => $day_name) {
            $is_open = isset($options[$day_key]['is_open']) ? $options[$day_key]['is_open'] : false;
            $open_time = isset($options[$day_key]['open_time']) ? $options[$day_key]['open_time'] : '09:00';
            $close_time = isset($options[$day_key]['close_time']) ? $options[$day_key]['close_time'] : '18:00';

            echo '<div class="working-day-row">';
            echo '<div class="day-checkbox">';
            echo '<input type="checkbox" name="happybites_working_hours[' . esc_attr($day_key) . '][is_open]" value="1" ' . checked(1, $is_open, false) . ' />';
            echo '<label>' . esc_html($day_name) . '</label>';
            echo '</div>';

            echo '<div class="time-selectors">';
            echo '<select name="happybites_working_hours[' . esc_attr($day_key) . '][open_time]">';
            foreach ($hours as $hour_value => $hour_label) {
                echo '<option value="' . esc_attr($hour_value) . '" ' . selected($open_time, $hour_value, false) . '>' . esc_html($hour_label) . '</option>';
            }
            echo '</select>';

            echo '<span class="time-separator">-</span>';

            echo '<select name="happybites_working_hours[' . esc_attr($day_key) . '][close_time]">';
            foreach ($hours as $hour_value => $hour_label) {
                echo '<option value="' . esc_attr($hour_value) . '" ' . selected($close_time, $hour_value, false) . '>' . esc_html($hour_label) . '</option>';
            }
            echo '</select>';
            echo '</div>';
            echo '</div>';
        }
        echo '</div>';
        echo '<p class="description">' . esc_html__('Select open days and set opening/closing times.', 'happybites') . '</p>';
    }

    /**
     * Sosyal Medya bölümü callback
     */
    public function social_media_section_callback()
    {
        echo '<p>' . esc_html__('You can configure your social media links here.', 'happybites') . '</p>';
    }

    /**
     * Sosyal Medya alanı callback
     */
    public function social_media_field_callback()
    {
        $options = get_option('happybites_social_media');

        $social_media_fields = array(
            'facebook' => 'Facebook',
            'twitter' => 'Twitter',
            'instagram' => 'Instagram',
            'linkedin' => 'LinkedIn',
            'youtube' => 'YouTube',
            'tiktok' => 'TikTok',
            'whatsapp' => 'WhatsApp',
            'tripadvisor' => 'TripAdvisor',
            'google_business' => 'Google Business'
        );

        echo '<div class="happybites-social-media-container">';
        foreach ($social_media_fields as $key => $name) {
            $url = isset($options[$key]) ? $options[$key] : '';
            echo '<div class="social-media-field">';
            echo '<label for="happybites_social_media_' . esc_attr($key) . '">' . esc_html($name) . '</label>';
            echo '<input type="url" name="happybites_social_media[' . esc_attr($key) . ']" value="' . esc_url($url) . '" class="regular-text" />';
            echo '</div>';
        }
        echo '</div>';
    }

    /**
     * Renkler bölümü callback
     */
    public function colors_section_callback()
    {
        echo '<p>' . esc_html__('You can configure the primary colors here.', 'happybites') . '</p>';
    }

    /**
     * Ana Renk alanı callback
     */
    public function active_color_field_callback()
    {
        $options = get_option('happybites_colors');
        $active_color = isset($options['active_color']) ? $options['active_color'] : '#FF6B6B';

        echo '<input type="color" name="happybites_colors[active_color]" value="' . esc_attr($active_color) . '" class="color-picker" />';
        echo '<p class="description">' . esc_html__('Primary color is used for key UI backgrounds.', 'happybites') . '</p>';
    }

    /**
     * Vurgu Rengi alanı callback
     */
    public function accent_color_field_callback()
    {
        $options = get_option('happybites_colors');
        $accent_color = isset($options['accent_color']) ? $options['accent_color'] : '#4CAF50';

        echo '<input type="color" name="happybites_colors[accent_color]" value="' . esc_attr($accent_color) . '" class="color-picker" />';
        echo '<p class="description">' . esc_html__('Accent color highlights important UI elements.', 'happybites') . '</p>';
    }

    /**
     * Tema Modu bölümü callback
     */
    public function theme_mode_section_callback()
    {
        echo '<p>' . esc_html__('You can set the restaurant theme mode here.', 'happybites') . '</p>';
    }

    /**
     * Tema Modu alanı callback
     */
    public function theme_mode_field_callback()
    {
        $options = get_option('happybites_theme_mode');
        $mode = isset($options['mode']) ? $options['mode'] : 'light';

        echo '<select name="happybites_theme_mode[mode]">';
        echo '<option value="light" ' . selected('light', $mode, false) . '>' . esc_html__('Light Theme', 'happybites') . '</option>';
        echo '<option value="dark" ' . selected('dark', $mode, false) . '>' . esc_html__('Dark Theme', 'happybites') . '</option>';
        echo '</select>';
        echo '<p class="description">' . esc_html__('Select the theme mode.', 'happybites') . '</p>';
    }

    /**
     * WiFi bölümü callback
     */
    public function wifi_section_callback()
    {
        echo '<p>' . esc_html__('You can configure WiFi information here.', 'happybites') . '</p>';
    }

    /**
     * WiFi SSID alanı callback
     */
    public function wifi_ssid_field_callback()
    {
        $options = get_option('happybites_wifi');
        $ssid = isset($options['ssid']) ? $options['ssid'] : '';

        echo '<input type="text" name="happybites_wifi[ssid]" value="' . esc_attr($ssid) . '" class="regular-text" />';
        echo '<p class="description">' . esc_html__('Enter your WiFi SSID.', 'happybites') . '</p>';
    }

    /**
     * WiFi Şifresi alanı callback
     */
    public function wifi_password_field_callback()
    {
        $options = get_option('happybites_wifi');
        $password = isset($options['password']) ? $options['password'] : '';

        echo '<input type="text" name="happybites_wifi[password]" value="' . esc_attr($password) . '" class="regular-text" />';
        echo '<p class="description">' . esc_html__('Enter the WiFi password required for connection.', 'happybites') . '</p>';
    }

    /**
     * Bilgi bölümü callback
     */
    public function information_section_callback()
    {
        echo '<p>' . esc_html__('You can add additional information here.', 'happybites') . '</p>';
    }

    /**
     * Slug bölümü callback
     */
    public function slug_section_callback()
    {
        echo '<p>' . esc_html__('You can customize your menu URL here.', 'happybites') . '</p>';
    }

    /**
     * HTML Bilgi Metni alanı callback
     */
    public function information_field_callback()
    {
        $options = get_option('happybites_information');
        $html_info = isset($options['html_info']) ? $options['html_info'] : '';

        // TinyMCE editörü için ayarlar
        $editor_settings = array(
            'textarea_name' => 'happybites_information[html_info]',
            'textarea_rows' => 10,
            'media_buttons' => false,
            'teeny' => true,
            'tinymce' => array(
                'toolbar1' => 'bold,italic,underline,strikethrough,|,bullist,numlist,|,link,unlink,|,undo,redo',
                'toolbar2' => '',
                'toolbar3' => '',
                'height' => 200
            ),
            'quicktags' => array(
                'buttons' => 'strong,em,link,ul,ol,li,close'
            )
        );

        wp_editor($html_info, 'happybites_information_html_info', $editor_settings);

        echo '<p class="description">' . esc_html__('Enter additional information in HTML format. You can use basic formatting.', 'happybites') . '</p>';
    }

    /**
     * Slug Bilgi Metni alanı callback
     */
    public function slug_field_callback()
    {
        $options  = get_option('happybites_slug');
        $slug     = isset($options['slug']) ? $options['slug'] : '';
        $home_url = home_url('/');

        echo '<input type="text" id="happybites-slug-input" name="happybites_slug[slug]" value="' . esc_attr($slug) . '" class="regular-text" />';
        /* translators: %1$s: site home URL */
        $slug_help = __('Eg: If you type <code>menu</code>, URL becomes <code>%1$smenu</code>.', 'happybites');
        echo '<p class="description">' . wp_kses(
            sprintf($slug_help, esc_html($home_url)),
            ['code' => []]
        ) . '</p>';
    }

    /**
     * Dil ayarları bölümü callback
     */
    public function languages_section_callback()
    {
        echo '<p>' . esc_html__('Select supported languages for menu items. You can enter separate content for each language.', 'happybites') . '</p>';
    }

    /**
     * Dil alanı callback
     */
    public function languages_field_callback()
    {
        $languages = get_option('happybites_languages', []);

        // Her durumda array'e çevir
        if (is_string($languages)) {
            $languages = [$languages];
        } elseif (!is_array($languages)) {
            $languages = [];
        }

        $available_languages = [
            'en' => 'English',
            'de' => 'Deutsch',
            'fr' => 'Français',
            'es' => 'Español',
            'pt' => 'Português',
            'it' => 'Italiano',
            'ru' => 'Русский',
            'tr' => 'Türkçe',
            'ar' => 'العربية',
            'zh' => '中文',
            'ja' => '日本語',
            'ko' => '한국어',
            'ro' => 'Română',
        ];

        echo '<div class="happybites-languages-container">';
        echo '<div class="languages-list">';

        foreach ($available_languages as $code => $name) {
            echo '<label class="language-checkbox">';
            echo '<input type="checkbox" name="happybites_languages[]" value="' . esc_attr($code) . '" ' . checked(in_array($code, $languages, true), true, false) . ' />';
            echo '<span class="language-name">' . esc_html($name) . '</span>';
            echo '<span class="language-code">(' . esc_html($code) . ')</span>';
            echo '</label>';
        }

        echo '</div>';
        echo '<p class="description">' . esc_html__('Selected languages will appear as tabs on the menu item editor.', 'happybites') . '</p>';
        echo '</div>';
    }

    /** Varsayılan dil alanı */
    public function default_language_field_callback()
    {
        $languages = get_option('happybites_languages', []);
        if (is_string($languages)) { $languages = [$languages]; }
        if (!is_array($languages)) { $languages = []; }
        $current = get_option('happybites_default_language', 'en');

        if (empty($languages)) {
            echo '<em>' . esc_html__('Please select at least one language first.', 'happybites') . '</em>';
            return;
        }

        echo '<select name="happybites_default_language">';
        foreach ($languages as $code) {
            printf('<option value="%1$s" %2$s>%1$s</option>', esc_attr($code), selected($current, $code, false));
        }
        echo '</select>';
        echo '<p class="description">' . esc_html__('Default language is shown first to users.', 'happybites') . '</p>';
    }

    /** Varsayılan para birimi alanı */
    public function default_currency_field_callback()
    {
        $current = get_option('happybites_default_currency', 'TRY');
        // Sıralama: en çok kullanılanlardan daha az kullanılanlara doğru ve tekrar edenler kaldırıldı
        $currencies = [
            'USD' => 'USD $',
            'EUR' => 'EUR €',
            'CNY' => 'CNY ¥',
            'JPY' => 'JPY ¥',
            'GBP' => 'GBP £',
            'INR' => 'INR ₹',
            'RUB' => 'RUB ₽',
            'KRW' => 'KRW ₩',
            'TRY' => 'TRY ₺',
            'CHF' => 'CHF Fr',
            'CAD' => 'CAD $',
            'HKD' => 'HKD $',
            'SGD' => 'SGD $',
            'SEK' => 'SEK kr',
            'NOK' => 'NOK kr',
            'DKK' => 'DKK kr',
            'PLN' => 'PLN zł',
            'TWD' => 'TWD $',
            'THB' => 'THB ฿',
            'MYR' => 'MYR RM',
            'PHP' => 'PHP ₱',
            'MXN' => 'MXN $',
            'NZD' => 'NZD $',
            'ZAR' => 'ZAR R',
            'AED' => 'AED د.إ',
            'SAR' => 'SAR ﷼',
            'CZK' => 'CZK Kč',
            'HUF' => 'HUF Ft',
            'RON' => 'RON lei',
            'BGN' => 'BGN лв',
            'HRK' => 'HRK kn',
            'RSD' => 'RSD динара',
            'AZN' => 'AZN ₼',
            'BYN' => 'BYN Br',
            'KGS' => 'KGS сом',
            'MDL' => 'MDL L',
            'MNT' => 'MNT ₮',
            'VND' => 'VND ₫',
            'YER' => 'YER ﷼',
            'ZMW' => 'ZMW K',
        ];

        echo '<select name="happybites_default_currency">';
        foreach ($currencies as $code => $label) {
            printf('<option value="%1$s" %2$s>%3$s</option>', esc_attr($code), selected($current, $code, false), esc_html($label));
        }
        echo '</select>';
        echo '<p class="description">' . esc_html__('Default currency used for displaying prices.', 'happybites') . '</p>';
    }

    /**
     * Kategori sırasını güncelle
     */
    public function update_category_order()
    {
        $this->require_ajax_cap('happybites_sort_nonce');

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in require_ajax_cap().
        $categories = isset($_POST['categories']) && is_array($_POST['categories'])
            ? map_deep(wp_unslash($_POST['categories']), 'sanitize_text_field')
            : array();

        foreach ($categories as $category) {
            $category_id = intval($category['id']);
            $order = intval($category['order']);

            update_term_meta($category_id, '_menu_order', $order);
        }

        wp_send_json_success(__('Categories updated successfully', 'happybites'));
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }

    /**
     * Alt kategori sırasını güncelle
     */
    public function update_subcategory_order()
    {
        $this->require_ajax_cap('happybites_sort_nonce');

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in require_ajax_cap().
        $category_id = isset($_POST['category_id']) ? absint(wp_unslash($_POST['category_id'])) : 0;
        $subcategories = isset($_POST['subcategories']) && is_array($_POST['subcategories'])
            ? map_deep(wp_unslash($_POST['subcategories']), 'sanitize_text_field')
            : array();

        foreach ($subcategories as $subcategory) {
            $subcategory_id = intval($subcategory['id']);
            $order = intval($subcategory['order']);

            update_term_meta($subcategory_id, '_menu_order', $order);
        }

        wp_send_json_success(__('Subcategories updated successfully', 'happybites'));
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }

    /**
     * Ürün sırasını güncelle
     */
    public function update_product_order()
    {
        $this->require_ajax_cap('happybites_sort_nonce');

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in require_ajax_cap().
        $products = isset($_POST['products']) && is_array($_POST['products'])
            ? map_deep(wp_unslash($_POST['products']), 'sanitize_text_field')
            : array();

        foreach ($products as $product) {
            $product_id = intval($product['id']);
            $order = intval($product['order']);
            // 0 veya boş değer, kategorisiz anlamına gelir
            $category_id = isset($product['category_id']) && $product['category_id'] !== '' ? intval($product['category_id']) : 0;

            // Ürün sırasını güncelle
            update_post_meta($product_id, '_menu_order', $order);

            // Ürünün kategorisini güncelle
            if ($category_id > 0) {
                update_post_meta($product_id, '_menu_category', $category_id);
                wp_set_object_terms($product_id, $category_id, 'happybites_menu_category', false);
            } else {
                // Kategorisiz bırak
                update_post_meta($product_id, '_menu_category', '');
                wp_set_object_terms($product_id, array(), 'happybites_menu_category', false);
            }
        }

        wp_send_json_success(__('Products updated successfully', 'happybites'));
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }

    /**
     * Default kategori alanını gizle
     */
    public function remove_default_category()
    {
        add_filter('quick_edit_show_taxonomy', function ($show, $taxonomy, $post_type) {
            if ($taxonomy === 'happybites_menu_category' && $post_type === 'happybites_menu_item') {
                return false;
            }
            return $show;
        }, 10, 3);

        // (Varsa) Bulk Edit'te de gizle
        add_filter('bulk_edit_show_taxonomy', function ($show, $taxonomy, $post_type) {
            if ($taxonomy === 'happybites_menu_category' && $post_type === 'happybites_menu_item') {
                return false;
            }
            return $show;
        }, 10, 3);

        add_filter('register_taxonomy_args', function ($args, $taxonomy) {
            if ($taxonomy === 'happybites_menu_category') {
                // Varsayılan meta kutusunu gösterme
                $args['meta_box_cb'] = false; // veya '__return_false'
            }
            return $args;
        }, 10, 2);

        add_action('add_meta_boxes', function () {
            remove_meta_box('happybites_menu_categorydiv', 'happybites_menu_item', 'side');
        }, 100);
    }

    /**
     * Quick edit kategori kaydetme
     */
    public function save_quick_edit_category()
    {
        $this->require_ajax_cap('happybites_quick_edit_nonce');

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in require_ajax_cap().
        $post_id = isset($_POST['post_id']) ? absint(wp_unslash($_POST['post_id'])) : 0;
        $category = isset($_POST['category']) ? sanitize_text_field(wp_unslash($_POST['category'])) : '';

        // Post'un var olduğunu ve menü öğesi olduğunu kontrol et
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'happybites_menu_item') {
            wp_send_json_error(array(
                'message' => __('Invalid post ID.', 'happybites')
            ));
        }

        // Kategori seçimini kaydet
        update_post_meta($post_id, '_menu_category', $category);

        // Taxonomy'yi güncelle
        if (!empty($category)) {
            wp_set_object_terms($post_id, intval($category), 'happybites_menu_category', false);
        } else {
            wp_set_object_terms($post_id, array(), 'happybites_menu_category', false);
        }

        wp_send_json_success(array(
            'message' => __('Category updated.', 'happybites')
        ));
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }

    /**
     * Post'un kategori seçimini al
     */
    public function get_post_category()
    {
        $this->require_ajax_cap('happybites_quick_edit_nonce');

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in require_ajax_cap().
        $post_id = isset($_POST['post_id']) ? absint(wp_unslash($_POST['post_id'])) : 0;

        // Post'un var olduğunu ve menü öğesi olduğunu kontrol et
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'happybites_menu_item') {
            wp_send_json_error(array(
                'message' => __('Invalid post ID.', 'happybites')
            ));
        }

        // Kategori seçimini al
        $selected_category = get_post_meta($post_id, '_menu_category', true);

        wp_send_json_success(array(
            'category' => $selected_category
        ));
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }

    /**
     * Kategori güncelleme
     */
    public function save_category()
    {
        $this->require_ajax_cap('happybites_category_nonce');

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in require_ajax_cap().
        $type = isset($_POST['type']) ? sanitize_text_field(wp_unslash($_POST['type'])) : '';
        $parent_id = isset($_POST['parent_id']) ? absint(wp_unslash($_POST['parent_id'])) : 0;
        $name = isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
        $description = isset($_POST['description']) ? sanitize_textarea_field(wp_unslash($_POST['description'])) : '';

        if (empty($name)) {
            wp_send_json_error(__('Category name cannot be empty!', 'happybites'));
        }

        if ($type === 'edit') {
            // Kategori güncelleme
            $term = wp_update_term($parent_id, 'happybites_menu_category', array(
                'name' => $name,
                'description' => $description,
                'slug' => sanitize_title($name)
            ));

            if (is_wp_error($term)) {
                wp_send_json_error(__('An error occurred while updating the category: ', 'happybites') . $term->get_error_message());
            }

            wp_send_json_success(__('Category updated successfully!', 'happybites'));
        } else {
            // Yeni kategori ekleme
            $term_data = array(
                'description' => $description,
                'slug' => sanitize_title($name)
            );

            if ($type === 'subcategory' && $parent_id > 0) {
                $term_data['parent'] = $parent_id;
            }

            $term = wp_insert_term($name, 'happybites_menu_category', $term_data);

            if (is_wp_error($term)) {
                wp_send_json_error(__('An error occurred while adding the category: ', 'happybites') . $term->get_error_message());
            }

            // Yeni kategori için order değerini set et
            $max_order = 0;
            if ($type === 'subcategory') {
                // Alt kategori için, aynı parent'a sahip kategorilerin max order'ını bul
                $siblings = get_terms(array(
                    'taxonomy' => 'happybites_menu_category',
                    'hide_empty' => false,
                    'parent' => $parent_id,
                    // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- sort sibling terms by custom menu order.
                    'meta_key' => '_menu_order',
                    'orderby' => 'meta_value_num',
                    'order' => 'DESC',
                    'number' => 1
                ));
                if (!empty($siblings)) {
                    $max_order = get_term_meta($siblings[0]->term_id, '_menu_order', true);
                    $max_order = intval($max_order) + 1;
                }
            } else {
                // Ana kategori için, tüm ana kategorilerin max order'ını bul
                $main_categories = get_terms(array(
                    'taxonomy' => 'happybites_menu_category',
                    'hide_empty' => false,
                    'parent' => 0,
                    // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- sort sibling terms by custom menu order.
                    'meta_key' => '_menu_order',
                    'orderby' => 'meta_value_num',
                    'order' => 'DESC',
                    'number' => 1
                ));
                if (!empty($main_categories)) {
                    $max_order = get_term_meta($main_categories[0]->term_id, '_menu_order', true);
                    $max_order = intval($max_order) + 1;
                }
            }

            update_term_meta($term['term_id'], '_menu_order', $max_order);

            wp_send_json_success(__('Category added successfully!', 'happybites'));
        }
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }

    /**
     * Kategori adı güncelleme
     */
    public function update_category_name()
    {
        $this->require_ajax_cap('happybites_category_nonce');

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in require_ajax_cap().
        $category_id = isset($_POST['category_id']) ? absint(wp_unslash($_POST['category_id'])) : 0;
        $name = isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';

        if (empty($name)) {
            wp_send_json_error(__('Category name cannot be empty!', 'happybites'));
        }

        $term = wp_update_term($category_id, 'happybites_menu_category', array(
            'name' => $name,
            'slug' => sanitize_title($name)
        ));

        if (is_wp_error($term)) {
            wp_send_json_error(__('An error occurred while updating category name: ', 'happybites') . $term->get_error_message());
        }

        wp_send_json_success(__('Category name updated!', 'happybites'));
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }

    /**
     * Ürün kaydetme
     */
    public function save_product()
    {
        $this->require_ajax_cap('happybites_product_nonce');

        // phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in require_ajax_cap().
        $category_id = isset($_POST['category_id']) ? absint(wp_unslash($_POST['category_id'])) : 0;
        $name = isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
        $price = isset($_POST['price']) ? (float) sanitize_text_field(wp_unslash($_POST['price'])) : 0;
        $description = isset($_POST['description']) ? sanitize_textarea_field(wp_unslash($_POST['description'])) : '';

        if (empty($name)) {
            wp_send_json_error(__('Product name cannot be empty.', 'happybites'));
        }

        if ($price < 0) {
            wp_send_json_error(__('Price cannot be negative.', 'happybites'));
        }

        $post_data = array(
            'post_title' => $name,
            'post_content' => $description,
            'post_status' => 'publish',
            'post_type' => 'happybites_menu_item'
        );

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            wp_send_json_error(__('An error occurred while adding the product: ', 'happybites') . $post_id->get_error_message());
        }

        // Meta alanları kaydet
        update_post_meta($post_id, '_menu_price', $price);

        // Ürün için order değerini set et
        $max_order = 0;
        if ($category_id > 0) {
            // Belirli bir kategoriye ait ürünlerin max order'ını bul
            $category_products = get_posts(array(
                'post_type' => 'happybites_menu_item',
                'posts_per_page' => 1,
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- scoped lookup of the last ordered product in a category.
                'meta_query' => array(
                    array(
                        'key' => '_menu_category',
                        'value' => $category_id,
                        'compare' => '='
                    )
                ),
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- sort by custom product order.
                'meta_key' => '_menu_order',
                'orderby' => 'meta_value_num',
                'order' => 'DESC'
            ));
            if (!empty($category_products)) {
                $max_order = get_post_meta($category_products[0]->ID, '_menu_order', true);
                $max_order = intval($max_order) + 1;
            }
        } else {
            // Kategorisiz ürünlerin max order'ını bul
            $uncategorized_products = get_posts(array(
                'post_type' => 'happybites_menu_item',
                'posts_per_page' => 1,
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- scoped lookup of uncategorized products.
                'meta_query' => array(
                    'relation' => 'OR',
                    array(
                        'key' => '_menu_category',
                        'compare' => 'NOT EXISTS'
                    ),
                    array(
                        'key' => '_menu_category',
                        'value' => '',
                        'compare' => '='
                    ),
                    array(
                        'key' => '_menu_category',
                        'value' => '0',
                        'compare' => '='
                    ),
                ),
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- sort by custom product order.
                'meta_key' => '_menu_order',
                'orderby' => 'meta_value_num',
                'order' => 'DESC'
            ));
            if (!empty($uncategorized_products)) {
                $max_order = get_post_meta($uncategorized_products[0]->ID, '_menu_order', true);
                $max_order = intval($max_order) + 1;
            }
        }

        update_post_meta($post_id, '_menu_order', $max_order);

        if ($category_id > 0) {
            update_post_meta($post_id, '_menu_category', $category_id);
            wp_set_object_terms($post_id, $category_id, 'happybites_menu_category', false);
        }

        wp_send_json_success(__('Product added successfully!', 'happybites'));
        // phpcs:enable WordPress.Security.NonceVerification.Missing
    }
}

