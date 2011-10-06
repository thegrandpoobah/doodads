(function($, undefined) {
	// The HintBox validation listener will successfully bind unto any component which has 
	// validation enabled *and* exposes the following interface:
	// * hasInputFocus
	// * validationTarget
	// * focus event
	// * blur event	
	
	// To optimize DOM usage, the HintBox validation listener shares an instance of the
	// hint box and hint list components
    var sharedHintBox,
		sharedHintList,
		sharedHintBoxActiveTarget = null;

	var HintBoxValidationListener = function(component) {
		if (arguments.length === 0) { return; }
		
		this.onValidationApplied$proxy = $.proxy(this.onValidationApplied, this);
		this.onComponentFocus$proxy = $.proxy(this.onComponentFocus, this);
		this.onComponentBlur$proxy = $.proxy(this.onComponentBlur, this);
		this.onCapturedMouseDown$proxy = $.proxy(this.onCapturedMouseDown, this);
		
		$(component)
			.bind('validationApplied', this.onValidationApplied$proxy)
			.bind('focus', this.onComponentFocus$proxy)
			.bind('blur', this.onComponentBlur$proxy);
			
		this._component = null;
		this._validationState = {
			messages: []
			, isValid: true
		};
	}
	HintBoxValidationListener.canListen = function(component) {
		if (component._options.validationListeners.indexOf('hintbox') !== -1 && // the component *wants* the hint-list
			$.isFunction(component.validationTarget)) { // and the component implements the IHintBoxListenerSource interface
			
			return true;
		} else {
			return false;
		}
	}
	HintBoxValidationListener.listen = function(component) {
		return new HintBoxValidationListener(component);
	}
	
	HintBoxValidationListener.prototype = {
		/* BEGIN Event Handlers */
		
		onValidationApplied: function HintBoxValidationListener$onValidationApplied(e, args) {
			this._component = e.target;
			this._validationState = args;
			
			this.setHintBoxVisibility();
		}
		
		, onComponentFocus: function HintBoxValidationListener$onComponentFocus(e) {
			if (e.target._options.validates) {
				if (!e.target.ranValidation()) {
					e.target.validate();
				} else {
					this.setHintBoxVisibility();
				}
			}
		}
		, onComponentBlur: function HintBoxValidationListener$onComponentBlur(e) {
			if (e.target._options.validates) {
				this.hideHintBox();
			}
		}
		, onCapturedMouseDown: function HintBoxValidationListener$onCapturedMouseDown(e) {
            var validationTarget = this._component.validationTarget();
            if (validationTarget && e.originalTarget === validationTarget[0]) return;

            this.hideHintBox();
		}
		
		/* END Event Handlers */
				
		, setHintBoxVisibility: function HintBoxValidationListener$setHintBoxVisibility(component) {
		    if (this._component.hasInputFocus() && (this._validationState.messages || []).length > 0) {
		        this.showHintBox();
		    } else {
		        this.hideHintBox();
		    }			
		}
		, prepareHintBox: function HintBoxValidationListener$prepareHintBox() {
		    var target = this._component.validationTarget();

		    if (!target || sharedHintBoxActiveTarget !== target) {
				return;
			}

		    this.hintList().dataSource(this._validationState.messages);
		    // set the color
		    if (this._validationState.messages.length > 0) {
		        if (this._component.valid()) {
		            this.hintBox().element().addClass('infobox');
		        } else {
		            this.hintBox().element().removeClass('infobox');
		        }
		    }
		}
		, showHintBox: function HintBoxValidationListener$showHintBox() {
            var target = this._component.validationTarget();

            if (!target || sharedHintBoxActiveTarget === target) return;

            sharedHintBoxActiveTarget = target;
            this.prepareHintBox();

            this.hintBox().show(target,
                this._component._options.hintBoxOrientation || 'bottom right',
                this._component._options.hintBoxDirection || 'down right');

            captureEvent('mousedown', this._component.element(), this.onCapturedMouseDown$proxy);		
		}
		, hideHintBox: function HintBoxValidationListener$hideHintBox() {
            var target = this._component ? this._component.validationTarget() : null;

            if (!target || sharedHintBoxActiveTarget !== target) return;

            sharedHintBoxActiveTarget = null;

            this.hintBox().hide();

            releaseEvent('mousedown');
		}
		
        , hintList: function HintBoxValidationListener$hintList() {
            if (!sharedHintList) {
                sharedHintList = Vastardis.UI.Components.Component.create('/Components/List.component', { cssClass: 'hintlist' });
                this.hintBox().addChild(sharedHintList);
            }
            return sharedHintList;
        }
        , hintBox: function HintBoxValidationListener$hintBox() {
            if (!sharedHintBox) {
                sharedHintBox = Vastardis.UI.Components.Component.create('/Components/HintBox.component');
                sharedHintBox.render($(document.body));
            }
            return sharedHintBox;
        }
		
		, dispose: function HintBoxValidationListener$dispose(component) {
			$(component)
				.unbind('validationApplied', this.onValidationApplied$proxy)
				.unbind('focus', this.onComponentFocus$proxy)
				.unbind('blur', this.onComponentBlur$proxy);
		}		
	};
	HintBoxValidationListener.prototype.constructor = HintBoxValidationListener;
	
	$.extend(true, window, { Vastardis: { UI: { Components: { ValidationListeners: { HintBoxValidationListener: HintBoxValidationListener}}}}});
	Vastardis.UI.Components.Component.registerValidationListener(HintBoxValidationListener);
})(jQuery);