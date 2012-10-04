/*jshint browser:true, jquery:true */
/*global doodads:true, Mustache:true */

doodads.setup([jQuery])(function(builder, base, $) {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true */
	
	'use strict';
	
	builder.constructor(function () {
		$.extend(this, {
			_text: this._options.text
		});
	}).defaultOptions({
		text: ''
	}).proto({
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
	}).complete();
});
