(function($) {
	doodads.setup().inherits()(function (base) {
		this.constructor(function () {
			this._textElement = null;

			this._text = this._options.text;
			this._tooltip = this._options.tooltip;
			this._enabled = this._options.enabled;

			this._baseCssClass = this._cssClassOverrides;
			this._tracking = false;
			this._active = false;

			this._bindEventsInitial$proxy = doodads.proxy(this._bindEventsInitial, this);

			this.onMouseDown$proxy = doodads.proxy(this.onMouseDown, this);
			this.onMouseUp$proxy = doodads.proxy(this.onMouseUp, this);
			this.onDocumentMouseUp$proxy = doodads.proxy(this.onDocumentMouseUp, this);
			this.onMouseOut$proxy = doodads.proxy(this.onMouseOut, this);
			this.onMouseOver$proxy = doodads.proxy(this.onMouseOver, this);

			this.onFocus$proxy = doodads.proxy(this.onFocus, this);
			this.onBlur$proxy = doodads.proxy(this.onBlur, this);
			this.onKeyDown$proxy = doodads.proxy(this.onKeyDown, this);
			this.onKeyUp$proxy = doodads.proxy(this.onKeyUp, this);
		}).defaultOptions({
			text: '',
			tooltip: null,
			tabIndex: 0,
			enabled: true,
			disabledCssClass: 'buttonDisabled',
			trackingCssClass: 'buttonHover',
			activeCssClass: 'buttonTracking'
		}).proto({
			constructElement: function Button$constructElement() {
				base.constructElement.apply(this, arguments);

				this._textElement = this.element().find('span');

				this.enabled(this._enabled);
			},
			templateData: function Button$templateData() {
				return {
					tooltip: this._tooltip,
					text: this._text
				};
			},
			cssClassPrefix: function Button$cssClassPrefix() {
				return 'button';
			},
			cssClass: function Button$cssClass( /*cssClass*/ ) {
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
			},
			bindEvents: function Button$bindEvents() {
				this.element()
					.one('mouseover', this._bindEventsInitial$proxy)
					.focus(this.onFocus$proxy)
					.blur(this.onBlur$proxy)
					.keydown(this.onKeyDown$proxy)
					.keyup(this.onKeyUp$proxy);
			},
			_bindEventsInitial: function Button$_bindEventsInitial() {
				this.onMouseOver.apply(this, arguments);
				
				this.element()
					.mouseover(this.onMouseOver$proxy)
					.mousedown(this.onMouseDown$proxy)
					.mouseup(this.onMouseUp$proxy)
					.mouseout(this.onMouseOut$proxy)
					.bind('selectstart', function (e) {
						e.preventDefault();
					}); // disable text selection in IE
			},
			_updateCssClass: function Button$_updateCssClass() {
				this.cssClass(this.cssClass());
				base._updateCssClass.apply(this, arguments);
			},
			text: function Button$text( /*text*/ ) {
				if (arguments.length === 0) {
					return this._text;
				} else {
					this._text = arguments[0];
					this._textElement.text(this._text);
				}
			},
			tooltip: function Button$tooltip( /*tooltip*/ ) {
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
			},
			enabled: function Button$enabled( /*enable*/ ) {
				if (arguments.length === 0) {
					return this._enabled;
				} else {
					this._enabled = arguments[0];
					this._updateCssClass();
				}
			},
			// BEGIN event handlers
			onMouseOver: function Button$onMouseOver(e) {
				if (this.enabled()) {
					this._tracking = true;
					this._updateCssClass();
				}
				e.stopPropagation();
			},
			onMouseOut: function Button$onMouseOut(e) {
				if (this.enabled()) {
					this._tracking = false;
					this._updateCssClass();
				}
				e.stopPropagation();
			},
			onMouseDown: function Button$onMouseDown(e) {
				if (e.which !== doodads.mouseCode.left) {
					return;
				}

				if (this.enabled()) {
					this._active = true;
					this._updateCssClass();
					$(document).mouseup(this.onDocumentMouseUp$proxy);
				}
				e.stopPropagation();
			},
			onMouseUp: function Button$onMouseUp(e) {
				if (e.which !== doodads.mouseCode.left) {
					return;
				}
				if (this.enabled() && this._active) {
					this._active = false;
					this._updateCssClass();
					$(document).unbind('mouseup', this.onDocumentMouseUp$proxy);

					this.trigger('click');
				}
				e.stopPropagation();
			},
			onDocumentMouseUp: function Button$onDocumentMouseUp() {
				if (this.enabled() && this._active) {
					this._active = false;
					this._updateCssClass();
					$(document).unbind('mouseup', this.onDocumentMouseUp$proxy);
				}
			},

			onFocus: function Button$onFocus(e) {
				if (this.enabled()) {
					this._hasFocus = true;
					this._updateCssClass();
				}
			},
			onBlur: function Button$onBlur(e) {
				if (this.enabled()) {
					this._hasFocus = false;
					this._updateCssClass();
				}
			},
			onKeyDown: function Button$onKeyDown(e) {
				if (this.enabled()) {
					switch (e.which) {
						case doodads.keyCode.ENTER:
							this.trigger('click');

							e.preventDefault();
							e.stopPropagation();

							break;
						case doodads.keyCode.SPACE:
							this._active = true;
							this._updateCssClass();

							e.preventDefault();
							e.stopPropagation();

							break;
					}
				}
			},
			onKeyUp: function Button$onKeyUp(e) {
				if (this.enabled()) {
					switch (e.which) {
						case doodads.keyCode.SPACE:
							this._active = false;
							this._updateCssClass();

							this.trigger('click');

							e.preventDefault();
							e.stopPropagation();

							break;
					}
				}
			}
			// END event handlers
		}).complete();
	});
})(jQuery);