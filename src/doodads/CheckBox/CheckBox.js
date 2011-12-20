(function () {
	var defaultRequiredRule = function (checked) {
			return {
				valid: checked,
				message: ''
			}
		};

	doodads.setup().constructor(function () {
		this._text = this._options.text;
		this._checked = this._options.checked;
		this._enabled = true;

		this.onClick$proxy = doodads.proxy(this.onClick, this);
		this.onFocus$proxy = doodads.proxy(this.onFocus, this);
		this.onBlur$proxy = doodads.proxy(this.onBlur, this);
	}).defaultOptions({
		text: '',
		enabled: true,
		checked: false
	}).proto({
		constructElement: function () {
			this.base.constructElement.apply(this, arguments);

			this._label = this.element().find('label');
			this._input = this.element().find('#checkbox');
			this.enabled(this._options.enabled);
		},
		onReady: function () {
			this.base.onReady.apply(this, arguments);

			if (this._options.required && this._options.validates) {
				this.required(true, defaultRequiredRule);
			}
		},
		templateData: function () {
			return {
				text: this._text,
				checked: this._checked
			};
		},
		_setDomId: function () {
			this.base._setDomId.apply(this, arguments);

			var computedId = Mustache.format('{{0}}_checkbox', this.computedId());

			this._input.attr('id', computedId);
			this._label.attr('for', computedId);
		},
		cssClassPrefix: function () {
			return 'checkBox';
		},
		bindEvents: function () {
			this._input
				.bind('click', this.onClick$proxy)
				.bind('focus', this.onFocus$proxy)
				.bind('blur', this.onBlur$proxy);
		},
		checked: function ( /*checked, trigger*/ ) {
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
					this.trigger('changed', this._checked);
				}
			}
		},
		text: function ( /*text*/ ) {
			if (arguments.length === 0) {
				return this._text;
			} else {
				this._text = arguments[0];

				this.ensureElement();
				this._label.text(this._text);
			}
		},
		validationContext: function () {
			return this.checked();
		},
		validationTarget: function () {
			return this._input;
		},
		hasInputFocus: function () {
			return this._focused;
		},
		enabled: function ( /*enable*/ ) {
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
		focus: function () {
			this._input.focus();
		},
		onFocus: function (e) {
			this._focused = true;
			this.trigger('focus');
		},
		onBlur: function (e) {
			this._focused = false;
			this.trigger('blur');
		},
		onClick: function () {
			this._checked = this._input[0].checked;
			this.validate();
			this.trigger('click', this._checked);
		}
	}).complete();
})();