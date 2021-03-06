/*jshint browser:true, jquery:true */
/*global doodads:true, Mustache:true */

doodads.setup([jQuery])(function(builder, base, $) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true */
	
	'use strict';
	
	var defaultRequiredRule = function (checked) {
		return {
			valid: checked,
			message: ''
		};
	};
		
	builder.constructor(function () {
		$.extend(this, {
			_text: this._options.text,
			_checked: this._options.checked,
			_enabled: true,

			onClick$proxy: doodads.proxy(this.onClick, this),
			onFocus$proxy: doodads.proxy(this.onFocus, this),
			onBlur$proxy: doodads.proxy(this.onBlur, this)
		});
	}).defaultOptions({
		text: '',
		enabled: true,
		checked: false
    }).validates()
	.proto({
		constructElement: function CheckBox$constructElement() {
			base.constructElement.apply(this, arguments);

			this._label = this.element().find('label');
			this._input = this.element().find('#checkbox');
			this.enabled(this._options.enabled);
		},
		onReady: function CheckBox$onReady() {
			base.onReady.apply(this, arguments);

			if (this._options.required && this._options.validates) {
				this.required(true, defaultRequiredRule);
			}
		},
		templateData: function CheckBox$templateData() {
			return {
				text: this._text,
				checked: this._checked
			};
		},
		_setDomId: function CheckBox_setDomId() {
			base._setDomId.apply(this, arguments);

			var computedId = this.computedId() + '_checkbox';

			this._input.attr('id', computedId);
			this._label.attr('for', computedId);
		},
		cssClassPrefix: function CheckBox$cssClassPrefix() {
			return 'checkBox';
		},
		bindEvents: function CheckBox$bindEvents() {
			this._input
				.bind('click', this.onClick$proxy)
				.bind('focus', this.onFocus$proxy)
				.bind('blur', this.onBlur$proxy);
		},
		checked: function CheckBox$checked( /*checked, trigger*/ ) {
			if (arguments.length === 0) {
				return this._checked;
			} else {
				if (this._checked === arguments[0]) {
					return;
				}

				this._checked = arguments[0];
				this.ensureElement();
				this._input[0].checked = this._checked;
				this.validate();

				if (arguments[1]) {
					this.trigger_changed(this._checked);
				}
			}
		},
		text: function CheckBox$text( /*text*/ ) {
			if (arguments.length === 0) {
				return this._text;
			} else {
				this._text = arguments[0];

				this.ensureElement();
				this._label.text(this._text);
			}
		},
		validationContext: function CheckBox$validationContext() {
			return this.checked();
		},
		validationTarget: function CheckBox$validationTarget() {
			return this._input;
		},
		hasInputFocus: function CheckBox$hasInputFocus() {
			return this._focused;
		},
		enabled: function CheckBox$enabled( /*enable*/ ) {
			if (arguments.length === 0) {
				return this._enabled;
			} else {
				this._enabled = arguments[0];
				this.ensureElement();
				if (this._enabled) {
					this._input.removeAttr('disabled');
				} else {
					this._input.attr('disabled', true);
				}
			}
		},
		focus: function CheckBox$focus() {
			this._input.focus();
		},
		onFocus: function CheckBox$onFocus(e) {
			this._focused = true;
			this.trigger_focus();
		},
		onBlur: function CheckBox$onBlur(e) {
			this._focused = false;
			this.trigger_blur();
		},
		onClick: function CheckBox$onClick() {
			this.checked(this._input[0].checked, true);
		},
		
		trigger_changed: function CheckBox$trigger_changed(newValue) {
			this.trigger('changed', newValue);
		},
		trigger_focus: function CheckBox$trigger_focus() {
			this.trigger('focus');
		},
		trigger_blur: function CheckBox$trigger_blur() {
			this.trigger('blur');
		}
	}).complete();
});
