(function() {
		// determines how long the validator waits for an async rule to callback before
		// showing the user a message.
	var ASYNC_GRACE_PERIOD = 100,
		// The list of methods to override on the prototype to get correct behaviour
		OVERRIDEMETHODS = ['valid', 'validationContext', 'isValidationContextEmpty', 'dispose'];
		
	var validationListeners = [];
		

	doodads.validation = { 
		listeners: {}, // namespace for the validation listeners

		add: function validation$add(doodad) {
			///<summary>
			/// Adds validation support on to the given doodad object.
			///</summary>
			///<param name="doodad">The doodad to add validation support onto</param>
			$.each(OVERRIDEMETHODS, function (index, item) {
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

		remove: function validation$remove(doodad) {
			///<summary>
			/// Removes validation support from the given doodad object.
			///</summary>
			///<param name="doodad">The doodad to remove validation support from</param>
			for (key in Validator) {
				doodad[key] = doodad.__validator[key];
			}

			$.each(OVERRIDEMETHODS, function (index, item) {
				var prototypeFunction = '_prototype_' + item;
				doodad[item] = doodad[prototypeFunction];
				delete doodad[prototypeFunction];
				doodad[prototypeFunction] = undefined;
			});
		},

		registerListener : function valdation$registerListener(listener) {
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

	// The validator class gets mixed with the doodad class using the doodads.validation.add method
	// In the vast majority of cases, this is done automatically via the doodads.setup family of functions.
	Validator = {
		addRule: function Validator$addRule(value) {
			///<summary>
			/// Adds a rule to the list of rules the doodad must validate against. Can optionally add a set of rules if the
			/// passed in "value" argument is an array.
			/// The context is provided by the "validationContext" function.
			///</summary>
			///<param name="rule" type="function|[function]">
			/// A single rule or an array of rules.
			/// A rule is a function that has the following signature:
			///
			///  function(context, args)
			///
			/// where "context" is the validation context of the doodad
			/// and "args" is an object containing methods and flags for advanced validation rules.
			/// The return value of the function is an object that matches the following "schema":
			///
			///  * message (type="String"):  The message to display in the hintbox.
			///  * valid (type="Boolean"): States whether the context is valid.
			///  * alwaysShow (type="Boolean", optional="true"):  If true, the message will appear in the hintbox even if valid is false.
			///</param>
			///<remarks>
			/// Each doodad has a set of pre-built rules that can be used for the common validation cases. These are each
			/// documented with their respective doodad.
			///</remarks>
			this._rules = $.merge(this._rules || [], $.isArray(value) ? value : [value]);
			
			this.validate();
		}
		, addCallout: function Validator$addCallout(doodad) {
			///<summary>
			/// Adds a callout to the list of callouts the doodad must invoke when validating its context. Can optionally add a 
			/// set of callouts if the passed in "doodad" argument is an array.
			///
			/// A callout is another doodad that will invoke validate after this doodad validates. The purpose of callouts is to
			/// aid in building a validation graph for each set of doodads on a page.
			///</summary>
			///<param name="doodad" type="doodad|[doodad]">
			/// A single doodad or an array of doodads.
			///</param>
			this._callouts = $.merge(this._callouts || [], $.isArray(doodad) ? doodad : [doodad]);
		}
		, ranValidation: function Validator$ranValidation() {
			///<summary>
			/// Determines if validation has ever been invoked on this doodad.
			///</summary>
			return this._ranValidation;
		}
		, valid: function Validator$valid() {
			if (arguments.length === 0 && this._source && !this._ranValidation) {
				this.validate();
			}
			return this._prototype_valid.apply(this, arguments);
		}

		, isValidationContextEmpty: function Validator$isValidationContextEmpty(context) {
			///<summary>
			/// Determines if the validation context for a doodad should be considered "empty" or not
			/// This is doodad specific and must be overridden by doodads to provide the correct functionality.
			///</summary>
			///<remarks>
			/// By default, the validation context for a doodad is considered empty if it is null or the empty string.
			///</remarks>
			if (this._prototype_isValidationContextEmpty) {
				return this._prototype_isValidationContextEmpty.apply(this, arguments);
			} else {
				return (context === null || context === '');
			}
		}
		, validationContext: function Validator$validationContext() {
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

		, validate: function Validator$validate(/*traversalHistory*/) {
			///<summary>
			/// Validates this doodad's validation context against the set of rules associated with it.
			/// Optionally triggers the validate function of other doodad's if they are part of the callout
			/// list for this doodad.
			///</summary>
			var context = this.validationContext(),
				traversalHistory = arguments[0],
				passId,
				hasAsync = false,
				self = this,
				callback = function(result) {
					privateMethods.ruleCallback.call(self, result, passId, traversalHistory || [self]);
				};
				
			this._backList = [];

			if (this._validationSuspended) {
				return;
			}
			
			if (!this.required() && this.isValidationContextEmpty(context)) {
				this._computedValidity = true;
				privateMethods.afterRulesRan.call(this, traversalHistory || [this]);
				return;
			}

			this._computedValidity = true;
			this._ranValidation = true;
			this._pendingRules = (this._rules || []).length;
			passId = this._passId = (this._passId || 0) + 1;

			$.each(this._rules || [], function () {
				var result = this(context, {
					computedValidity: self._computedValidity,
					isCallout: traversalHistory ? true : false,
					callback: callback,
					callee: self
				});

				if (!result.async) {
					callback(result);
				} else {
					hasAsync = true;
				}
			});

			if (hasAsync) {
				window.setTimeout(function () {
					if (self._pendingRules === 0 || passId !== self._passId) {
						return;
					}

					self._backList.push({ text: 'Validating...', isAsync: true });
					privateMethods.trigger_validationApplied.call(self);
				}, ASYNC_GRACE_PERIOD);
			}

			privateMethods.afterRulesRan.call(this, traversalHistory || [this]);
		}
		, required: function Validator$required(/*isRequired, requirementRule*/) {
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
			///		The rule the doodad must validate its context against
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
						privateMethods.removeRequirementRule.call(this);
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
					privateMethods.removeRequirementRule.call(this);
				}

				$(this).trigger('required');

				this.validate();
			}
		}
		, suspendValidation: function Validator$suspendValidation() {
			///<summary>Temporarily stops the validation code from triggering</summary>
			this._validationSuspended = true;
		}
		, resumeValidation: function Validator$resumeValidation() {
			///<summary>Re-enables validation code and forces a validation event to run</summary>
			this._validationSuspended = false;
			this.validate();
		}

		, _initializeValidationListeners: function Validator$_initializeValidationListeners() {
			///<summary>
			/// PRIVATE METHOD: Initializes the set of validation listeners for this doodad.
			///</summary>
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

		, getValidationListener: function Validator$getValidationListener(type) {
			///<summary>
			/// Given a class type, returns the validation listener associated with this doodad
			/// that matches that class type if it exists.
			///</summary>
			///<param name="type">
			/// A class type to retrieve.
			///</param>
			///<returns type="object">
			/// A validation listener object or undefined if none could be found.
			///</returns>
			var listener;

			$.each(this._listeners, function () {
				if (this instanceof type) {
					listener = this;
					return false; // break;
				}
			});

			return listener;
		}
		
		, dispose: function Validator$dispose() {
			privateMethods.tearDownValidationListeners.call(this);

			return this._prototype_dispose.apply(this, arguments);
		}
	};

	var privateMethods = {
		tearDownValidationListeners: function Validator$tearDownValidationListeners() {
			///<summary>
			/// Disposes of all validation listeners as necessary
			///</summary>
			$.each(this._listeners || [], function () {
				this.dispose();
			});
		}

		, ruleCallback: function Validator$ruleCallback(result, passId, traversalHistory) {
			///<summary>
			/// Called after each rule has executed.
			///</summary>
			if (this._passId !== passId) {
				return;
			}

			var messages, backList = this._backList;

			this._pendingRules--;

			// if result.message is not an array, turn it into an array
			if (!$.isArray(result.message)) {
				messages = [result.message];
			} else {
				messages = result.message;
			}

			if (!result.valid || result.alwaysShow) {
				$.each(messages, function (i, msg) {
					if (msg && msg !== '') {
						backList.push({ text: msg });
					}
				});
			}
			if (!result.valid) {
				this._computedValidity = false;
			}

			privateMethods.afterRulesRan.call(this, traversalHistory);
		}
		, afterRulesRan: function Validator$afterRulesRan(traversalHistory) {
			///<summary>
			/// Called after all the rules in the validation set have ran.
			///</summary>
			if (this._pendingRules !== 0) {
				return;
			}
			
			this._backList = $.map(this._backList, function (e, i) {
				if (!e.isAsync) {
					return e;
				}
			});

			this._valid(this._computedValidity);

			$.each(this._callouts || [], function (i, callout) {
				var calloutInHistory = false;
				$.each(traversalHistory, function (j, historyObject) {
					if (callout === historyObject) {
						calloutInHistory = true;
						return false; // break
					}
				});

				if (!calloutInHistory) {
					callout.validate($.merge(traversalHistory, [callout]));
				}
			});

			privateMethods.trigger_validationApplied.call(this);
		}
		, removeRequirementRule: function Validator$removeRequirementRule() {
			var requirementRule = this._requirementRule;
			
			this._rules = $.map(this._rules || [], function (rule) {
				if (rule !== requirementRule) {
					return rule;
				}
			});
		}
		, trigger_validationApplied: function Validator$trigger_validationApplied() {
			///<summary>
			/// Triggers the validationApplied event
			///</summary>
			this.trigger('validationApplied', {
				messages: this._backList,
				isValid: this._computedValidity
				/* possibly others */
			});
		}
	};
})();