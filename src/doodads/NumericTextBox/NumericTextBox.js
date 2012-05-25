doodads.setup([jQuery])(function(builder, base, $) {
	var EPSILON = 1e-10,
		NUMREGEX = /^\-?([1-9]{1}[0-9]{0,2}(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))$|^\-?([1-9]{1}\d*(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))$|^\(([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))\)$/;

	var defaultRequiredRule = function (context) {
		return {
			valid: true
		};
	};
	
	var defaultValidationRule = function (context, args) {
		return {
			valid: NUMREGEX.test(context),
			message: 'Please enter a valid number'
		};
	};

	var formatters = {
		addComma: function (number, dec_places, no_value, prefix, suffix) {
			if (no_value == null) no_value = '';
			if (number == null) return no_value;
			var new_number = '';
			var i = 0; //Just used in loops
			var sign = ""; //If negative, a minus sign will be prefixed to the result
			var number = number.toString(); //We need to operate on and return a string, not a number
			// Handle cases when number is in the exp form, such as "6e-7".
			// In this case, we actually want the expanded form, that is "-0.0000006"
			exp = number.indexOf('e');
			if (exp > -1) {
				var str = number.substring(exp + 1);
				var num = number.substring(0, exp).replace(/-|\./g, '');
				var dec = parseInt(number.substring(exp + 2)) - 1;
				var str = (num.charAt(0) == '-') ? '-0.' : '0.';
				for (var i = 0; i < dec; i++) {
					str += '0';
				}
				number = str + num;
			}
			//Remove any excess white space
			number = number.replace(/^\s+|\s+$/g, '');
			//Do we have a negative number?
			if (number.charAt(0) == '-') //minus sign
			{
				sign = '-';
				number = number.substring(1);
			}
			dec_places = parseInt(dec_places);
			dec_point_pos = number.lastIndexOf('.');
			//If there is nothing before the decimal point, prefix with a zero
			if (dec_point_pos == 0) {
				number = '0' + number;
				dec_point_pos = 1;
			}
			//Is number an integer?
			if (dec_point_pos == -1 || dec_point_pos == number.length - 1) {
				if (dec_places > 0) {
					new_number = number + '.';
					for (i = 0; i < dec_places; i++) {
						new_number += '0';
					}
					if (new_number == 0) {
						sign = '';
					}
					str = sign + new_number;
				} else {
					str = sign + number;
				}
			} else {
				var existing_places = (number.length - 1) - dec_point_pos;
				if (existing_places == dec_places) {
					//Do we already have the right number of decimal places?
					str = sign + number;
				} else if (existing_places < dec_places) {
					//Do we already have less than the number of decimal places we want?
					//If so, pad out with zeros
					new_number = number;
					for (i = existing_places; i < dec_places; i++) {
						new_number += '0';
					}
					if (new_number == 0) sign = '';
					str = sign + new_number;
				} else {
					//Work out whether to round up or not
					var end_pos = (dec_point_pos * 1) + dec_places;
					//Whether or not to round up (add 1 to) the next digit along
					var round_up = (number.charAt(end_pos + 1) * 1) > 4;
					//Record each digit in an array for easier manipulation
					var digit_array = [];
					for (i = 0; i <= end_pos; i++) {
						digit_array[i] = number.charAt(i);
					}
					//Round up the last digit if required, and continue until no more 9's are found
					if (round_up) {
						for (i = digit_array.length - 1; i >= 0; i--) {
							if (digit_array[i] != '.') {
								digit_array[i]++;
								if (digit_array[i] < 10) {
									break;
								}
							}
						}
					}
					//Reconstruct the string, converting any 10's to 0's (except for first digit which can stay as a 10)
					for (i = 0; i <= end_pos; i++) {
						new_number += (digit_array[i] == "." || digit_array[i] < 10 || i == 0) ? digit_array[i] : '0';
					}
					//If there are no decimal places, we don't need a decimal point
					if (dec_places == 0) new_number = new_number.replace('.', '');
					if (new_number == 0) sign = '';
					str = sign + new_number;
				}
			}
			// Add commas
			strArray = str.split('.');
			x1 = strArray[0];
			x2 = strArray.length > 1 ? '.' + strArray[1] : '';
			var rgx = /(\d+)(\d{3})/;
			while (rgx.test(x1)) {
				x1 = x1.replace(rgx, '$1' + ',' + '$2');
			}
			x1 = x1 + x2;
			if (prefix) {
				x1 = prefix + x1;
			}
			if (suffix) {
				x1 = x1 + suffix;
			}
			return x1;
		},
		removeComma: function (value) {
			var sign = '';
			if (value.charAt(0) === '(') {
				sign = '-';
			}
			value = sign + value.replace(/[\(\)-,%]/g, '');
			return value;
		}
	}

	builder.constructor(function () {
		this._backValue = this._frontValue = this._options.value;

		var textDecimals = this._options.textDecimals;
		var valueDecimals = this._options.valueDecimals;

		this._formatText = function (val) {
			return formatters.addComma(val, textDecimals);
		};
		this._formatValue = function (val) {
			var raise = Math.pow(10, valueDecimals);
			return Math.round(val * raise) / raise;
		};
	}).defaultOptions({
		value: null,
		required: false,
		enabled: true,
		textDecimals: 2,
		valueDecimals: 4
	}).proto({
		onChildrenReady: function NumericTextBox$onChildrenReady() {
			base.onChildrenReady.apply(this, arguments);
			
			this._input.watermarkingEnabled(false);

			if (this._options.validates) {
				this.addRule(defaultValidationRule);

				if (this._options.required) {
					this.required(true, defaultRequiredRule);
				}
			}
		},
		cssClassPrefix: function NumericTextBox$cssClassPrefix() {
			return 'numericTextBox';
		},
		templateData: function NumericTextBox$templateData() {
			return {
				showStar: this._options.showStar,
				enabled: this._options.enabled,
				value: $.proxy(function () {
					return this.formatText()(this.val());
				}, this)
			};
		},

		/* BEGIN Properties */
		_underlyingValue: function NumericTextBox$_underlyingValue() {
			if (arguments.length === 0) {
				return this._frontValue;
			} else {
				var newValue = arguments[0];

				if (NUMREGEX.test(newValue) && this._frontValue !== null && Math.abs(newValue - this._frontValue) <= EPSILON) {
					return;
				} else if (!NUMREGEX.test(newValue)) {
					newValue = null;
				}

				this._frontValue = newValue;

				if (arguments[1]) {
					this.trigger('changing');
				}

				if (this._options.validates) {
					this._updateTextBox();
					this.validate();
				}

				if (arguments[1]) {
					this.trigger('changed');
				}
			}
		},
		val: function NumericTextBox$val( /*value, triggerEvents*/ ) {
			/// <summary>
			///     1: val() - returns the value.
			///     2: val(value) - Changes the value.
			///     3: val(value, triggerEvents) - Changes value, triggers the change and changing events (if true).
			/// </summary>
			/// <param name="value" type="Int" />
			/// <param name="triggerEvents" type="Boolean" optional="true">
			///     If true, trigger the change and the changing events. 
			/// </param>
			/// <returns type="Int" />
			if (arguments.length === 0) {
				if (this._frontValue === null) {
					return null;
				} else {
					return this.formatValue()(this._underlyingValue());
				}
			} else {
				this._underlyingValue.apply(this, arguments);
				this._updateTextBox();
				this._backValue = this._frontValue;
			}
		},
		enabled: function NumericTextBox$enabled( /*value*/ ) {
			return this._input.enabled.apply(this._input, arguments);
		},
		formatText: function NumericTextBox$formatText( /*func*/ ) {
			/// <summary>
			///     1: val() - returns the format function.
			///     2: val(func) - Changes the format function.
			///
			///     Format the value of the input when it's not in focus
			///
			/// </summary>
			/// <param name="func" type="Function" />
			/// <returns type="Function" />
			if (arguments.length === 0) {
				return this._formatText;
			} else {
				this._formatText = arguments[0];
				this._updateTextBox();
			}
		},
		formatValue: function NumericTextBox$formatValue( /*func*/ ) {
			/// <summary>
			///     1: val() - returns the format function.
			///     2: val(func) - Changes the format function.
			///
			///     Format the value of the input when it's in focus
			///
			/// </summary>
			/// <param name="func" type="Function" />
			/// <returns type="Function" />
			if (arguments.length === 0) {
				return this._formatValue;
			} else {
				this._formatValue = arguments[0];
				this._updateTextBox();
			}
		},
		/* END Properties */

		/* BEGIN Validation */
		validationTarget: function NumericTextBox$validationTarget() {
			return this._input.validationTarget();
		},
		validationContext: function NumericTextBox$validationContext() {
			return this.val();
		},
		isValidationContextEmpty: function NumericTextBox$isValidationContextEmpty(context) {
			return this._input.text().trim() === '';
		},
		hasInputFocus: function NumericTextBox$hasInputFocus() {
			return this._focused;
		},
		onInputValid: function NumericTextBox$onInputValid(e) {
			e.stopPropagation();
		},
		onInputInvalid: function NumericTextBox$onInputInvalid(e) {
			e.stopPropagation();
		},
		/* END Validation */

		/* BEGIN Event Handlers */
		onFocus: function NumericTextBox$onFocus(e) {
			this._focused = true;

			this._updateTextBox();

			this._input._input.select();

			this.trigger('focus');
		},
		onBlur: function NumericTextBox$onBlur(e) {
			this._focused = false;

			this._updateTextBox();

			this.trigger('blur');
		},
		onChanging: function NumericTextBox$onChanging(e) {
			this._computeVal();
		},
		/* END Event Handlers */

		_computeVal: function NumericTextBox$_computeVal() {
			var text = this._input._input.val(),
				value;

			if (NUMREGEX.test(text)) {
				this._underlyingValue(parseFloat(formatters.removeComma(text)), true);
			} else {
				this._underlyingValue(null, true);
			}
		},
		_updateTextBox: function NumericTextBox$_updateTextBox() {
			var text;

			if (this.hasInputFocus()) {
				text = this.val();
			} else if (this.valid() || NUMREGEX.test(this._underlyingValue())) {
				text = this.formatText()(this._underlyingValue());
			} else {
				text = this._underlyingValue();
			}

			if (text === null) {
				text = '';
			}

			// Synchronize the underlying TextBox component's private fields
			// with the formatted value stored of this component.
			text += ''; // coerce to string
			this._input._text = text;
			this._input._input.val(text);
		}
	}).complete();
});
