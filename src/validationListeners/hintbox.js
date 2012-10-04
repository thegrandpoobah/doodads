/*jshint browser:true, jquery:true */
/*global doodads:true, Mustache:true, grabbag: true */

(function() {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true */
	
	'use strict';
	
	// The HintBox validation listener will successfully bind unto any doodad which has 
	// validation enabled *and* exposes the following interface:
	// * hasInputFocus
	// * validationTarget
	// * focus event
	// * blur event

	// The HintBox validation listener uses jQuery.tipsy.js to display the validation hints
	
	// To optimize DOM usage, the HintBox validation listener shares an instance of the hintbox tipsy object
	var tipsyBox, 
		isBoxVisible = false, 
		template = Mustache.compile('<ul>{{#messages}}<li>{{text}}</li>{{/messages}}</ul>');
		
	$(function() {
		// add the doodads specific tipsy stylesheets
		$('head').append(
			'<style type="text/css">' +
				'.doodads-tipsy {' +
					'font-size: 9pt;' +
				'}' +
				'.doodads-tipsy .tipsy-inner {' +
					'background-color: white;' +
					'color: black;' +
					'text-align: left;' +
				'}' +
				'.doodads-tipsy-error .tipsy-inner { border: 2px solid red; }' +
				'.doodads-tipsy-error .tipsy-arrow-n { border-bottom-color: red; }' +
				'.doodads-tipsy-error .tipsy-arrow-s { border-top-color: red; }' +
				'.doodads-tipsy-error .tipsy-arrow-e { border-left-color: red; }' +
				'.doodads-tipsy-error .tipsy-arrow-w { border-right-color: red; }' +
				'.doodads-tipsy-info .tipsy-inner { border: 2px solid blue; }' +
				'.doodads-tipsy-info .tipsy-arrow-n { border-bottom-color: blue; }' +
				'.doodads-tipsy-info .tipsy-arrow-s { border-top-color: blue; }' +
				'.doodads-tipsy-info .tipsy-arrow-e { border-left-color: blue; }' +
				'.doodads-tipsy-info .tipsy-arrow-w { border-right-color: blue; }' +
				'.doodads-tipsy ul {' +
					'list-style: none;' +
					'margin: 0;' +
					'padding: 0;' +
				'}' +
				'.doodads-tipsy ul li {' +
					'margin: 0;' +
					'padding: 0;' +
				'}' +
			'</style>');

		$(document).tipsy({
			trigger: 'manual',
			html: true,
			className: 'doodads-tipsy',
			gravity: 'w',
			opacity: 1
		});
		tipsyBox = $(document).tipsy(true);
	});

	var HintBoxValidationListener = function (doodad) {
		if (arguments.length === 0) { 
			return;
		}

		$.extend(this, {
			onValidationApplied$proxy: doodads.proxy(this.onValidationApplied, this),
			onDoodadFocus$proxy: doodads.proxy(this.onDoodadFocus, this),
			onDoodadBlur$proxy: doodads.proxy(this.onDoodadBlur, this),
			onCapturedMouseDown$proxy: doodads.proxy(this.onCapturedMouseDown, this),

			_doodad: null,
			_validationState: {
				messages: [],
				isValid: true
			}
		});
		
		doodad.bind('validationApplied', this.onValidationApplied$proxy);
		doodad.bind('focus', this.onDoodadFocus$proxy);
		doodad.bind('blur', this.onDoodadBlur$proxy);
	};
	HintBoxValidationListener.listen = function (doodad) {
		if ($.isFunction(doodad.validationTarget)) {
			return new HintBoxValidationListener(doodad);
		} else {
			return null;
		}
	};

	HintBoxValidationListener.prototype = {
		/* BEGIN Event Handlers */

		onValidationApplied: function HintBoxValidationListener$onValidationApplied(e, args) {
			this._doodad = e.target;
			this._validationState = args;

			this.setHintBoxVisibility();
		},

		onDoodadFocus: function HintBoxValidationListener$onDoodadFocus(e) {
			if (e.target._options.validates) {
				if (!e.target.ranValidation()) {
					e.target.validate();
				} else {
					this._doodad = e.target;
					this.setHintBoxVisibility();
				}
			}
		},
		onDoodadBlur: function HintBoxValidationListener$onDoodadBlur(e) {
			if (e.target._options.validates) {
				this.hideHintBox();
			}
		},
		onCapturedMouseDown: function HintBoxValidationListener$onCapturedMouseDown(e) {
			var validationTarget = this._doodad.validationTarget();
			if (validationTarget && e.originalTarget === validationTarget[0]) {
				return;
			}

			this.hideHintBox();
		},

		/* END Event Handlers */

		setHintBoxVisibility: function HintBoxValidationListener$setHintBoxVisibility(doodad) {
			if (this._doodad && this._doodad.hasInputFocus() && (this._validationState.messages || []).length > 0) {
				this.showHintBox();
			} else {
				this.hideHintBox();
			}
		},

		showHintBox: function HintBoxValidationListener$showHintBox() {
			var target = this._doodad ? this._doodad.validationTarget() : null,
				self = this;

			tipsyBox.options.title = function() {
				return template(self._validationState);
			};
			
			if (target) {
				tipsyBox.$element = target;
			}

			// set the color
			if (this._validationState.isValid) {
				tipsyBox.options.className = 'doodads-tipsy doodads-tipsy-info';
			} else {
				tipsyBox.options.className = 'doodads-tipsy doodads-tipsy-error';
			}
			
			tipsyBox.show();
			
			isBoxVisible = true;
			
			grabbag.event.capture('mousedown', this._doodad.element(), this.onCapturedMouseDown$proxy);
		},
		hideHintBox: function HintBoxValidationListener$hideHintBox() {
			if (!isBoxVisible) {
				return;
			}
			
			tipsyBox.hide();
			
			isBoxVisible = false;

			grabbag.event.release('mousedown');
		},

		dispose: function HintBoxValidationListener$dispose(doodad) {
			doodad.unbind('validationApplied', this.onValidationApplied$proxy);
			doodad.unbind('focus', this.onDoodadFocus$proxy);
			doodad.unbind('blur', this.onDoodadBlur$proxy);
		}
	};
	HintBoxValidationListener.prototype.constructor = HintBoxValidationListener;

	doodads.validation.registerListener('hintbox', HintBoxValidationListener);
})();