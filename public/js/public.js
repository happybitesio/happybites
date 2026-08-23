/**
 * HappyBites Public JavaScript
 *
 * @package HappyBites
 * @since 1.0.0
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        
        // Public sayfası yüklendiğinde çalışacak kodlar
        initHappyBitesPublic();
        
    });
    
    /**
     * Public başlatma fonksiyonu
     */
    function initHappyBitesPublic() {
        
        // HappyBites container'larını bul ve başlat
        $('.happybites-container').each(function() {
            initHappyBitesContainer($(this));
        });
        
        // Content footer'ı ekle
        addContentFooter();
        
    }
    
    /**
     * HappyBites container başlatma
     */
    function initHappyBitesContainer($container) {
        
        var type = $container.data('type') || 'default';
        var id = $container.attr('id') || '';
        
        // Container'a özel işlemler
        switch(type) {
            case 'advanced':
                initAdvancedContainer($container);
                break;
            default:
                initDefaultContainer($container);
                break;
        }
        
        // Genel event listener'lar
        $container.on('click', '.happybites-button', function(e) {
            e.preventDefault();
            handleButtonClick($(this), $container);
        });
        
        // Hover efektleri
        $container.hover(
            function() {
                $(this).addClass('happybites-hover');
            },
            function() {
                $(this).removeClass('happybites-hover');
            }
        );
        
    }
    
    /**
     * Gelişmiş container başlatma
     */
    function initAdvancedContainer($container) {
        
        // Gelişmiş özellikler
        $container.addClass('happybites-advanced-type');
        
        // AJAX buton işlemleri
        $container.find('.happybites-button').on('click', function() {
            performAdvancedAction($container);
        });
        
    }
    
    /**
     * Varsayılan container başlatma
     */
    function initDefaultContainer($container) {
        
        // Basit özellikler
        $container.addClass('happybites-default-type');
        
    }
    
    /**
     * Buton tıklama işlemi
     */
    function handleButtonClick($button, $container) {
        
        var buttonText = $button.text();
        var containerType = $container.data('type');
        
        // Loading durumu
        $container.addClass('happybites-loading');
        $button.prop('disabled', true);
        
        // AJAX isteği
        $.ajax({
            url: happybites_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'happybites_button_action',
                nonce: happybites_ajax.nonce,
                button_text: buttonText,
                container_type: containerType
            },
            success: function(response) {
                if (response.success) {
                    showNotification(response.data.message, 'success');
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                showNotification('Bir hata oluştu!', 'error');
            },
            complete: function() {
                // Loading durumunu kaldır
                $container.removeClass('happybites-loading');
                $button.prop('disabled', false);
            }
        });
        
    }
    
    /**
     * Gelişmiş aksiyon
     */
    function performAdvancedAction($container) {
        
        // Gelişmiş özellik animasyonu
        $container.find('.happybites-advanced').slideToggle(300);
        
        // AJAX isteği
        $.ajax({
            url: happybites_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'happybites_advanced_action',
                nonce: happybites_ajax.nonce
            },
            success: function(response) {
                if (response.success) {
                    $container.find('.happybites-content').html(response.data.content);
                }
            }
        });
        
    }
    
    /**
     * Content footer ekleme
     */
    function addContentFooter() {
        
        // Sadece single post/page'larda ekle
        if ($('body').hasClass('single-post') || $('body').hasClass('single-page')) {
            
            // Footer zaten var mı kontrol et
            if ($('.happybites-content-footer').length === 0) {
                var footer = $('<div class="happybites-content-footer">' +
                              '<small>HappyBites tarafından güçlendirildi</small>' +
                              '</div>');
                
                $('.entry-content').append(footer);
            }
            
        }
        
    }
    
    /**
     * Bildirim gösterme
     */
    function showNotification(message, type) {
        
        var notificationClass = 'happybites-notification happybites-' + type;
        var notification = $('<div class="' + notificationClass + '">' + message + '</div>');
        
        // Body'ye ekle
        $('body').append(notification);
        
        // Animasyon
        notification.fadeIn(300);
        
        // 3 saniye sonra kaldır
        setTimeout(function() {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
        
    }
    
    /**
     * Global fonksiyon
     */
    window.happybitesAction = function() {
        var $container = $(this).closest('.happybites-container');
        handleButtonClick($(this), $container);
    };
    
    // Global fonksiyonlar
    window.happybitesPublic = {
        showNotification: showNotification,
        initContainer: initHappyBitesContainer
    };
    
})(jQuery); 