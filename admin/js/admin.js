/**
 * HappyBites Admin JavaScript
 *
 * @package HappyBites
 * @since 1.0.0
 */

(function($) {
    'use strict';
    
    $(window).on('load', function() {
        // Admin sayfası yüklendiğinde çalışacak kodlar
        initHappyBitesAdmin();
        
    });
    
    /**
     * Admin başlatma fonksiyonu
     */
    function initHappyBitesAdmin() {
        
        // Ayarlar sayfası kontrolleri
        if ($('.happybites-settings-info').length) {
            initSettingsPage();
        }
        
        // Ana admin sayfası kontrolleri
        if ($('.happybites-admin-container').length) {
            initMainAdminPage();
        }
        
        // Tab sistemi başlat
        initTabSystem();
        
        // Renk seçici başlat
        initColorPickers();
        
        // Sosyal medya alanları başlat
        initSocialMediaFields();
        
        // Çalışma saatleri başlat
        initWorkingHours();
        
        // Media Library başlat
        initMediaLibrary();

        // Sıralama sayfası başlat
        // Not: sort-page.php kendi JS'ini içeriyor. Çakışmayı önlemek için burada ekstra init çağırmıyoruz.
        // if ($('#menu-sort-container').length) {
        //     console.log('Sıralama sayfası tespit edildi');
        //     initSortPage();
        // }
        
    }
    
    /**
     * Ayarlar sayfası başlatma
     */
    function initSettingsPage() {
 
    }
    
    /**
     * Ana admin sayfası başlatma
     */
    function initMainAdminPage() {
        
        // Kart tıklama olayları
        $('.happybites-admin-card').on('click', function() {
            var cardType = $(this).find('h3').text();
        });
        
        // Hızlı işlem butonları
        $('.happybites-admin-card .button').on('click', function(e) {
            var buttonText = $(this).text();
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
    
    /**
     * Tab sistemi başlatma
     */
    function initTabSystem() {
        // Tab butonlarına tıklama olayı
        $(document).on('click', '.tab-button', function() {
            var tabId = $(this).data('tab');
            var tabContainer = $(this).closest('.happybites-tabs');
            
            // Aktif tab butonunu değiştir
            tabContainer.find('.tab-button').removeClass('active');
            $(this).addClass('active');
            
            // Aktif tab içeriğini değiştir (doğru sınıf: .happybites-tab-content)
            tabContainer.find('.happybites-tab-content').removeClass('active');
            tabContainer.find('.happybites-tab-content[data-tab="' + tabId + '"]').addClass('active');
        });
        
    }
    
    /**
     * AJAX işlemleri
     */
    function performAjaxAction(action, data) {
        return $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'happybites_' + action,
                nonce: happybites_ajax.nonce,
                data: data
            },
            success: function(response) {
                if (response.success) {
                    showNotification(response.data.message, 'success');
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                showNotification('An error occurred!', 'error');
            }
        });
    }
    
    /**
     * Renk seçici başlatma
     */
    function initColorPickers() {
        // Renk seçici alanlarını bul ve gerekli ayarları yap
        $('.color-picker').each(function() {
            var $picker = $(this);
            
            // Renk değiştiğinde herhangi bir ek işlem yapmaya gerek yok
            // WordPress'in kendi color picker'ı zaten preview gösteriyor
        });
    }
    
    /**
     * Sosyal medya alanları başlatma
     */
    function initSocialMediaFields() {
        // Sosyal medya alanlarına URL doğrulama ekle
        $('.social-media-field').each(function() {
            var $field = $(this);
            var $input = $field.find('input[type="url"]');
            
            // URL doğrulama
            $input.on('blur', function() {
                var url = $(this).val();
                if (url && !isValidUrl(url)) {
                    $(this).css('border-color', '#dc3232');
                    showNotification('Invalid URL format!', 'error');
                } else {
                    $(this).css('border-color', '#ddd');
                }
            });
        });
    }
    
    /**
     * URL doğrulama
     */
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    /**
     * Çalışma saatleri başlatma
     */
    function initWorkingHours() {
        // Her gün için checkbox değişikliklerini dinle
        $('.working-day-row input[type="checkbox"]').on('change', function() {
            var $row = $(this).closest('.working-day-row');
            var isChecked = $(this).is(':checked');
            
            if (isChecked) {
                $row.removeClass('closed');
                $row.find('.time-selectors select').prop('disabled', false);
            } else {
                $row.addClass('closed');
                $row.find('.time-selectors select').prop('disabled', true);
            }
        });
        
        // Sayfa yüklendiğinde mevcut durumu ayarla
        $('.working-day-row input[type="checkbox"]').each(function() {
            var $row = $(this).closest('.working-day-row');
            var isChecked = $(this).is(':checked');
            
            if (!isChecked) {
                $row.addClass('closed');
                $row.find('.time-selectors select').prop('disabled', true);
            }
        });
        
        // Saat seçimi değişikliklerini dinle
        $('.time-selectors select').on('change', function() {
            var $row = $(this).closest('.working-day-row');
            var openTime = $row.find('select[name*="[open_time]"]').val();
            var closeTime = $row.find('select[name*="[close_time]"]').val();
            
            // Açılış saati kapanış saatinden sonra olamaz
            if (openTime >= closeTime) {
                showNotification('Opening time must be before closing time!', 'warning');
                $(this).val(openTime === closeTime ? '09:00' : '18:00');
            }
        });
    }
    
    /**
     * Çalışma saatleri format doğrulama
     */
    function isValidWorkingHours(hours) {
        // Basit format kontrolü
        var lines = hours.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line && !line.match(/^[A-Za-zğüşıöçĞÜŞİÖÇ\s]+:\s*[\d:]+\s*-\s*[\d:]+$/)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Media Library başlatma
     */
    function initMediaLibrary() {
        
        // wp.media'nın mevcut olup olmadığını kontrol et
        if (typeof wp === 'undefined' || typeof wp.media === 'undefined') {
            console.error('wp.media not found!');
            return;
        }
        
        
        // Logo yükleme butonu
        $('#upload_logo_button').on('click', function(e) {
            e.preventDefault();
            
            var image = wp.media({
                title: 'Select Logo',
                button: {
                    text: 'Select Logo'
                },
                multiple: false
            }).open();
            
            image.on('select', function() {
                var selectedImage = image.state().get('selection').first();
                var imageUrl = selectedImage.get('url');
                var imageId = selectedImage.get('id');
                
                $('#logo_url').val(imageUrl);
                $('#logo_id').val(imageId);
                $('#logo_preview').html('<img src="' + imageUrl + '" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd; border-radius: 4px;" />').show();
                $('#remove_logo_button').show();
            });
        });
        
        // Logo kaldırma butonu
        $('#remove_logo_button').on('click', function(e) {
            e.preventDefault();
            
            $('#logo_url').val('');
            $('#logo_id').val('');
            $('#logo_preview').html('').hide();
            $('#remove_logo_button').hide();
        });

        // Header Background Image yükleme butonu
        $('#upload_header_bg_button').on('click', function(e) {
            e.preventDefault();

            var image = wp.media({
                title: 'Select Header Background Image',
                button: { text: 'Select Image' },
                multiple: false
            }).open();

            image.on('select', function() {
                var selectedImage = image.state().get('selection').first();
                var imageUrl = selectedImage.get('url');
                var imageId = selectedImage.get('id');

                $('#header_bg_url').val(imageUrl);
                $('#header_bg_id').val(imageId);
                $('#header_bg_preview').html('<img src="' + imageUrl + '" style="max-width: 400px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px; object-fit: cover;" />').show();
                $('#remove_header_bg_button').show();
            });
        });

        // Header Background Image kaldırma butonu
        $('#remove_header_bg_button').on('click', function(e) {
            e.preventDefault();
            console.log('Remove Header Background button clicked');

            $('#header_bg_url').val('');
            $('#header_bg_id').val('');
            $('#header_bg_preview').html('').hide();
            $('#remove_header_bg_button').hide();
        });
        
    }
    
    /**
     * Sıralama sayfası başlatma
     */
    function initSortPage() {
        
        // jQuery UI Sortable'ı yükle
        if (typeof $.fn.sortable === 'undefined') {
            return;
        }

        initSortable();
        
        // Kategori toggle butonları
        $('.toggle-products').on('click', function() {
            var container = $(this).closest('.category-item').find('.products-container');
            container.slideToggle();
        });
        
        // Tümünü aç/kapat butonları
        $('#expand-all').on('click', function() {
            $('.products-container').slideDown();
        });
        
        $('#collapse-all').on('click', function() {
            $('.products-container').slideUp();
        });
        
        // Sıralamayı kaydet butonu
        $('#save-order').on('click', function() {
            saveOrder();
        });
        
    }
    
    /**
     * Sortable başlatma
     */
    function initSortable() {
        // Kategoriler için sortable
        $('#menu-sort-container').sortable({
            handle: '.drag-handle',
            placeholder: 'ui-sortable-placeholder',
            update: function(event, ui) {
                updateCategoryOrder();
            }
        });
        
        // Ürünler için sortable
        $('.products-container').sortable({
            handle: '.drag-handle',
            placeholder: 'ui-sortable-placeholder',
            connectWith: '.products-container',
            update: function(event, ui) {
                updateProductOrder();
            }
        });
        
    }
    
    /**
     * Kategori sırasını güncelle
     */
    function updateCategoryOrder() {
        var categories = [];
        $('#menu-sort-container .category-item').each(function(index) {
            var categoryId = $(this).data('category-id');
            categories.push({
                id: categoryId,
                order: index
            });
        });
        
        // AJAX ile kategori sırasını güncelle
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'happybites_update_category_order',
                categories: categories,
                nonce: happybites_sort_nonce
            },
            success: function(response) {
            },
            error: function(xhr, status, error) {
                console.error('Error while updating category order:', error);
            }
        });
    }
    
    /**
     * Ürün sırasını güncelle
     */
    function updateProductOrder() {
        $('.products-container').each(function() {
            var categoryId = $(this).closest('.category-item').data('category-id');
            var products = [];
            
            $(this).find('.product-item').each(function(index) {
                var productId = $(this).data('product-id');
                products.push({
                    id: productId,
                    order: index,
                    category_id: categoryId
                });
            });
            
            // AJAX ile ürün sırasını güncelle
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'happybites_update_product_order',
                    products: products,
                    nonce: happybites_sort_nonce
                },
                success: function(response) {
                },
                error: function(xhr, status, error) {
                    console.error('Error while updating product order:', error);
                }
            });
        });
    }
    
    /**
     * Sıralamayı kaydet
     */
    function saveOrder() {
        var button = $('#save-order');
        button.prop('disabled', true).text('Saving...');
        
        updateCategoryOrder();
        updateProductOrder();
        
        setTimeout(function() {
            button.prop('disabled', false).text('Save Ordering');
            showMessage('Ordering saved successfully!', 'success');
        }, 1000);
    }
    
    /**
     * Mesaj gösterme
     */
    function showMessage(message, type) {
        var messageDiv = $('<div class="' + type + '-message">' + message + '</div>');
        $('.happybites-sort-container').prepend(messageDiv);
        messageDiv.fadeIn();
        
        setTimeout(function() {
            messageDiv.fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }
    
    // Global fonksiyonlar
    window.happybitesAdmin = {
        showNotification: showNotification,
        performAjaxAction: performAjaxAction,
        initColorPickers: initColorPickers,
        initSocialMediaFields: initSocialMediaFields,
        initWorkingHours: initWorkingHours,
        initMediaLibrary: initMediaLibrary,
        isValidUrl: isValidUrl,
        isValidWorkingHours: isValidWorkingHours,
        initSortPage: initSortPage
    };
    
})(jQuery); 