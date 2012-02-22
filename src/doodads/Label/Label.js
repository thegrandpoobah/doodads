doodads.setup()(function(base) {
	this.constructor(function () {
		this._text = this._options.text;
	})
	.defaultOptions({
		text: ''
	})
	.proto({
		templateData: function Label$templateData() {
			return { text: this._text };
		},
		text: function Label$text(/*text*/) {
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
