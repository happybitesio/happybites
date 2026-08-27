/**
 * HappyBites Post Types JavaScript
 *
 * @package HappyBites
 * @since 1.0.0
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Post types sayfası yüklendiğinde çalışacak kodlar
        initHappyBitesPostTypes();
        
    });
    
    /**
     * Post types başlatma fonksiyonu
     */
    function initHappyBitesPostTypes() {
        // Meta box'lar için dinamik alanlar
        if ($('#menu-ingredients-container').length) {
            initIngredientsManager();
        }
        
        if ($('#menu-nutrition-container').length) {
            initNutritionManager();
        }
        
        if ($('#menu-allergens-container').length) {
            initAllergensManager();
        }
        
        if ($('#menu-additives-container').length) {
            initAdditivesManager();
        }
        
        // Tab sistemi
        if ($('.happybites-tabs').length) {
            initTabSystem();
        }
        
        // Çok dilli dinamik alanlar
        if ($('.happybites-tabs').length) {
            initMultilingualFields();
        }

        if ($('#happybites_category_image_upload').length) {
            initCategoryImageField();
        }
    }
    
    /**
     * İçindekiler yöneticisi
     */
    function initIngredientsManager() {
        
        var $container = $('#menu-ingredients-container');
        var $list = $container.find('.ingredients-list');
        var $template = $('#ingredient-template');
        var ingredientIndex = $list.find('.ingredient-item').length;
        
        // İçindekiler ekle
        $('#add-ingredient').on('click', function() {
            var template = $template.html()
                .replace(/{index}/g, ingredientIndex);
            
            $list.append(template);
            ingredientIndex++;
            
            // Yeni eklenen içindekiler için event listener'ları ekle
            $list.find('.ingredient-item:last-child .remove-ingredient').on('click', removeIngredient);
        });
        
        // İçindekiler kaldır
        $list.on('click', '.remove-ingredient', removeIngredient);
        
        function removeIngredient() {
            $(this).closest('.ingredient-item').remove();
        }
        
    }
    
    /**
     * Besin değerleri yöneticisi
     */
    function initNutritionManager() {
        
        var $container = $('#menu-nutrition-container');
        var $list = $container.find('.nutrition-list');
        var $template = $('#nutrition-template');
        var nutritionIndex = $list.find('.nutrition-item').length;
        
        // Besin değeri ekle
        $('#add-nutrition').on('click', function() {
            var template = $template.html()
                .replace(/{index}/g, nutritionIndex);
            
            $list.append(template);
            nutritionIndex++;
            
            // Yeni eklenen besin değeri için event listener'ları ekle
            $list.find('.nutrition-item:last-child .remove-nutrition').on('click', removeNutrition);
        });
        
        // Besin değeri kaldır
        $list.on('click', '.remove-nutrition', removeNutrition);
        
        function removeNutrition() {
            $(this).closest('.nutrition-item').remove();
        }
        
    }
    
    /**
     * Alerjenler yöneticisi
     */
    function initAllergensManager() {
        
        var $container = $('#menu-allergens-container');
        var $list = $container.find('.allergens-list');
        var $template = $('#allergen-template');
        var allergenIndex = $list.find('.allergen-item').length;
        
        // Alerjen ekle
        $('#add-allergen').on('click', function() {
            var template = $template.html()
                .replace(/{index}/g, allergenIndex);
            
            $list.append(template);
            allergenIndex++;
            
            // Yeni eklenen alerjen için event listener'ları ekle
            $list.find('.allergen-item:last-child .remove-allergen').on('click', removeAllergen);
        });
        
        // Alerjen kaldır
        $list.on('click', '.remove-allergen', removeAllergen);
        
        function removeAllergen() {
            $(this).closest('.allergen-item').remove();
        }
        
    }
    
    /**
     * Katkı maddeleri yöneticisi
     */
    function initAdditivesManager() {
        
        var $container = $('#menu-additives-container');
        var $list = $container.find('.additives-list');
        var $template = $('#additive-template');
        var additiveIndex = $list.find('.additive-item').length;
        
        // Katkı maddesi ekle
        $('#add-additive').on('click', function() {
            var template = $template.html()
                .replace(/{index}/g, additiveIndex);
            
            $list.append(template);
            additiveIndex++;
            
            // Yeni eklenen katkı maddesi için event listener'ları ekle
            $list.find('.additive-item:last-child .remove-additive').on('click', removeAdditive);
        });
        
        // Katkı maddesi kaldır
        $list.on('click', '.remove-additive', removeAdditive);
        
        function removeAdditive() {
            $(this).closest('.additive-item').remove();
        }
        
        }
    
    /**
     * Tab sistemi başlatma
     */
    function initTabSystem() {
        // İlk tab'ı varsayılan olarak aktif yap
        if ($('.tab-button').length > 0 && !$('.tab-button.active').length) {
            $('.tab-button:first').addClass('active');
            $('.happybites-tab-content:first').addClass('active');
        }
        
        // Tab butonlarına tıklama olayı ekle
        $(document).on('click', '.tab-button', function() {
            var tabId = $(this).data('tab');
            
            // Aktif tab'ı değiştir
            $('.tab-button').removeClass('active');
            $(this).addClass('active');
            
            // Tab içeriğini göster/gizle
            $('.happybites-tab-content').removeClass('active');
            $('.happybites-tab-content[data-tab="' + tabId + '"]').addClass('active');
        });
    }
    
    /**
     * Çok dilli dinamik alanlar başlatma
     */
    function initMultilingualFields() {
        // Her dil için dinamik alanları başlat
        $('.happybites-tab-content').each(function() {
            var langCode = $(this).data('tab');
            initLanguageFields(langCode);
        });
    }
    
    /**
     * Belirli bir dil için dinamik alanları başlat
     */
    function initLanguageFields(langCode) {
        // İçindekiler ekleme
        $(document).on('click', '.add-ingredient-' + langCode, function() {
            var $list = $('.ingredients-list-' + langCode);
            var ingredientIndex = $list.find('.ingredient-item').length;
            
            var template = '<div class="ingredient-item">' +
                '<input type="text" name="menu_ingredients_' + langCode + '[' + ingredientIndex + '][name]" placeholder="Ingredient" />' +
                '<input type="text" name="menu_ingredients_' + langCode + '[' + ingredientIndex + '][amount]" placeholder="Amount" />' +
                '<button type="button" class="remove-ingredient button">Remove</button>' +
                '</div>';
            
            $list.append(template);
        });
        
        // İçindekiler kaldırma
        $(document).on('click', '.ingredients-list-' + langCode + ' .remove-ingredient', function() {
            $(this).closest('.ingredient-item').remove();
        });
        
        // Alerjen ekleme
        $(document).on('click', '.add-allergen-' + langCode, function() {
            var $list = $('.allergens-list-' + langCode);
            var allergenIndex = $list.find('.allergen-item').length;
            
            var template = '<div class="allergen-item">' +
                '<input type="text" name="menu_allergens_' + langCode + '[' + allergenIndex + ']" placeholder="Allergen name" />' +
                '<button type="button" class="remove-allergen button">Remove</button>' +
                '</div>';
            
            $list.append(template);
        });
        
        // Alerjen kaldırma
        $(document).on('click', '.allergens-list-' + langCode + ' .remove-allergen', function() {
            $(this).closest('.allergen-item').remove();
        });
    }
    
    /**
     * Kategori kapak görseli (taxonomy ekranı)
     */
    function initCategoryImageField() {
        var $wrap = $('#happybites-category-image-wrap');
        var $parent = $('#parent');

        function toggleMainCategoryImageField() {
            if (!$wrap.length || !$parent.length) {
                return;
            }

            var parentId = $parent.val();
            if (parentId && parentId !== '-1' && parentId !== '0') {
                $wrap.hide();
            } else {
                $wrap.show();
            }
        }

        toggleMainCategoryImageField();
        $parent.on('change', toggleMainCategoryImageField);

        if (typeof wp === 'undefined' || typeof wp.media === 'undefined') {
            return;
        }

        $('#happybites_category_image_upload').on('click', function(e) {
            e.preventDefault();

            var frame = wp.media({
                title: 'Select Category Image',
                button: { text: 'Use Image' },
                multiple: false,
                library: { type: 'image' }
            });

            frame.on('select', function() {
                var selected = frame.state().get('selection').first();
                var imageUrl = selected.get('url');
                var imageId = selected.get('id');

                $('#happybites_category_image_id').val(imageId);
                $('#happybites_category_image_preview')
                    .html('<img src="' + imageUrl + '" alt="" />')
                    .show();
                $('#happybites_category_image_remove').show();
            });

            frame.open();
        });

        $('#happybites_category_image_remove').on('click', function(e) {
            e.preventDefault();

            $('#happybites_category_image_id').val('0');
            $('#happybites_category_image_preview').html('').hide();
            $(this).hide();
        });
    }

    /**
     * Bildirim gösterme
     */
    function showNotification(message, type) {
        var notificationClass = 'notice notice-' + (type === 'success' ? 'success' : 'warning');
        var notification = $('<div class="' + notificationClass + ' is-dismissible"><p>' + message + '</p></div>');
        
        $('.wrap h1').after(notification);
        
        // 3 saniye sonra otomatik kaldır
        setTimeout(function() {
            notification.fadeOut();
        }, 3000);
    }
    
    // Global fonksiyonlar
    window.happybitesPostTypes = {
        showNotification: showNotification
    };
    
})(jQuery); 