/* The MIT License

Copyright (c) 2011 Vastardis Capital Services, http://www.vastcap.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function($, undefined) {
    var Button = function() {
        this._textElement = null;

        this._text = this._options.text;
        this._tooltip = this._options.tooltip;
        this._enabled = this._options.enabled;

        this._baseCssClass = this._cssClassOverrides;
        this._tracking = false;
        this._active = false;

        this._bindEventsInitial$proxy = $.proxy(this._bindEventsInitial, this);

        this.onMouseDown$proxy = $.proxy(this.onMouseDown, this);
        this.onMouseUp$proxy = $.proxy(this.onMouseUp, this);
        this.onDocumentMouseUp$proxy = $.proxy(this.onDocumentMouseUp, this);
        this.onMouseOut$proxy = $.proxy(this.onMouseOut, this);
        this.onMouseOver$proxy = $.proxy(this.onMouseOver, this);

        this.onFocus$proxy = $.proxy(this.onFocus, this);
        this.onBlur$proxy = $.proxy(this.onBlur, this);
        this.onKeyDown$proxy = $.proxy(this.onKeyDown, this);
        this.onKeyUp$proxy = $.proxy(this.onKeyUp, this);
    }
    Button.defaultOptions = {
        text: ''
		, tooltip: null
		, tabIndex: 0
		, enabled: true
		, disabledCssClass: 'c_buttonDisabled'
		, trackingCssClass: 'c_buttonHover'
		, activeCssClass: 'c_buttonTracking'
    };
    Button.prototype = $.extend(new base.constructor(), {
        constructElement: function() {
            base.constructElement.apply(this, arguments);

            this._textElement = this.element().find('span');

            this.enabled(this._enabled);
        }
		, templateData: function() {
		    return {
		        tooltip: this._tooltip
		        , text: this._text
		    };
		}
		, cssClassPrefix: function() {
		    return 'c_button';
		}
		, cssClass: function(/*cssClass*/) {
		    if (arguments.length === 0) {
		        return this._baseCssClass;
		    } else {
		        this._baseCssClass = arguments[0];

		        var classes = [this._baseCssClass];
		        if (this.enabled()) {
		            if (this._active && this._tracking) {
		                classes.push(this._options.activeCssClass);
		            } else if (this._active || this._tracking || this._hasFocus) {
		                classes.push(this._options.trackingCssClass);
		            }
		        } else {
		            classes.push(this._options.disabledCssClass);
		        }

		        this._cssClassOverrides = classes.join(' ');
		        base._updateCssClass.call(this);
		    }
		}
		, bindEvents: function() {
		    this.element()
				.one('mouseover', this._bindEventsInitial$proxy)
				.focus(this.onFocus$proxy)
				.blur(this.onBlur$proxy)
				.keydown(this.onKeyDown$proxy)
				.keyup(this.onKeyUp$proxy)
		}
		, _bindEventsInitial: function() {
		    this.onMouseOver.apply(this, arguments);
		    this.element()
				.mouseover(this.onMouseOver$proxy)
				.mousedown(this.onMouseDown$proxy)
				.mouseup(this.onMouseUp$proxy)
				.mouseout(this.onMouseOut$proxy)
				.bind('selectstart', function(e) { e.preventDefault(); }); // disable text selection in IE
		}
		, _updateCssClass: function() {
		    this.cssClass(this.cssClass());
		    base._updateCssClass.apply(this, arguments);
		}
		, text: function(/*text*/) {
		    if (arguments.length === 0) {
		        return this._text;
		    } else {
		        this._text = arguments[0];
		        this._textElement.text(this._text);
		    }
		}
		, tooltip: function(/*tooltip*/) {
		    if (arguments.length === 0) {
		        return this._tooltip;
		    } else {
		        this._tooltip = arguments[0];
		        if (this._tooltip && this._tooltip !== '') {
		            this.element().attr('title', this._tooltip);
		        } else {
		            this.element().removeAttr('title');
		        }
		    }
		}
        , enabled: function(/*enable*/) {
            if (arguments.length === 0) {
                return this._enabled;
            } else {
                this._enabled = arguments[0];
                this._updateCssClass();
            }
        }
        // BEGIN event handlers
		, onMouseOver: function(e) {
		    if (this.enabled()) {
		        this._tracking = true;
		        this._updateCssClass();
		    }
		    e.stopPropagation();
		}
		, onMouseOut: function(e) {
		    if (this.enabled()) {
		        this._tracking = false;
		        this._updateCssClass();
		    }
		    e.stopPropagation();
		}
		, onMouseDown: function(e) {
		    if ((e.which - 1) !== Sys.UI.MouseButton.leftButton) { return; }

		    if (this.enabled()) {
		        this._active = true;
		        this._updateCssClass();
		        $(document).mouseup(this.onDocumentMouseUp$proxy);
		    }
		    e.stopPropagation();
		}
		, onMouseUp: function(e) {
		    if ((e.which - 1) !== Sys.UI.MouseButton.leftButton) { return; }
		    if (this.enabled() && this._active) {
		        this._active = false;
		        this._updateCssClass();
		        $(document).unbind('mouseup', this.onDocumentMouseUp$proxy);

		        this.trigger_click();
		    }
		    e.stopPropagation();
		}
		, onDocumentMouseUp: function() {
		    if (this.enabled() && this._active) {
		        this._active = false;
		        this._updateCssClass();
		        $(document).unbind('mouseup', this.onDocumentMouseUp$proxy);
		    }
		}

		, onFocus: function(e) {
		    if (this.enabled()) {
		        this._hasFocus = true;
		        this._updateCssClass();
		    }
		}
		, onBlur: function(e) {
		    if (this.enabled()) {
		        this._hasFocus = false;
		        this._updateCssClass();
		    }
		}
		, onKeyDown: function(e) {
		    if (this.enabled()) {
		        switch (e.which) {
		            case Sys.UI.Key.enter:
		                this.trigger_click();

		                e.preventDefault();
		                e.stopPropagation();

		                break;
		            case Sys.UI.Key.space:
		                this._active = true;
		                this._updateCssClass();

		                e.preventDefault();
		                e.stopPropagation();

		                break;
		        }
		    }
		}
		, onKeyUp: function(e) {
		    if (this.enabled()) {
		        switch (e.which) {
		            case Sys.UI.Key.space:
		                this._active = false;
		                this._updateCssClass();

		                this.trigger_click();

		                e.preventDefault();
		                e.stopPropagation();

		                break;
		        }
		    }
		}
        // END event handlers

        , trigger_click: function() {
            $(this).trigger('click');
        }
    });

    window.getComponentType = function() {
        return Button;
    }
})(jQuery);