/**
 * @Author: arunkri
 * @Date:   2020-02-05T20:51:54-08:00
 * @Last modified by:   arunkri
 * @Last modified time: 2020-11-14T20:14:50-08:00
 */
 (function( $ ) {
    $.fn.jSplitter = function(opts) {
        const body = $('body');

        const defaultSettings    = {
            leftdiv         : null,
            rightdiv        : null,
            cookie          : 'jsplitter',
            flex            : false,
            minleftwidth    : 0,
            maxleftwidth    : 20000,
            persist         : false
        };
        window.jsplitterSettings = $.extend({}, defaultSettings, opts);
        const settings = window.jsplitterSettings;

        /*******************************************************
         Loop through all matching elements and initialise
         splitter on them
        ********************************************************/
        return this.each(function(index) {
            const divider = this;
            const leftdiv = $('#'+ settings.leftdiv);
            const rightdiv = $('#'+ settings.rightdiv);

            settings.cookie = settings.cookie + '_' + $(divider).attr('id');

            const dividerwidth = $(divider).width();

            let disableLeftUserSel = true;
            let disableRightUserSel = true;
            if ($(leftdiv).css('user-select') == 'none' ||
                $(leftdiv).css('-webkit-user-select') == 'none') {
                disableLeftUserSel = false;
            }
            if ($(rightdiv).css('user-select') == 'none' ||
                $(rightdiv).css('-webkit-user-select') == 'none') {
                disableRightUserSel = false;
            }

            $(divider).css('cursor', 'col-resize');

            const initWidths = function() {
                if (! $(divider).is(":visible")){
                    $(rightdiv).css('margin-left', '0px');
                    return;
                } else {
                    if (settings.persist && localStorage.getItem(settings.cookie) != null) {
                        const width = parseInt(localStorage.getItem(settings.cookie));
                        if (settings.flex) {
                            $(leftdiv).css('flex', '0 0 '+width+'px');
                        } else {
                            $(leftdiv).width(width);
                            $(divider).css('margin-left', width + "px");
                            $(rightdiv).css('margin-left', width+dividerwidth + "px");
                        }

                    } else {
                        if (! settings.flex) {
                            const width = $(leftdiv).width();
                            $(divider).css('margin-left', width + "px");
                            $(rightdiv).css('margin-left', width+dividerwidth + "px");
                        }
                    }
                }
            };
            initWidths();

            let currentWidth = $(leftdiv).width();
            const maxWidth = $(leftdiv).css('max-width');
            const minWidth = $(leftdiv).css('min-width');
            let startPos = 0;

            const startSplitMouse = function(evt) {
                $(document).bind("mousemove touchmove", doSplitMouse)
                           .bind("mouseup touchend", endSplitMouse);

                // Disable selection if needed. If not, text will get selected
                // when mouse is dragged.
                if (disableLeftUserSel) {
                    $(leftdiv).css('user-select', 'none');
                    $(leftdiv).css('-webkit-user-select', 'none');
                }
                if (disableRightUserSel) {
                    $(rightdiv).css('user-select', 'none');
                    $(rightdiv).css('-webkit-user-select', 'none');
                }

                startPos = evt.pageX;
            };
            function doSplitMouse(evt) {
                const pos = evt.pageX;
                const diff = pos - startPos;

                const newWidth = currentWidth + diff;
                if (newWidth > settings.maxleftwidth ||
                    newWidth < settings.minleftwidth) {
                    return;
                }
                const splitterMargin = newWidth;
                const rightdivMargin = newWidth + dividerwidth;

                if (settings.flex) {
                    $(leftdiv).css('flex', '0 0 '+newWidth+'px');
                } else {
                    $(leftdiv).css('width', newWidth + "px");
                    $(divider).css('margin-left', splitterMargin + "px");
                    $(rightdiv).css('margin-left', rightdivMargin + "px");
                }
                window.driver.Refresh();
            }
            function endSplitMouse(evt) {
                currentWidth = $(leftdiv).width();
                startPos = 0;

                if (settings.persist) {
                    localStorage.setItem(settings.cookie, currentWidth);
                }

                // Enable selection if needed.
                if (disableLeftUserSel) {
                    $(leftdiv).css('user-select', '');
                    $(leftdiv).css('-webkit-user-select', '');
                }
                if (disableRightUserSel) {
                    $(rightdiv).css('user-select', '');
                    $(rightdiv).css('-webkit-user-select', '');
                }

                // Unbind mouse events.
                $(document)
                .unbind("mousemove touchmove", doSplitMouse)
                .unbind("mouseup touchend", endSplitMouse);
            }

            $(divider).bind("mousedown touchstart", startSplitMouse);

            // If window is resized, re-initialize widths. If
            $( window ).resize(function() {
                initWidths();
            });
        });
    };
}( jQuery ));
