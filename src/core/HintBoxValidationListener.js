(function ($, undefined) {
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
		hintBoxVisible = false;

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
            var target = this._doodad ? this._doodad.validationTarget() : null;

            if (target) {
                this.hintList().dataSource(this._validationState.messages);
                // set the color
                if (this._validationState.messages.length > 0) {
                    if (this._doodad.valid()) {
                        this.hintBox().element().addClass('infobox');
                    } else {
                        this.hintBox().element().removeClass('infobox');
                    }
                }
            }

            if (!hintBoxVisible) {
                hintBoxVisible = true;

                this.hintBox().show(target,
                    this._doodad._options.hintBoxOrientation || 'bottom right',
                    this._doodad._options.hintBoxDirection || 'down right');

                captureEvent('mousedown', this._doodad.element(), this.onCapturedMouseDown$proxy);
            }
        }
        , hideHintBox: function HintBoxValidationListener$hideHintBox() {
            if (hintBoxVisible) {
                hintBoxVisible = false;

                this.hintBox().hide();

                releaseEvent('mousedown');
            }
        }

        , hintList: function HintBoxValidationListener$hintList() {
            if (!sharedHintList) {
                sharedHintList = doodads.create('/Doodads/List.doodad', { cssClass: 'hintlist' });
                this.hintBox().addChild(sharedHintList);
            }
            return sharedHintList;
        }
        , hintBox: function HintBoxValidationListener$hintBox() {
            if (!sharedHintBox) {
                sharedHintBox = doodads.create('/Doodads/HintBox.doodad');
                sharedHintBox.render($(document.body));
            }
            return sharedHintBox;
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
})(jQuery);