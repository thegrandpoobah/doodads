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
    var RadioButton = function() {
        this._text = this._options.text;
        this._checked = this._options.checked;
        this._enabled = true;
        this._group = this._options.group;

        this.onClick$proxy = $.proxy(this.onClick, this);
    }
    RadioButton.defaultOptions = {
        text: ''
		, enabled: true
        , checked: false
        , group: ''
    };
    RadioButton.prototype = $.extend(new base.constructor(), {
        constructElement: function() {
            base.constructElement.apply(this, arguments);

            this._label = this.element().find('label');
            this._input = this.element().find('#radiobutton');
            this.enabled(this._options.enabled);
        }
        , templateData: function() {
            return { text: this._text, checked: this._checked, group: this._group };
        }
        , _setDomId: function() {
            base._setDomId.apply(this, arguments);

            var computedId = String.format('{0}_radiobutton', this.computedId());

            this._input.attr('id', computedId);
            this._label.attr('for', computedId);

            var parent = this.parent();
            while (parent && parent.computedId() === '') {
                parent = parent.parent();
            }

            if (parent) {
                // mangle the group just in case
                this._input.attr('name', $.proxy(function(index, name) { return String.format('{0}_{1}', parent.computedId(), this._group); }, this));
            } else {
                // if the ancestory did not provide a "naming container", then just set the unmangled group option
                this._input.attr('name', this._group);
            }
        }
        , cssClassPrefix: function() {
            return 'c_radioButton';
        }
		, bindEvents: function() {
		    this._input.bind('click', this.onClick$proxy);
		}
        , checked: function(/*checked*/) {
            if (arguments.length === 0) return this._input[0].checked;
            else {
                this._checked = arguments[0];

                this.ensureElement();
                this._input[0].checked = this._checked;
            }
        }
		, text: function(/*text*/) {
		    if (arguments.length === 0) return this._text;
		    else {
		        this._text = arguments[0];

		        this.ensureElement();
		        this._label.text(this._text);
		    }
		}
		, enabled: function(/*enable*/) {
		    if (arguments.length === 0) return this._enabled;
		    else {
		        this._enabled = arguments[0];
		        this.ensureElement();
		        this._input.enable(this._enabled);
		    }
		}
		, onClick: function(eventArgs) {
		    this._checked = this._input[0].checked;
		    $(this).trigger('click', this._checked);

		    eventArgs.stopPropagation();
		}
    });

    window.getComponentType = function() {
        return RadioButton;
    }
})(jQuery);