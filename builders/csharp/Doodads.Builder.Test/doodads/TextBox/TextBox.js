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
(function () {
    var defaultRequiredRule = function () {
        this.validate = function (content) {
            return {
                valid: content.trim().length > 0
				, message: ''
            }
        }
    };

    doodads.setup()
        .constructor(function () {
	        this.onTextAreaKeyDown$proxy = doodads.proxy(this.onTextAreaKeyDown, this);
	        this.onKeyUp$debounced = $.debounce(this.onKeyUp, 10, this);
	        this.onFocus$proxy = doodads.proxy(this.onFocus, this);
	        this.onBlur$proxy = doodads.proxy(this.onBlur, this);
	        this.onRequiredChanged$proxy = doodads.proxy(this.onRequiredChanged, this);

	        this._text = '';

	        this._focused = false;
	        this._enabled = true;

	        this._watermarkOn = false;
	        this._watermarkingEnabled = true;
	    })
	    .defaultOptions({
	        text: '',
			watermark: '',
			maxlength: -1,
			showStar: false,
			multiline: false,
			password: false,
			enabled: true,
			rows: 4,
			cols: 40
	    })
		.proto({
	        onReady: function () {
	            this.base.onReady.apply(this, arguments);

	            if (this._options.required && this._options.validates) {
	                this.required(true, new defaultRequiredRule());
	            }
	        },
	        constructElement: function () {
	            this.base.constructElement.apply(this, arguments);

	            this._input = this._source.find('input, textarea');

	            if (this._options.validates && this._options.maxlength !== -1) {
	                var self = this;
	                this.addRule(new function () {
	                    this.validate = function (context) {
	                        return {
	                            valid: context.toString().length <= self._options.maxlength
					            , message: String.format('Character count {0} of {1}', context.length, self._options.maxlength)
					            , alwaysShow: true
	                        };
	                    };
	                });
	            }

	            if (this._options.showStar) {
	                this._star = this._source.find('span.star');
	            }

	        },
	        cssClassPrefix: function () {
	            return 'textbox';
	        },
	        bindEvents: function () {
	            this._input
					.bind('keyup', this.onKeyUp$debounced)
					.bind('focus.cmp', this.onFocus$proxy)
					.bind('blur.cmp', this.onBlur$proxy);

	            if (this._options.multiline) {
	                this._input.bind('keydown', this.onTextAreaKeyDown$proxy);
	            }

	            this.bind('required', this.onRequiredChanged$proxy);
	        },
	        render: function () {
			    this.base.render.apply(this, arguments);

			    if (this._options.text.trim() !== '') {
			        this.text(this._options.text);
			    } else if (this._options.watermark.trim() !== '') {
			        this._addWatermark();
			    }

			    this.enabled(this._options.enabled);
			},
			watermarkingEnabled: function () {
			    if (arguments.length === 0) {
			        return this._watermarkingEnabled;
			    } else {
			        // in combination, resets the watermark if necessary
			        this._removeWatermark();
			        this._watermarkingEnabled = arguments[0];
			        this._addWatermark();
			    }
			},
			_addWatermark: function () {
			    if (this.watermarkingEnabled() && !this._watermarkOn && this._input.val().length === 0) {
			        this._input.addClass('watermarked');
			        this._input.val(this._options.watermark);
			        this._watermarkOn = true;
			    }
			},
			_removeWatermark: function () {
			    if (this.watermarkingEnabled() && this._watermarkOn) {
			        this._input.val('');
			        this._watermarkOn = false;
			    }
			    this._input.removeClass('watermarked');
			},
			_setCaretPosition: function (pos) {
	            var ctrl = this._input[0]; // need the actual DOM element (not jQuery)

	            if (ctrl.setSelectionRange) {
	                ctrl.focus();
	                ctrl.setSelectionRange(pos, pos);
	            } else if (ctrl.createTextRange) {
	                var range = ctrl.createTextRange();
	                range.collapse(true);
	                range.moveEnd('character', pos);
	                range.moveStart('character', pos);
	                range.select();
	            }
	        },
	        templateData: function () {
			    var obj = { showStar: this._options.showStar };

			    if (this._options.multiline) {
			        return $.extend(obj, { isMultiLine: true, rows: this._options.rows, cols: this._options.cols });
			    } else {

			        obj = $.extend(obj, {
			            maxlength: this._options.maxlength,
			            hasMaxlength: this._options.maxlength !== -1
			        });

			        if (this._options.password) {
			            return $.extend(obj, { isPassword: true });
			        } else {
			            return $.extend(obj, { isText: true });
			        }
			    }

			},
			validationContext: function () {
			    return this.text();
			},
			validationTarget: function () {
			    return this._input;
			},
			text: function (/*value, triggerEvents*/) {
			    ///	<summary>
			    ///		1: text() - returns the text.
			    ///		2: text(value) - Sets the text to value.
			    ///		3: text(value, triggerEvents) - Set the text to value; if "triggerEvents" is true, triggers the change and changing events.
			    ///	</summary>
			    /// <param name="value" type="String" optional="true" />
			    /// <param name="triggerEvents" type="Boolean" optional="true">
			    ///		If true, trigger the change and the changing events.
			    ///	</param>
			    /// <returns type="String" />

			    if (arguments.length === 0) {
			        return this._watermarkOn ? '' : this._input.val();
			    } else if (arguments[0] !== this._text) {
			        // in tandem with _addWatermark below, ensures that the
			        // watermark properties are in a consistent state
			        this._removeWatermark();

			        if (arguments[1]) {
			            this.trigger('changing');
			        }

			        this._text = arguments[0];
			        if (this._input.val() !== this._text) {
			            this._input.val(this._text);
			            if (this.hasInputFocus()) {
			                // the edge case where the user is focussed and the text changes on a timeout/debounce
			                // can potentially cause the input field's caret to become invisible. set the caret
			                // to the end of the string to bring it back into view.
			                this._setCaretPosition(this._text.length);
			            }
			        }
			        this.validate();

			        // there is a chance that the incoming value is the blank string
			        // at which point, the watermark should be displayed (if applicable)
			        if (!this.hasInputFocus()) {
			            this._addWatermark();
			        }

			        if (arguments[1]) {
			            this.trigger('changed');
			        }
			    }
			},
			focus: function () {
			    this._input.focus();
			},
			hasInputFocus: function () {
	            return this._focused;
	        },
	        /* BEGIN Enable/Disable management */
			enabled: function (/*value*/) {
			    ///	<summary>
			    ///		1: enabled() - Indicates whether the component is enabled.
			    ///		2: enabled(true) - Enable the component.
			    ///		3: enabled(false) - Disable the component.
			    ///	</summary>
			    /// <param name="value" type="Boolean" optional="true"/>

			    if (arguments.length === 0) {
			        return this._enabled;
			    } else {

			        var isEnabled = arguments[0];

			        // No point in re-doing logic if the enabled state hasn't changed
			        if ((this._enabled && !isEnabled) || (!this._enabled && isEnabled)) {
			            if (isEnabled) {
			                this._input.removeAttr('disabled');
			            } else {
			                this._input.attr('disabled', true);
			            }
			            this._enabled = isEnabled;
			        }
			    }
			},
			disabled: function (/*value*/) {
			    ///	<summary>
			    ///		1: disabled() - Indicates whether the component is disabled.
			    ///		2: disabled(true) - Disable the component.
			    ///		3: disabled(false) - Enable the component.
			    ///	</summary>
			    /// <param name="value" type="Boolaean" optional="true" />

			    if (arguments.length === 0) {
			        return !this.enabled();
			    } else {
			        this.enabled(!arguments[0]);
			    }

			},
	        
	        /* BEGIN Event handling */
			onRequiredChanged: function (/*e*/) {
			    if (this._options.showStar) {
			        this._star[this.required() ? 'show' : 'hide']();
			    }
			},
			onKeyUp: function (e) {
	            var val;
	            if (this._watermarkOn) {
	                val = '';
	            } else {
	                val = this._input.val();
	            }
	            this.text(val, true);
	        }, 
	        onFocus: function (e) {
			    this._focused = true;
			    this._removeWatermark();
			    
			    // BEGIN: WORKAROUND for bug 524360 in FireFox
			    // see https://bugzilla.mozilla.org/show_bug.cgi?id=524360 for more details
			    // (ideally this whole section would just be $(this).trigger('focus');
			    this._input.unbind('focus.cmp blur.cmp').blur();

			    var self = this;
			    window.setTimeout(function () {
			        self.trigger('focus');
					
			        self._input.focus()
	                    .bind('focus.cmp', self.onFocus$proxy)
	                    .bind('blur.cmp', self.onBlur$proxy);
			    }, 0);
			    // END: WORKAROUND for bug 524360
			},
			onBlur: function (e) {
	            this._addWatermark();
	            this.trigger('blur');
	            this._focused = false;
	        },
	        onTextAreaKeyDown: function (e) {
			    var key = e.keyCode || e.which;
			    var value = e.target.value;
			    if (key >= 32 &&
			        key < 127 &&
			        this._options.maxlength !== -1 &&
			        value.length >= this._options.maxlength) {
			        e.target.value = value.substring(0, this._options.maxlength);
			        e.preventDefault();
			    }
			},
	        /* END Event handling */

	        dispose: function () {
	            this.unbind('required', this.onRequiredChanged$proxy);

	            this.base.dispose.apply(this, arguments);
	        }
		})
		.complete();
})();