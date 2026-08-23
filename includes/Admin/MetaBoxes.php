<?php
namespace HappyBites\Admin;

use HappyBites\Loader;

if (!defined('ABSPATH')) {
    exit;
}


/**
 * HappyBites Meta Boxes Class
 */
final class MetaBoxes
{

    /**
     * Loader instance
     */
    private $loader;

    /**
     * Constructor
     */
    public function __construct(Loader $loader) { $this->loader = $loader; }

    /**
     * Initialize meta boxes functionality
     */
    public function register()
    {
        $this->loader->add_action('add_meta_boxes', $this, 'add_meta_boxes');
        $this->loader->add_action('save_post', $this, 'save_meta_boxes');

        // Kategori için custom fields
        $this->loader->add_action('happybites_menu_category_add_form_fields', $this, 'add_category_fields');
        $this->loader->add_action('happybites_menu_category_edit_form_fields', $this, 'edit_category_fields');
        $this->loader->add_action('created_happybites_menu_category', $this, 'save_category_fields');
        $this->loader->add_action('edited_happybites_menu_category', $this, 'save_category_fields');
    }

    /**
     * Meta box'ları ekle
     */
    public function add_meta_boxes()
    {
        add_meta_box(
            'happybites_menu_details',
            __('Menu Item Details', 'happybites'),
            array($this, 'menu_details_callback'),
            'happybites_menu_item',
            'normal',
            'high'
        );

        // Kategori seçimi için custom meta box
        add_meta_box(
            'happybites_category_selection',
            __('Category Selection', 'happybites'),
            array($this, 'category_selection_callback'),
            'happybites_menu_item',
            'side',
            'high'
        );
    }

