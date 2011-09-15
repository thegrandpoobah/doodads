(function($, undefined) {
    var CheckBox = function() {
        this._text = this._options.text;
        this._checked = this._options.checked;
        this._enabled = true;

        this.onClick$proxy = $.proxy(this.onClick, this);
		this.onFocus$proxy = $.proxy(this.onFocus, this);
		this.onBlur$proxy = $.proxy(this.onBlur, this);
    }
    CheckBox.defaultOptions = {
        text: ''
		, enabled: true
        , checked: false
    };
	
    CheckBox.DefaultRequiredRule = function() {
        this.validate = function(checked) {
            return {
                valid: checked
				, message: ''
            }
        }
    };
	
    CheckBox.prototype = $.extend(new base.constructor(), {
        constructElement: function() {
            base.constructElement.apply(this, arguments);

            this._label = this.element().find('label');
            this._input = this.element().find('#checkbox');
            this.enabled(this._options.enabled);
        }
        , onComponentReady: function() {
            base.onComponentReady.apply(this, arguments);

            if (this._options.required && this._options.validates) {
                this.required(true, new CheckBox.DefaultRequiredRule());
            }
        }
        , templateData: function() {
            return { text: this._text, checked: this._checked };
        }
        , _setDomId: function() {
            base._setDomId.apply(this, arguments);

            var computedId = String.format('{0}_checkbox', this.computedId());

            this._input.attr('id', computedId);
            this._label.attr('for', computedId);
        }
        , cssClassPrefix: function() {
            return 'c_checkBox';
        }
		, bindEvents: function() {
		    this._input
				.bind('click', this.onClick$proxy)
				.bind('focus', this.onFocus$proxy)
				.bind('blur', this.onBlur$proxy);
		}
        , checked: function(/*checked, trigger*/) {
            if (arguments.length === 0) return this._checked;
            else {

                if (this._checked === arguments[0]) return;

                this._checked = arguments[0];
                this.ensureElement();
                this._input[0].checked = this._checked;
				this.validate();

                if (arguments[1]) {
                    this.trigger_changed();
                }
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
		, validationContext: function() {
		    return this.checked();
		}
		, validationTarget: function() {
		    return this._input;
		}
        , hasInputFocus: function() {
            return this._focused;
        }
		, enabled: function(/*enable*/) {
		    if (arguments.length === 0) return this._enabled;
		    else {
		        this._enabled = arguments[0];
		        this.ensureElement();
		        this._input.enable(this._enabled);
		    }
		}
		, focus: function() {
		    this._input.focus();
		}
		, trigger_changed: function() {
		    $(this).trigger('changed', this._checked);
		}
		, onFocus: function(e) {
		    this._focused = true;
		    if (this._options.validates) {
		        if (!this.ranValidation()) {
		            this.validate();
		        } else {
		            this.setHintboxVisibility();
		        }
		    }
		    $(this).trigger('focus');
		}
        , onBlur: function(e) {
            if (this._options.validates) {
                this.hideHintbox();
            }
            $(this).trigger('blur');
            this._focused = false;
        }
		, onClick: function() {
		    this._checked = this._input[0].checked;
			this.validate();
		    $(this).trigger('click', this._checked);
		}
    });

    window.getComponentType = function() {
        return CheckBox;
    }
})(jQuery);