doodads.setup().inherits()(function(base) {
	this.constructor(function () {
		this._text = this._options.text;
	})
	.defaultOptions({
		text: ''
	})
	.proto({
		templateData: function () {
			return { text: this._text };
		},
		text: function (/*text*/) {
			if (arguments.length === 0) {
				return this._text;
			} else {
				this._text = arguments[0];
				this.element().text(this._text);
			}
		}
	})
	.complete();
});
