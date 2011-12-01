(function() {
	// determines how long the validator waits for an async rule to callback before
	// showing the user a message.
	var ASYNC_GRACE_PERIOD = 100;

	var validationListeners = [],
		overrideMethods = ['valid', 'validationContext', 'isValidationContextEmpty', 'dispose'];

	doodads.validation = { 
		listeners: {}, // namespace for the validation listeners

		add: function (doodad) {
			$.each(overrideMethods, function (index, item) {
				doodad.prototype['_prototype_' + item] = doodad.prototype[item];
			});

			doodad.prototype.__validator = {};
			for (var key in Validator) {
				doodad.prototype.__validator[key] = doodad.prototype[key];
			}

			$.extend(doodad.prototype, Validator);
			doodad.defaultOptions = $.extend({
				validates: true
				, validationListeners: 'hintbox'
			}, doodad.defaultOptions);
		},

		remove: function (doodad) {
			for (key in Validator) {
				doodad[key] = doodad.__validator[key];
			}

			$.each(overrideMethods, function (index, item) {
				var prototypeFunction = '_prototype_' + item;
				doodad[item] = doodad[prototypeFunction];
				delete doodad[prototypeFunction];
				doodad[prototypeFunction] = undefined;
			});
		},

		registerListener : function (listener) {
			///<summary>
			/// Adds a Validation Listener to the validation listener registry.
			/// Validation Listeners perform an action after every execution of the validate function
			/// Typically, listeners modify the DOM to reflect the invalid state of a doodad.
			///</summary>
			///<param name="listener">
			/// The Validation Listener to add to the registry
			/// The listener is a type with the following static methods:
			///  * canListen(doodad): determines if the listener is compatible with the given doodad
			///  * listen(doodad): hook unto the validation infrastructure to receive notifications on validation changes
			///</param>
			validationListeners.push(listener);
		}
	};

	Validator = {
		addRule: function (value) {
			///	<summary>
			///		Adds a rule to the list of rules the doodad must validate its context against.  The context is provided by "validationContext()"
			///	</summary>
			///	<remarks>
			///		To create a new rule, one can simply use the already defined available rules in the "ValidationRules" namespace.  
			///
			///		Alternatively, a new rule can be created by defining a new object.  This object must contain 
			///		a "validate" function, itself receiving as (optional) parameter the current context, and which
			///		returns an object literal defined as:
			///
			///			- message (type="String"):  The message to display in the hintbox.
			///			- valid (type="Boolean"): States whether the context is valid.
			///			- alwaysShow (type="Boolean", optional="true"):  If true, the message will appear in the hintbox even if valid is false.
			///
			///		NOTE: When "alwaysShow" is set to true, the hintbox will always be displayed (when the doodad hasInputFocus() == true)
			///	</remarks>
			/// <param name="rule" type="Object|[Object]">A single rule or an array of rules</param>

			this._rules = $.merge(this._rules || [], $.isArray(value) ? value : [value]);
		}
		, addCallout: function (doodad) {
			this._callouts = $.merge(this._callouts || [], $.isArray(doodad) ? doodad : [doodad]);
		}
		, ranValidation: function () {
			return this._ranValidation;
		}
		, valid: function () {
			if (arguments.length === 0 && this._source && !this._ranValidation) {
				this.validate();
			}
			return this._prototype_valid.apply(this, arguments);
		}

		, isValidationContextEmpty: function (context) {
			if (this._prototype_isValidationContextEmpty) {
				return this._prototype_isValidationContextEmpty.apply(this, arguments);
			} else {
				return (context === null || context === '');
			}
		}
		, validationContext: function () {
			///<summary>
			/// A JS object representation of the properties of this doodad that are needed
			/// to test validity.
			///</summary>
			///<remarks>
			/// It is the responsibility of the doodad author to correctly expose a validationContext
			/// object bag to the validation infrastructure.
			///</remarks>
			if (this._prototype_validationContext) {
				return this._prototype_validationContext.apply(this, arguments);
			} else {
				return null;
			}
		}

		, validate: function (/*traversalHistory*/) {
			///<summary>
			///
			///</summary>
			var context = this.validationContext();
			var traversalHistory = arguments[0];
			this._backList = [];

			if (this._validationSuspended) {
				return;
			} else if (!this.required() && this.isValidationContextEmpty(context)) {
				// By-pass validation
				this._computedValidity = true;
				privateMethods.afterRulesRan.call(this, traversalHistory || [this]);
				return;
			}

			this._computedValidity = true;
			this._ranValidation = true;
			this._pendingRules = (this._rules || []).length;
			this._passId = (this._passId || 0) + 1;

			var passId = this._passId;
			var hasAsync = false;
			var callback = $.proxy(function (result) {
				privateMethods.ruleCallback.call(this, result, passId, traversalHistory || [this]);
			}, this);

			$.each(this._rules || [], $.proxy(function (index, rule) {
				var result = rule.validate(context, {
					computedValidity: this._computedValidity,
					isCallout: traversalHistory ? true : false,
					callback: callback,
					callee: this
				});

				if (!result.async) {
					callback(result);
				} else {
					hasAsync = true;
				}
			}, this));

			if (hasAsync) {
				setTimeout($.proxy(function () {
					if (this._pendingRules === 0 || passId !== this._passId) return;

					this._backList.push({ text: 'Validating...', isAsync: true });
					privateMethods.trigger_validationApplied.call(this);
				}, this), ASYNC_GRACE_PERIOD);
			}

			privateMethods.afterRulesRan.call(this, traversalHistory || [this]);
		}
		, required: function (/*isRequired, requirementRule*/) {
			/// <summary>
			///		1: required() - Indicates whethere the doodad is required or not.
			///		2: required(true, function(){...}) - Sets the doodad to required, and adds the requirement rule.
			///		3: required(true) - Set the doodad to required.
			///		4: required(false) - Set the doodad to not required.
			/// </summary>
			/// <remarks>
			///		If required() is called for the first time with isRequired being true, then requirementRule must be provided.
			/// </remarks>
			/// <param name="isRequired" type="Boolean" />
			/// <param name="requirementRule" type="function" optional="true">
			///		The rule the doodad must validate its context against/
			///	</param>
			/// <returns type="Bool" />

			if (arguments.length === 0) {
				return this._required;
			} else {
				if (this._required === arguments[0] &&
					(arguments.length === 1 || (arguments.length === 2 && this._requirementRule === arguments[1]))) {
					return;
				}

				this._required = arguments[0];

				if (this._required && arguments[1]) {
					// if transitioning to required and a new requirement rule is passed in
					// then override the existing (or add a new) requirement rule
					if (this._requirementRule) {
						this._rules = $.map(this._rules || [], $.proxy(function (rule, index) {
							if (rule !== this._requirementRule) {
								return rule;
							}
						}, this));
					}
					this._requirementRule = arguments[1]; // store
					this.addRule(this._requirementRule);
				} else if (this._required && !arguments[1]) {
					// if transitioning to required and no new requirement rule is given, then 
					// use the existing requirement rule if available
					if (!this._requirementRule) {
						// this is an error
						//throw 'No Requirement Rule defined.';
					} else {
						this.addRule(this._requirementRule);
					}
				} else if (!this._required) {
					// if transitioning to not required, then remove the requirement rule
					this._rules = $.map(this._rules || [], $.proxy(function (rule, index) {
						if (rule !== this._requirementRule) {
							return rule;
						}
					}, this));
				}

				$(this).trigger('required');

				this.validate();
			}
		}
		, suspendValidation: function () {
			///<summary>Temporarily stops the validation code from triggering</summary>
			this._validationSuspended = true;
		}
		, resumeValidation: function () {
			///<summary>Re-enables validation code and forces a validation event to run</summary>
			this._validationSuspended = false;
			this.validate();
		}

		, _initializeValidationListeners: function () {
			var i, n, listener;

		    this._listeners = [];
		    privateMethods.tearDownValidationListeners.call(this);				

			for (i = 0, n = validationListeners.length; i < n; ++i) {
				listener = validationListeners[i];

				if (listener.canListen(this)) {
					this._listeners.push(listener.listen(this));
				}
			}
		}

		, getValidationListener: function (type) {
			var listener;

			$.each(this._listeners, function () {
				if (this instanceof type) {
					listener = this;
					return false; // break;
				}
			});

			return listener;
		}
		
		, dispose: function () {
			privateMethods.tearDownValidationListeners.call(this);

			return this._prototype_dispose.apply(this, arguments);
		}
	};

	var privateMethods = {
		tearDownValidationListeners: function () {
			$.each(this._listeners || [], function () {
				this.dispose();
			});
		}

		, ruleCallback: function (result, passId, traversalHistory) {
			if (this._passId !== passId) {
				return;
			}

			this._pendingRules--;

			// if result.message is not an array, turn it into an array
			var messages;
			if ($.isArray(result.message)) {
				messages = [result.message];
			} else {
				messages = result.message;
			}

			var self = this;
			if (result.alwaysShow) {
				$.each(messages, function (index, message) {
					self._backList.push({ text: message });
				});
			} else if (!result.valid) {
				$.each(messages, function (index, message) {
					if (message && message !== '') {
						self._backList.push({ text: message });
					}
				});
				this._computedValidity = false;
			}

			privateMethods.afterRulesRan.call(this, traversalHistory);
		}
		, afterRulesRan: function (traversalHistory) {
			if (this._pendingRules === 0) {
				this._backList = $.map(this._backList, function (e, i) {
					if (!e.isAsync) return e;
				});

				this._valid(this._computedValidity);

				$.each(this._callouts || [], $.proxy(function (index, callout) {
					var calloutInHistory = false;
					$.each(traversalHistory, function (index, historyObject) {
						if (callout === historyObject) {
							calloutInHistory = true;
							return false; // break
						}
					});

					if (!calloutInHistory) {
						callout.validate($.merge(traversalHistory, [callout]));
					}
				}, this));

				privateMethods.trigger_validationApplied.call(this);
			}
		}
		, trigger_validationApplied: function () {
			this.trigger('validationApplied', {
				messages: this._backList
				, isValid: this._computedValidity
				/* possibly others */
			});
		}
	}
})();