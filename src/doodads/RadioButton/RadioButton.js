doodads.setup().inherits()(function(base) {
	this.constructor(function () {
		this._text = this._options.text;
		this._checked = this._options.checked;
		this._enabled = true;
		this._group = this._options.group;

		this.onClick$proxy = doodads.proxy(this.onClick, this);
	}).defaultOptions({
		text: '',
		enabled: true,
		checked: false,
		group: ''
	}).proto({
		constructElement: function () {
			base.constructElement.apply(this, arguments);

			this._label = this.element().find('label');
			this._input = this.element().find('#radiobutton');
			this.enabled(this._options.enabled);
		},
		templateData: function () {
			return {
				text: this._text,
				checked: this._checked,
				group: this._group
			};
		},
		_setDomId: function () {
			base._setDomId.apply(this, arguments);

			var computedId = Mustache.format('{{0}}_radiobutton', this.computedId()),
				parent = this.parent();

			this._input.attr('id', computedId);
			this._label.attr('for', computedId);

			while (parent && parent.computedId() === '') {
				parent = parent.parent();
			}

			if (parent) {
				// mangle the group just in case
				this._input.attr('name', $.proxy(function (index, name) {
					return String.format('{0}_{1}', parent.computedId(), this._group);
				}, this));
			} else {
				// if the ancestory did not provide a "naming container", then just set the unmangled group option
				this._input.attr('name', this._group);
			}
		},
		cssClassPrefix: function () {
			return 'radioButton';
		},
		bindEvents: function () {
			this._input.bind('click', this.onClick$proxy);
		},
		checked: function ( /*checked*/ ) {
			if (arguments.length === 0) {
				return this._input[0].checked;
			} else {
				this._checked = arguments[0];

				this.ensureElement();
				this._input[0].checked = this._checked;
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
		onClick: function (e) {
			this._checked = this._input[0].checked;
			this.trigger('click', this._checked);

			e.stopPropagation();
		}
	}).complete();
});