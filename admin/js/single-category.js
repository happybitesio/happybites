/**
 * Limit classic editor category checkboxes to a single selection.
 *
 * @package HappyBites
 */
(function ($) {
    'use strict';

    function enforceSingleCategorySelection() {
        var selector = 'input[name="tax_input[happybites_menu_category][]"]';

        $(document).off('change.singleCategory').on('change.singleCategory', selector, function () {
            var $clicked = $(this);
            $(selector).not($clicked).prop('checked', false);
            $clicked.prop('checked', true);
        });
    }

    $(function () {
        enforceSingleCategorySelection();

        $('#category-tabs a').on('click', function () {
            window.setTimeout(enforceSingleCategorySelection, 200);
        });

        var tabsEl = document.getElementById('category-tabs');
        if (tabsEl && typeof MutationObserver === 'function') {
            var observer = new MutationObserver(enforceSingleCategorySelection);
            observer.observe(tabsEl, {
                childList: true,
                subtree: true
            });
        }
    });
})(jQuery);
