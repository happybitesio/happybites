<?php
namespace HappyBites\Admin;

use HappyBites\Loader;

if (!defined('ABSPATH')) {
    exit;
}


/**
 * HappyBites Post Types Class
 */
final class ListColumns {
    
    /**
     * Loader instance
     */
    private $loader;
    
    /**
     * Constructor
     */
    public function __construct(Loader $loader) { $this->loader = $loader; }
    
    /**
     * Initialize post types functionality
     */
    public function register() {
        $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_admin_scripts');
        $this->loader->add_filter('manage_happybites_menu_item_posts_columns', $this, 'add_custom_columns');
        $this->loader->add_action('manage_happybites_menu_item_posts_custom_column', $this, 'custom_column_content', 10, 2);
        $this->loader->add_filter('manage_edit-happybites_menu_item_sortable_columns', $this, 'make_columns_sortable');
        $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_single_category_script');
    }
    
    /**
     * Admin script'lerini yükle
     */
    public function enqueue_admin_scripts($hook) {
        global $post_type, $taxonomy;
        
        // Menü öğeleri sayfalarında yükle (liste, ekleme, düzenleme)
        if ($post_type === 'happybites_menu_item' || $taxonomy === 'happybites_menu_category' || 
            strpos($hook, 'post.php') !== false || strpos($hook, 'post-new.php') !== false) {
            
            wp_enqueue_style(
                'happybites-post-types',
                HAPPYBITES_PLUGIN_URL . 'admin/css/admin.css',
                array(),
                HAPPYBITES_VERSION
            );
        }
    }
    
    /**
     * Custom kolonlar ekle
     */
    public function add_custom_columns($columns) {
        $new_columns = array();
        
        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;
            if ($key === 'title') {
                $new_columns['thumbnail'] = __('Image', 'happybites');
                //$new_columns['menu_category'] = __('Kategori', 'happybites');
                //$new_columns['menu_category_selection'] = __('Kategori', 'happybites');
                $new_columns['menu_price'] = __('Price', 'happybites');
                //$new_columns['menu_weight'] = __('Ağırlık', 'happybites');
                //$new_columns['menu_spice_level'] = __('Acı Seviyesi', 'happybites');
                //$new_columns['menu_tags'] = __('Etiketler', 'happybites');
            }
        }
        
        return $new_columns;
    }
    
    /**
     * Custom kolon içeriği
     */
    public function custom_column_content($column, $post_id) {
        switch ($column) {
            case 'thumbnail':
                if (has_post_thumbnail($post_id)) {
                    $thumbnail_id = get_post_thumbnail_id($post_id);
                    $thumbnail_url = wp_get_attachment_image_src($thumbnail_id, 'thumbnail');
                    if ($thumbnail_url) {
                        echo '<img src="' . esc_url($thumbnail_url[0]) . '" alt="' . esc_attr(get_the_title($post_id)) . '" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />';
                    }
                } else {
                    echo '<span style="color: #999; font-style: italic;">' . esc_html__('No image', 'happybites') . '</span>';
                }
                break;
            
            case 'menu_category_selection':
                $selected_category = get_post_meta($post_id, '_menu_category', true);
                    
                if (!empty($selected_category)) {
                    $category = get_term($selected_category, 'happybites_menu_category');
                    if ($category && !is_wp_error($category)) {
                        echo '<strong>' . esc_html($category->name) . '</strong>';
                    } else {
                        echo '<em>' . esc_html__('Category not found', 'happybites') . '</em>';
                    }
                } else {
                    echo '<em>' . esc_html__('No category selected', 'happybites') . '</em>';
                }
                break;
                
            case 'menu_category':
                $terms = get_the_terms($post_id, 'happybites_menu_category');
                if ($terms && !is_wp_error($terms)) {
                    $term_names = array();
                    foreach ($terms as $term) {
                        $term_names[] = $term->name;
                    }
                    echo esc_html(implode(', ', $term_names));
                }
                break;
                
            case 'menu_price':
                $price = get_post_meta($post_id, '_menu_price', true);
                if ($price) {
                    echo esc_html(number_format((float) $price, 2) . ' ₺');
                }
                break;
                
            case 'menu_weight':
                $weight = get_post_meta($post_id, '_menu_weight', true);
                if ($weight) {
                    echo esc_html((string) $weight) . ' g';
                }
                break;
                
            case 'menu_spice_level':
                $spice_level = get_post_meta($post_id, '_menu_spice_level', true);
                if ($spice_level !== '') {
                    $spice_levels = array(
                        '0' => __('0 - Not Spicy', 'happybites'),
                        '1' => __('1 - Mild', 'happybites'),
                        '2' => __('2 - Medium', 'happybites'),
                        '3' => __('3 - Spicy', 'happybites'),
                    );
                    echo isset($spice_levels[$spice_level])
                        ? esc_html($spice_levels[$spice_level])
                        : esc_html((string) $spice_level);
                }
                break;
                
            case 'menu_tags':
                $tags = get_post_meta($post_id, '_menu_tags', true);
                if ($tags && is_array($tags)) {
                    $tag_labels = array(
                        'out_of_stock' => __('Out of Stock', 'happybites'),
                        'new_product' => __('New Product', 'happybites'),
                        'vegan' => __('Vegan', 'happybites'),
                        'vegetarian' => __('Vegetarian', 'happybites'),
                        'gluten_free' => __('Gluten Free', 'happybites'),
                        'organic' => __('Organic', 'happybites'),
                        'spicy' => __('Spicy', 'happybites'),
                        'popular' => __('Popular', 'happybites'),
                        'seasonal' => __('Seasonal', 'happybites'),
                        'chef_special' => __('Chef Special', 'happybites')
                    );
                    
                    $display_tags = array();
                    foreach ($tags as $tag) {
                        if (isset($tag_labels[$tag])) {
                            $display_tags[] = $tag_labels[$tag];
                        }
                    }
                    
                    if (!empty($display_tags)) {
                        echo esc_html(implode(', ', $display_tags));
                    }
                }
                break;
        }
    }
    
    /**
     * Kolonları sıralanabilir yap
     */
    public function make_columns_sortable($columns) {
        $columns['title'] = 'title';
        $columns['menu_category'] = 'menu_category';
        $columns['menu_category_selection'] = 'menu_category_selection';
        $columns['menu_price'] = 'menu_price';
        $columns['menu_weight'] = 'menu_weight';
        $columns['menu_spice_level'] = 'menu_spice_level';
        return $columns;
    }

    /**
     * Limit classic editor category checkboxes to a single selection.
     */
    public function enqueue_single_category_script($hook) {
        global $post_type;

        if ($post_type !== 'happybites_menu_item') {
            return;
        }

        if (!in_array($hook, ['post.php', 'post-new.php'], true)) {
            return;
        }

        wp_enqueue_script(
            'happybites-single-category',
            HAPPYBITES_PLUGIN_URL . 'admin/js/single-category.js',
            ['jquery'],
            HAPPYBITES_VERSION,
            true
        );
    }
} 
