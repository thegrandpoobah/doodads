(function() {
	// The HintBox validation listener will successfully bind unto any doodad which has 
	// validation enabled *and* exposes the following interface:
	// * hasInputFocus
	// * validationTarget
	// * focus event
	// * blur event	

	// To optimize DOM usage, the HintBox validation listener shares an instance of the
	// hint box and hint list doodads
	var sharedHintBox,
		sharedHintList,
		hintBoxDOMTarget = null;

	var HintBoxValidationListener = function (doodad) {
		if (arguments.length === 0) { return; }

		this.onValidationApplied$proxy = doodads.proxy(this.onValidationApplied, this);
		this.onDoodadFocus$proxy = doodads.proxy(this.onDoodadFocus, this);
		this.onDoodadBlur$proxy = doodads.proxy(this.onDoodadBlur, this);
		this.onCapturedMouseDown$proxy = doodads.proxy(this.onCapturedMouseDown, this);

		doodad.bind('validationApplied', this.onValidationApplied$proxy);
		doodad.bind('focus', this.onDoodadFocus$proxy);
		doodad.bind('blur', this.onDoodadBlur$proxy);

		this._doodad = null;
		this._validationState = {
			messages: []
			, isValid: true
		};
	}
	HintBoxValidationListener.canListen = function (doodad) {
		if (doodad._options.validationListeners.indexOf('hintbox') !== -1 && // the doodad *wants* the hint-list
			$.isFunction(doodad.validationTarget)) { // and the doodad implements the IHintBoxListenerSource interface

			return true;
		} else {
			return false;
		}
	}
	HintBoxValidationListener.listen = function (doodad) {
		return new HintBoxValidationListener(doodad);
	}

	HintBoxValidationListener.prototype = {
		/* BEGIN Event Handlers */

		onValidationApplied: function HintBoxValidationListener$onValidationApplied(e, args) {
			this._doodad = e.target;
			this._validationState = args;

			this.setHintBoxVisibility();
		}

		, onDoodadFocus: function HintBoxValidationListener$onDoodadFocus(e) {
			if (e.target._options.validates) {
				if (!e.target.ranValidation()) {
					e.target.validate();
				} else {
					this._doodad = e.target;
					this.setHintBoxVisibility();
				}
			}
		}
		, onDoodadBlur: function HintBoxValidationListener$onDoodadBlur(e) {
			if (e.target._options.validates) {
				this.hideHintBox();
			}
		}
		, onCapturedMouseDown: function HintBoxValidationListener$onCapturedMouseDown(e) {
			var validationTarget = this._doodad.validationTarget();
			if (validationTarget && e.originalTarget === validationTarget[0]) return;

			this.hideHintBox();
		}

		/* END Event Handlers */

		, setHintBoxVisibility: function HintBoxValidationListener$setHintBoxVisibility(doodad) {
			if (this._doodad && this._doodad.hasInputFocus() && (this._validationState.messages || []).length > 0) {
				this.showHintBox();
			} else {
				this.hideHintBox();
			}
		}

		, showHintBox: function HintBoxValidationListener$showHintBox() {
			var target = this._doodad ? this._doodad.validationTarget() : null,
				self = this;

			if (target) {
				this.hintList().done(function(hlist) {
					hlist.dataSource(self._validationState.messages);
				});

				// set the color
				if (this._validationState.messages.length > 0) {
					if (this._doodad.valid()) {
						this.hintBox().done(function(hbx) {
							hbx.element().addClass('infobox');
						});
					} else {
						this.hintBox().done(function(hbx) {
							hbx.element().removeClass('infobox');
						});
					}
				}
			}

			if (hintBoxDOMTarget !== target) {
				hintBoxDOMTarget = target;

				this.hintBox().done(function (hbx) {
					hbx.show(target,
						self._doodad._options.hintBoxOrientation || 'bottom right',
						self._doodad._options.hintBoxDirection || 'down right');
				});
				captureEvent('mousedown', this._doodad.element(), this.onCapturedMouseDown$proxy);
			}
		}
		, hideHintBox: function HintBoxValidationListener$hideHintBox() {
			var target = this._doodad ? this._doodad.validationTarget() : null;
			
			if (hintBoxDOMTarget === target) {
				hintBoxDOMTarget = null;

				this.hintBox().done(function (hbx) { 
					hbx.hide();
				});

				releaseEvent('mousedown');
			}
		}

		, hintList: function HintBoxValidationListener$hintList() {
			var dfd = $.Deferred();

			if (sharedHintList) {
				return dfd.resolve(sharedHintList).promise();
			}

			var self = this;
			doodads.create('/doodads/List.doodad', { cssClass: 'hintlist' }).done(function(cmp) {
				sharedHintList = cmp;
				self.hintBox().done(function (hbx) {
					hbx.addChild(sharedHintList);
				});
				dfd.resolve(sharedHintList);
			});
		
			return dfd.promise();
		}
		, hintBox: function HintBoxValidationListener$hintBox() {
			var dfd = $.Deferred();

			if (sharedHintBox) {
				return dfd.resolve(sharedHintBox).promise();
			}

			doodads.create('/doodads/HintBox.doodad').done(function(cmp) {
				sharedHintBox = cmp;
				sharedHintBox.render($(document.body));	
				dfd.resolve(sharedHintBox);
			});

			return dfd.promise();
		}

		, dispose: function HintBoxValidationListener$dispose(doodad) {
			doodad.unbind('validationApplied', this.onValidationApplied$proxy);
			doodad.unbind('focus', this.onDoodadFocus$proxy);
			doodad.unbind('blur', this.onDoodadBlur$proxy);
		}
	};
	HintBoxValidationListener.prototype.constructor = HintBoxValidationListener;

	doodads.validation.listeners.HintBoxValidationListener = HintBoxValidationListener;
	doodads.validation.registerListener(HintBoxValidationListener);
})();