    /**
     * Menü öğesi detayları meta box
     */
    public function menu_details_callback($post)
    {
        wp_nonce_field('happybites_menu_details', 'happybites_menu_details_nonce');

        // Meta verileri al
        $meta_data = $this->get_menu_meta_data($post->ID);

        // Aktif dilleri al
        $active_languages = get_option('happybites_languages', array('en'));
        $language_names = $this->get_language_names();

        // Etiketler
        $available_tags = $this->get_available_tags();

        ?>
        <div class="happybites-menu-details">

            <!-- Multilingual Content -->
            <?php if (!empty($active_languages)): ?>
                <div class="happybites-tabs">
                    <div class="happybites-tab-nav">
                        <?php foreach ($active_languages as $index => $lang_code): ?>
                            <button type="button" class="tab-button <?php echo $index === 0 ? 'active' : ''; ?>" data-tab="<?php echo $lang_code; ?>">
                                <?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>
                            </button>
                        <?php endforeach; ?>
                    </div>

                    <?php foreach ($active_languages as $index => $lang_code): ?>
                        <div class="happybites-tab-content <?php echo $index === 0 ? 'active' : ''; ?>" data-tab="<?php echo $lang_code; ?>">

                            <!-- Başlık -->
                            <div class="language-field">
                                <label for="menu_title_<?php echo $lang_code; ?>"><?php _e('Title', 'happybites'); ?>(<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)</label>
                                <input type="text" name="menu_title_<?php echo $lang_code; ?>" id="menu_title_<?php echo $lang_code; ?>"
                                    value="<?php echo esc_attr(get_post_meta($post->ID, '_menu_title_' . $lang_code, true)); ?>" />
                            </div>

                            <!-- Açıklama -->
                            <div class="language-field">
                                <label for="menu_description_<?php echo $lang_code; ?>"><?php _e('Description', 'happybites'); ?> (<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)</label>
                                <textarea name="menu_description_<?php echo $lang_code; ?>" id="menu_description_<?php echo $lang_code; ?>" rows="4"><?php echo esc_textarea(get_post_meta($post->ID, '_menu_description_' . $lang_code, true)); ?></textarea>
                            </div>

                            <!-- İçindekiler -->
                            <div class="language-field">
                                <label><?php _e('Ingredients', 'happybites'); ?> (<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)</label>
                                <div class="ingredients-list-<?php echo $lang_code; ?>">
                                    <?php
                                    $lang_ingredients = get_post_meta($post->ID, '_menu_ingredients_' . $lang_code, true);
                                    if (!is_array($lang_ingredients)) {
                                        $lang_ingredients = array();
                                    }

                                    if (!empty($lang_ingredients)) {
                                        foreach ($lang_ingredients as $ing_index => $ingredient) {
                                        ?>
                                            <div class="ingredient-item">
                                                <input type="text" name="menu_ingredients_<?php echo $lang_code; ?>[<?php echo $ing_index; ?>][name]"
                                                    value="<?php echo esc_attr($ingredient['name']); ?>"
                                                    placeholder="<?php _e('Ingredient', 'happybites'); ?>" />
                                                <input type="text" name="menu_ingredients_<?php echo $lang_code; ?>[<?php echo $ing_index; ?>][amount]"
                                                    value="<?php echo esc_attr($ingredient['amount']); ?>"
                                                    placeholder="<?php _e('Amount', 'happybites'); ?>" />
                                                <button type="button" class="remove-ingredient button"><?php _e('Remove', 'happybites'); ?></button>
                                            </div>
                                        <?php
                                        }
                                    }
                                    ?>
                                </div>
                                <button type="button" class="add-ingredient-<?php echo $lang_code; ?> button"><?php _e('Add Ingredient', 'happybites'); ?></button>
                            </div>

                            <!-- Alerjenler -->
                            <div class="language-field">
                                <label><?php _e('Allergens', 'happybites'); ?> (<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)</label>
                                <div class="allergens-list-<?php echo $lang_code; ?>">
                                    <?php
                                    $lang_allergens = get_post_meta($post->ID, '_menu_allergens_' . $lang_code, true);
                                    if (!is_array($lang_allergens)) {
                                        $lang_allergens = array();
                                    }

                                    if (!empty($lang_allergens)) {
                                        foreach ($lang_allergens as $all_index => $allergen) {
                                        ?>
                                            <div class="allergen-item">
                                                <input type="text" name="menu_allergens_<?php echo $lang_code; ?>[<?php echo $all_index; ?>]"
                                                    value="<?php echo esc_attr($allergen); ?>"
                                                    placeholder="<?php _e('Allergen name', 'happybites'); ?>" />
                                                <button type="button" class="remove-allergen button"><?php _e('Remove', 'happybites'); ?></button>
                                            </div>
                                        <?php
                                        }
                                    }
                                    ?>
                                </div>
                                <button type="button" class="add-allergen-<?php echo $lang_code; ?> button"><?php _e('Add Allergen', 'happybites'); ?></button>
                            </div>

                            <!-- Alerjen Notları -->
                            <div class="language-field">
                                <label for="menu_allergen_notes_<?php echo $lang_code; ?>"><?php _e('Allergen Notes', 'happybites'); ?> (<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)</label>
                                <textarea name="menu_allergen_notes_<?php echo $lang_code; ?>" id="menu_allergen_notes_<?php echo $lang_code; ?>" rows="3"><?php echo esc_textarea(get_post_meta($post->ID, '_menu_allergen_notes_' . $lang_code, true)); ?></textarea>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <!-- Temel Bilgiler -->
            <h3 style="margin: 0; padding: 0;"><?php _e('Basic Information', 'happybites'); ?></h3>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="menu_price"><?php _e('Price', 'happybites'); ?></label>
                    </th>
                    <td>
                        <input type="number" name="menu_price" id="menu_price" value="<?php echo esc_attr($meta_data['price']); ?>" min="0" step="0.01" />
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="menu_weight"><?php _e('Weight (grams)', 'happybites'); ?></label>
                    </th>
                    <td>
                        <input type="number" name="menu_weight" id="menu_weight" value="<?php echo esc_attr($meta_data['weight']); ?>" min="0" />
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="menu_origin_country"><?php _e('Country of Origin', 'happybites'); ?></label>
                    </th>
                    <td>
                        <input type="text" name="menu_origin_country" id="menu_origin_country" value="<?php echo esc_attr($meta_data['origin_country']); ?>" />
                        <p class="description"><?php _e('Eg: Turkey, Italy, China, etc.', 'happybites'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="menu_spice_level"><?php _e('Spice Level', 'happybites'); ?></label>
                    </th>
                    <td>
                        <select name="menu_spice_level" id="menu_spice_level">
                            <option value=""><?php _e('Select', 'happybites'); ?></option>
                            <option value="0" <?php selected($meta_data['spice_level'], '0'); ?>><?php _e('0 - Not Spicy', 'happybites'); ?></option>
                            <option value="1" <?php selected($meta_data['spice_level'], '1'); ?>><?php _e('1 - Mild', 'happybites'); ?></option>
                            <option value="2" <?php selected($meta_data['spice_level'], '2'); ?>><?php _e('2 - Medium', 'happybites'); ?></option>
                            <option value="3" <?php selected($meta_data['spice_level'], '3'); ?>><?php _e('3 - Spicy', 'happybites'); ?></option>
                            <option value="4" <?php selected($meta_data['spice_level'], '4'); ?>><?php _e('4 - Very Spicy', 'happybites'); ?></option>
                            <option value="5" <?php selected($meta_data['spice_level'], '5'); ?>><?php _e('5 - Extremely Spicy', 'happybites'); ?></option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="menu_preparation_time"><?php _e('Preparation Time (minutes)', 'happybites'); ?></label>
                    </th>
                    <td>
                        <input type="number" name="menu_preparation_time" id="menu_preparation_time" value="<?php echo esc_attr($meta_data['preparation_time']); ?>" min="0" />
                        <p class="description"><?php _e('Enter preparation time in minutes', 'happybites'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="menu_portion_size"><?php _e('Portion Size', 'happybites'); ?></label>
                    </th>
                    <td>
                        <input type="text" name="menu_portion_size" id="menu_portion_size" value="<?php echo esc_attr($meta_data['portion_size']); ?>" />
                        <p class="description"><?php _e('Eg: 100g, 1 portion, etc.', 'happybites'); ?></p>
                    </td>
                </tr>
            </table>

            <!-- Besin Değerleri -->
            <h3 style="margin: 0; padding: 0;"><?php _e('Nutrition Facts', 'happybites'); ?></h3>
            <div id="menu-nutrition-container">
                <div class="nutrition-list">
                    <?php
                    if (!empty($meta_data['nutrition'])) {
                        foreach ($meta_data['nutrition'] as $index => $item) {
                    ?>
                            <div class="nutrition-item">
                                <input type="text" name="menu_nutrition[<?php echo $index; ?>][name]"
                                    value="<?php echo esc_attr($item['name']); ?>"
                                    placeholder="<?php _e('Nutrient', 'happybites'); ?>" />
                                <input type="text" name="menu_nutrition[<?php echo $index; ?>][value]"
                                    value="<?php echo esc_attr($item['value']); ?>"
                                    placeholder="<?php _e('Value', 'happybites'); ?>" />
                                <button type="button" class="remove-nutrition button"><?php _e('Remove', 'happybites'); ?></button>
                            </div>
                    <?php
                        }
                    }
                    ?>
                </div>
                <button type="button" id="add-nutrition" class="button"><?php _e('Add Nutrition', 'happybites'); ?></button>

                <script type="text/template" id="nutrition-template">
                    <div class="nutrition-item">
                        <input type="text" name="menu_nutrition[{index}][name]" placeholder="<?php _e('Nutrient', 'happybites'); ?>" />
                        <input type="text" name="menu_nutrition[{index}][value]" placeholder="<?php _e('Value', 'happybites'); ?>" />
                        <button type="button" class="remove-nutrition button"><?php _e('Remove', 'happybites'); ?></button>
                    </div>
                </script>
            </div>

            <!-- Katkı Maddeleri -->
            <h3 style="margin: 20px 0 0 0; padding: 0;"><?php _e('Additives', 'happybites'); ?></h3>
            <div id="menu-additives-container">
                <div class="additives-list">
                    <?php
                    if (!empty($meta_data['additives'])) {
                        foreach ($meta_data['additives'] as $index => $additive) {
                    ?>
                            <div class="additive-item">
                                <input type="text" name="menu_additives[<?php echo $index; ?>]"
                                    value="<?php echo esc_attr($additive); ?>"
                                    placeholder="<?php _e('Additive name', 'happybites'); ?>" />
                                <button type="button" class="remove-additive button"><?php _e('Remove', 'happybites'); ?></button>
                            </div>
                    <?php
                        }
                    }
                    ?>
                </div>
                <button type="button" id="add-additive" class="button"><?php _e('Add Additive', 'happybites'); ?></button>

                <script type="text/template" id="additive-template">
                    <div class="additive-item">
                        <input type="text" name="menu_additives[{index}]" placeholder="<?php _e('Additive name', 'happybites'); ?>" />
                        <button type="button" class="remove-additive button"><?php _e('Remove', 'happybites'); ?></button>
                    </div>
                </script>
            </div>

            <!-- Etiketler -->
            <h3 style="margin: 20px 0 0 0; padding: 0;"><?php _e('Tags', 'happybites'); ?></h3>
            <div id="menu-tags-container">
                <div class="tags-list">
                    <?php
                    foreach ($available_tags as $key => $label) {
                        $checked = in_array($key, $meta_data['tags']) ? 'checked' : '';
                    ?>
                        <label class="tag-checkbox">
                            <input type="checkbox" name="menu_tags[]" value="<?php echo $key; ?>" <?php echo $checked; ?> />
                            <?php echo $label; ?>
                        </label>
                    <?php
                    }
                    ?>
                </div>
            </div>
        </div>
    <?php
    }

    /**
     * Meta verileri al
     */
    private function get_menu_meta_data($post_id)
    {
        return array(
            'ingredients' => get_post_meta($post_id, '_menu_ingredients', true) ?: array(),
            'price' => get_post_meta($post_id, '_menu_price', true),
            'weight' => get_post_meta($post_id, '_menu_weight', true),
            'origin_country' => get_post_meta($post_id, '_menu_origin_country', true),
            'spice_level' => get_post_meta($post_id, '_menu_spice_level', true),
            'preparation_time' => get_post_meta($post_id, '_menu_preparation_time', true),
            'nutrition' => get_post_meta($post_id, '_menu_nutrition', true) ?: array(),
            'portion_size' => get_post_meta($post_id, '_menu_portion_size', true),
            'allergens' => get_post_meta($post_id, '_menu_allergens', true) ?: array(),
            'allergen_notes' => get_post_meta($post_id, '_menu_allergen_notes', true),
            'additives' => get_post_meta($post_id, '_menu_additives', true) ?: array(),
            'tags' => get_post_meta($post_id, '_menu_tags', true) ?: array(),
            'selected_category' => get_post_meta($post_id, '_menu_category', true)
        );
    }

    /**
     * Dil isimlerini al
     */
    private function get_language_names()
    {
        return array(
            'tr' => 'Türkçe',
            'en' => 'English',
            'de' => 'Deutsch',
            'fr' => 'Français',
            'es' => 'Español',
            'it' => 'Italiano',
            'ru' => 'Русский',
            'ar' => 'العربية',
            'zh' => '中文',
            'ja' => '日本語',
            'ko' => '한국어',
            'ro' => 'Română'
        );
    }

    /**
     * Mevcut etiketleri al
     */
    private function get_available_tags()
    {
        return array(
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
    }

    /**
     * Kategori seçimi meta box
     */
    public function category_selection_callback($post)
    {
        wp_nonce_field('happybites_category_selection', 'happybites_category_selection_nonce');

        // Seçili kategori
        $selected_category = get_post_meta($post->ID, '_menu_category', true);

        // Kategorileri hiyerarşik olarak al
        $categories = get_terms(array(
            'taxonomy' => 'happybites_menu_category',
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC',
            'parent' => 0 // Sadece üst kategorileri al
        ));

    ?>
        <div class="category-selection">
            <div class="category-options">
                <label>
                    <input type="radio" name="menu_category" value="" <?php checked($selected_category, ''); ?> />
                    <?php _e('No Category Selected', 'happybites'); ?>
                </label>
                <?php $this->display_hierarchical_categories($categories, $selected_category); ?>
            </div>
        </div>

        <style>
            .category-selection {
                margin: 10px 0;
            }

            .category-options label {
                display: block;
                margin: 8px 0;
                padding: 5px;
                cursor: pointer;
            }

            .category-options label:hover {
                background-color: #f9f9f9;
            }

            .category-options input[type="radio"] {
                margin-right: 8px;
            }

            .main-category span {
                font-weight: bold;
            }

            .category-hierarchy {
                margin-left: 20px !important;
            }

            .subcategory-hierarchy {
                margin-left: 40px !important;
            }
        </style>
        <?php
    }

    /**
     * Hiyerarşik kategorileri göster
     */
    private function display_hierarchical_categories($categories, $selected_category, $level = 0)
    {
        foreach ($categories as $category) {
            $class = '';
            if ($level === 0) {
                $class = 'main-category';
            } elseif ($level === 1) {
                $class = 'category-hierarchy';
            } else {
                $class = 'subcategory-hierarchy';
            }

            $checked = checked($selected_category, $category->term_id, false);
        ?>
            <label class="<?php echo $class; ?>">
                <input type="radio" name="menu_category" value="<?php echo esc_attr($category->term_id); ?>" <?php echo $checked; ?> />
                <span><?php echo esc_html($category->name); ?></span>
            </label>
        <?php
            // Alt kategorileri al
            $child_categories = get_terms(array(
                'taxonomy' => 'happybites_menu_category',
                'hide_empty' => false,
                'orderby' => 'name',
                'order' => 'ASC',
                'parent' => $category->term_id
            ));

            if (!empty($child_categories)) {
                $this->display_hierarchical_categories($child_categories, $selected_category, $level + 1);
            }
        }
    }

    /**
     * Meta box'ları kaydet
     */
    public function save_meta_boxes($post_id)
    {
        // Güvenlik kontrolleri
        if (!isset($_POST['post_type']) || $_POST['post_type'] !== 'happybites_menu_item') {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        // Menü öğesi detayları
        if (
            isset($_POST['happybites_menu_details_nonce']) &&
            wp_verify_nonce($_POST['happybites_menu_details_nonce'], 'happybites_menu_details')
        ) {

            $this->save_menu_details($post_id);
        }

        // Kategori seçimi
        if (
            isset($_POST['happybites_category_selection_nonce']) &&
            wp_verify_nonce($_POST['happybites_category_selection_nonce'], 'happybites_category_selection')
        ) {

            $this->save_category_selection($post_id);
        }
    }

    /**
     * Menü detaylarını kaydet
     */
    private function save_menu_details($post_id)
    {
        // Temel bilgiler
        $fields = array('menu_price', 'menu_weight', 'menu_origin_country', 'menu_spice_level', 'menu_preparation_time');
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
            }
        }

        // İçindekiler
        if (isset($_POST['menu_ingredients']) && is_array($_POST['menu_ingredients'])) {
            $ingredients = array();
            foreach ($_POST['menu_ingredients'] as $ingredient) {
                if (!empty($ingredient['name'])) {
                    $ingredients[] = array(
                        'name' => sanitize_text_field($ingredient['name']),
                        'amount' => sanitize_text_field($ingredient['amount'])
                    );
                }
            }
            update_post_meta($post_id, '_menu_ingredients', $ingredients);
        }

        // Besin değerleri
        if (isset($_POST['menu_portion_size'])) {
            update_post_meta($post_id, '_menu_portion_size', sanitize_text_field($_POST['menu_portion_size']));
        }

        if (isset($_POST['menu_nutrition']) && is_array($_POST['menu_nutrition'])) {
            $nutrition = array();
            foreach ($_POST['menu_nutrition'] as $item) {
                if (!empty($item['name'])) {
                    $nutrition[] = array(
                        'name' => sanitize_text_field($item['name']),
                        'value' => sanitize_text_field($item['value'])
                    );
                }
            }
            update_post_meta($post_id, '_menu_nutrition', $nutrition);
        }

        // Alerjenler
        if (isset($_POST['menu_allergens']) && is_array($_POST['menu_allergens'])) {
            $allergens = array();
            foreach ($_POST['menu_allergens'] as $allergen) {
                if (!empty($allergen)) {
                    $allergens[] = sanitize_text_field($allergen);
                }
            }
            update_post_meta($post_id, '_menu_allergens', $allergens);
        } else {
            update_post_meta($post_id, '_menu_allergens', array());
        }

        if (isset($_POST['menu_allergen_notes'])) {
            update_post_meta($post_id, '_menu_allergen_notes', sanitize_textarea_field($_POST['menu_allergen_notes']));
        }

        // Katkı maddeleri
        if (isset($_POST['menu_additives']) && is_array($_POST['menu_additives'])) {
            $additives = array();
            foreach ($_POST['menu_additives'] as $additive) {
                if (!empty($additive)) {
                    $additives[] = sanitize_text_field($additive);
                }
            }
            update_post_meta($post_id, '_menu_additives', $additives);
        } else {
            update_post_meta($post_id, '_menu_additives', array());
        }

        // Etiketler
        if (isset($_POST['menu_tags']) && is_array($_POST['menu_tags'])) {
            $tags = array_map('sanitize_text_field', $_POST['menu_tags']);
            update_post_meta($post_id, '_menu_tags', $tags);
        } else {
            update_post_meta($post_id, '_menu_tags', array());
        }

        // Çok dilli alanları kaydet
        $this->save_multilingual_fields($post_id);
    }

    /**
     * Çok dilli alanları kaydet
     */
    private function save_multilingual_fields($post_id)
    {
        $active_languages = get_option('happybites_languages', array('en'));

        foreach ($active_languages as $lang_code) {
            // Başlık
            if (isset($_POST['menu_title_' . $lang_code])) {
                update_post_meta($post_id, '_menu_title_' . $lang_code, sanitize_text_field($_POST['menu_title_' . $lang_code]));
            }

            // Açıklama
            if (isset($_POST['menu_description_' . $lang_code])) {
                update_post_meta($post_id, '_menu_description_' . $lang_code, sanitize_textarea_field($_POST['menu_description_' . $lang_code]));
            }

            // İçindekiler
            if (isset($_POST['menu_ingredients_' . $lang_code]) && is_array($_POST['menu_ingredients_' . $lang_code])) {
                $lang_ingredients = array();
                foreach ($_POST['menu_ingredients_' . $lang_code] as $ingredient) {
                    if (!empty($ingredient['name'])) {
                        $lang_ingredients[] = array(
                            'name' => sanitize_text_field($ingredient['name']),
                            'amount' => sanitize_text_field($ingredient['amount'])
                        );
                    }
                }
                update_post_meta($post_id, '_menu_ingredients_' . $lang_code, $lang_ingredients);
            }

            // Alerjenler
            if (isset($_POST['menu_allergens_' . $lang_code]) && is_array($_POST['menu_allergens_' . $lang_code])) {
                $lang_allergens = array();
                foreach ($_POST['menu_allergens_' . $lang_code] as $allergen) {
                    if (!empty($allergen)) {
                        $lang_allergens[] = sanitize_text_field($allergen);
                    }
                }
                update_post_meta($post_id, '_menu_allergens_' . $lang_code, $lang_allergens);
            } else {
                update_post_meta($post_id, '_menu_allergens_' . $lang_code, array());
            }

            // Alerjen Notları
            if (isset($_POST['menu_allergen_notes_' . $lang_code])) {
                update_post_meta($post_id, '_menu_allergen_notes_' . $lang_code, sanitize_textarea_field($_POST['menu_allergen_notes_' . $lang_code]));
            }
        }
    }

    /**
     * Kategori seçimini kaydet
     */
    private function save_category_selection($post_id)
    {
        if (isset($_POST['menu_category'])) {
            $selected_category = sanitize_text_field($_POST['menu_category']);
            update_post_meta($post_id, '_menu_category', $selected_category);

            // Kategoriyi taxonomy'ye de ata
            if (!empty($selected_category)) {
                wp_set_object_terms($post_id, intval($selected_category), 'happybites_menu_category', false);
            } else {
                // Kategori seçilmemişse, tüm kategorileri kaldır
                wp_set_object_terms($post_id, array(), 'happybites_menu_category', false);
            }
        }
    }

    /**
     * Kategori ekleme formu için alanlar
     */
    public function add_category_fields()
    {
        $active_languages = get_option('happybites_languages', array('en'));
        $language_names = $this->get_language_names();
        ?>
        <div class="happybites-tabs">
            <div class="happybites-tab-nav">
                <?php foreach ($active_languages as $index => $lang_code): ?>
                    <button type="button" class="tab-button <?php echo $index === 0 ? 'active' : ''; ?>" data-tab="<?php echo $lang_code; ?>">
                        <?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>
                    </button>
                <?php endforeach; ?>
            </div>

            <?php foreach ($active_languages as $index => $lang_code): ?>
                <div class="happybites-tab-content <?php echo $index === 0 ? 'active' : ''; ?>" data-tab="<?php echo $lang_code; ?>">

                    <!-- Category Name -->
                    <div class="form-field">
                        <label for="category_name_<?php echo $lang_code; ?>">
                            <?php _e('Category Name', 'happybites'); ?> (<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)
                        </label>
                        <input type="text" name="category_name_<?php echo $lang_code; ?>" id="category_name_<?php echo $lang_code; ?>" />
                        <p class="description"><?php _e('Enter the category name for this language', 'happybites'); ?></p>
                    </div>

                    <!-- Category Description -->
                    <div class="form-field">
                        <label for="category_description_<?php echo $lang_code; ?>">
                            <?php _e('Category Description', 'happybites'); ?> (<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)
                        </label>
                        <textarea name="category_description_<?php echo $lang_code; ?>" id="category_description_<?php echo $lang_code; ?>" rows="3"></textarea>
                        <p class="description"><?php _e('Enter the category description for this language', 'happybites'); ?></p>
                    </div>

                </div>
            <?php endforeach; ?>
        </div>
    <?php
    }

    /**
     * Kategori düzenleme formu için alanlar
     */
    public function edit_category_fields($term)
    {
        $active_languages = get_option('happybites_languages', array('en'));
        $language_names = $this->get_language_names();
    ?>
        <tr class="form-field">
            <th scope="row" colspan="2">
                <h3><?php _e('Multilingual Content', 'happybites'); ?></h3>
            </th>
        </tr>

        <tr class="form-field">
            <th scope="row" colspan="2">
                <div class="happybites-tabs">
                    <div class="happybites-tab-nav">
                        <?php foreach ($active_languages as $index => $lang_code): ?>
                            <button type="button" class="tab-button <?php echo $index === 0 ? 'active' : ''; ?>" data-tab="<?php echo $lang_code; ?>">
                                <?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>
                            </button>
                        <?php endforeach; ?>
                    </div>

                    <?php foreach ($active_languages as $index => $lang_code): ?>
                        <div class="happybites-tab-content <?php echo $index === 0 ? 'active' : ''; ?>" data-tab="<?php echo $lang_code; ?>">

                            <!-- Category Name -->
                            <div class="form-field">
                                <label for="category_name_<?php echo $lang_code; ?>">
                                    <?php _e('Category Name', 'happybites'); ?> (<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)
                                </label>
                                <input type="text" name="category_name_<?php echo $lang_code; ?>" id="category_name_<?php echo $lang_code; ?>"
                                    value="<?php echo esc_attr(get_term_meta($term->term_id, 'category_name_' . $lang_code, true)); ?>" />
                                <p class="description"><?php _e('Enter the category name for this language', 'happybites'); ?></p>
                            </div>

                            <!-- Category Description -->
                            <div class="form-field">
                                <label for="category_description_<?php echo $lang_code; ?>">
                                    <?php _e('Category Description', 'happybites'); ?> (<?php echo isset($language_names[$lang_code]) ? $language_names[$lang_code] : $lang_code; ?>)
                                </label>
                                <textarea name="category_description_<?php echo $lang_code; ?>" id="category_description_<?php echo $lang_code; ?>" rows="3"><?php echo esc_textarea(get_term_meta($term->term_id, 'category_description_' . $lang_code, true)); ?></textarea>
                                <p class="description"><?php _e('Enter the category description for this language', 'happybites'); ?></p>
                            </div>

                        </div>
                    <?php endforeach; ?>
                </div>
            </th>
        </tr>
<?php
    }

    /**
     * Kategori alanlarını kaydet
     */
    public function save_category_fields($term_id)
    {
        $active_languages = get_option('happybites_languages', array('en'));

        foreach ($active_languages as $lang_code) {
            // Kategori adı
            if (isset($_POST['category_name_' . $lang_code])) {
                update_term_meta($term_id, 'category_name_' . $lang_code, sanitize_text_field($_POST['category_name_' . $lang_code]));
            }

            // Kategori açıklaması
            if (isset($_POST['category_description_' . $lang_code])) {
                update_term_meta($term_id, 'category_description_' . $lang_code, sanitize_textarea_field($_POST['category_description_' . $lang_code]));
            }
        }
    }
}

