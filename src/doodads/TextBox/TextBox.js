/*jshint browser:true, jquery:true */
/*global doodads:true, Mustache:true, captureEvent:true, releaseEvent: true */

doodads.setup([jQuery])(function (builder, base, $) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true */
	
	'use strict';
	
	var KEYUP_DEBOUNCE_PERIOD = 10; // in ms

	var defaultRequiredRule = function (content) {
		return {
			valid: content.trim().length > 0,
			message: ''
		};
	};

	builder.constructor(function () {
		this.onTextAreaKeyPress$proxy = doodads.proxy(this.onTextAreaKeyPress, this);
		this.onInputChanged$debounced = doodads.debounce(this.onInputChanged, KEYUP_DEBOUNCE_PERIOD, this);
		this.onFocus$proxy = doodads.proxy(this.onFocus, this);
		this.onBlur$proxy = doodads.proxy(this.onBlur, this);

		this._text = '';

		this._focused = false;
		this._enabled = true;

		this._watermarkOn = false;
		this._watermarkingEnabled = true;
	}).defaultOptions({
		text: '',
		watermark: '',
		minlength: 0,
		maxlength: Number.MAX_VALUE,
		multiline: false,
		password: false,
		enabled: true,
		rows: 4,
		cols: 40
    }).validates()
    .statics({
		lengthValidationRuleGenerator: function(min, max) {
			var format = 'count:{{0}}';

			if (max !== builder.type().defaultOptions.maxlength) {
				format = 'max:' + max + ' | ' + format;
			}
			if (min !== builder.type().defaultOptions.minlength) {
				format = 'min:' + min + ' | ' + format;
			}

			return function (context) {
				var l = context.toString().length;
				
				return {
					valid: l >= min && l < max,
					message: Mustache.format(format, l),
					alwaysShow: true
				};
			};
		}
	}).proto({
		onReady: function TextBox$onReady() {
			base.onReady.apply(this, arguments);

			if (this._options.required && this._options.validates) {
				this.required(true, defaultRequiredRule);
			}
		},
		constructElement: function TextBox$constructElement() {
			base.constructElement.apply(this, arguments);

			this._input = this._source.find('input, textarea');

			if (this._options.validates && 
				(this._options.maxlength !== builder.type().defaultOptions.maxlength || this._options.minlength !== builder.type().defaultOptions.minlength))
			{
				this.addRule(builder.type().lengthValidationRuleGenerator(this._options.minlength, this._options.maxlength));
			}
		},
		cssClassPrefix: function TextBox$cssClassPrefix() {
			return 'textbox';
		},
		bindEvents: function TextBox$bindEvents() {
			this._input
				.bind('input propertychange', this.onInputChanged$debounced)
				.bind('focus.cmp', this.onFocus$proxy)
				.bind('blur.cmp', this.onBlur$proxy);

			if (this._options.multiline) {
				this._input.bind('keypress', this.onTextAreaKeyPress$proxy);
			}
		},
		render: function TextBox$render() {
			base.render.apply(this, arguments);

			if (this._options.text.trim() !== '') {
				this.text(this._options.text);
			} else if (this._options.watermark.trim() !== '') {
				this._addWatermark();
			}

			this.enabled(this._options.enabled);
		},
		watermarkingEnabled: function TextBox$watermarkingEnabled() {
			if (arguments.length === 0) {
				return this._watermarkingEnabled;
			} else {
				// in combination, resets the watermark if necessary
				this._removeWatermark();
				this._watermarkingEnabled = arguments[0];
				this._addWatermark();
			}
		},
		_addWatermark: function TextBox$_addWatermark() {
			if (this.watermarkingEnabled() && !this._watermarkOn && this._input.val().length === 0) {
				this._input.addClass('watermarked');
				this._input.val(this._options.watermark);
				this._watermarkOn = true;
			}
		},
		_removeWatermark: function TextBox$_removeWatermark() {
			if (this.watermarkingEnabled() && this._watermarkOn) {
				this._input.val('');
				this._watermarkOn = false;
			}
			this._input.removeClass('watermarked');
		},
		_setCaretPosition: function TextBox$_setCaretPosition(pos) {
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
		templateData: function TextBox$templateData() {
			var obj = {};

			if (this._options.multiline) {
				return $.extend(obj, {
					isMultiLine: true,
					rows: this._options.rows,
					cols: this._options.cols
				});
			} else {
				obj = $.extend(obj, {
					maxlength: this._options.maxlength,
					hasMaxlength: this._options.maxlength !== builder.type().defaultOptions.maxlength
				});

				if (this._options.password) {
					return $.extend(obj, {
						isPassword: true
					});
				} else {
					return $.extend(obj, {
						isText: true
					});
				}
			}
		},
		validationContext: function TextBox$validationContext() {
			return this.text();
		},
		validationTarget: function TextBox$validationTarget() {
			return this._input;
		},
		text: function TextBox$text( /*value, triggerEvents*/ ) {
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
					this.trigger_changing();
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
					this.trigger_changed();
				}
			}
		},
		focus: function TextBox$focus() {
			this._input.focus();
		},
		hasInputFocus: function TextBox$hasInputFocus() {
			return this._focused;
		},
		
		/* BEGIN Enable/Disable management */
		enabled: function TextBox$enabled( /*value*/) {
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
		disabled: function TextBox$disabled( /*value*/) {
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
		onInputChanged: function TextBox$onInputChanged(e) {
			var val;
			if (this._watermarkOn) {
				val = '';
			} else {
				val = this._input.val();
			}
			this.text(val, true);
		},
		onFocus: function TextBox$onFocus(e) {
			this._focused = true;
			this._removeWatermark();

			if ($.browser.msie) {
				this.trigger_focus();
				return;
			}

			// BEGIN: WORKAROUND for bug 524360 in FireFox
			// see https://bugzilla.mozilla.org/show_bug.cgi?id=524360 for more details
			// (ideally this whole section would just be this.trigger('focus');
			this._input
				.unbind('focus.cmp blur.cmp')
				.blur();

			var self = this;
			window.setTimeout(function () {
				self.trigger_focus();

				self._input
					.focus()
					.bind('focus.cmp', self.onFocus$proxy)
					.bind('blur.cmp', self.onBlur$proxy);
			}, 0);
			// END: WORKAROUND for bug 524360
		},
		onBlur: function TextBox$onBlur(e) {
			this._focused = false;
			this._addWatermark();
			this.trigger_blur();
		},
		onTextAreaKeyPress: function TextBox$onTextAreaKeyDown(e) {
			if (e.which !== 0 && this._options.maxlength !== -1 && e.target.value.length >= this._options.maxlength) {
				e.target.value = e.target.value.substring(0, this._options.maxlength);
				e.preventDefault();
			}
		},
		/* END Event handling */
		
		/* BEGIN Event Triggers */
		trigger_changing: function TextBox$trigger_changing() {
			this.trigger('changing');
		},
		trigger_changed: function TextBox$trigger_changed() {
			this.trigger('changed');
		},
		trigger_focus: function TextBox$trigger_focus() {
			this.trigger('focus');
		},
		trigger_blur: function TextBox$trigger_blur() {
			this.trigger('blur');
		}
		/* END Event Triggers */
	}).complete();
});
