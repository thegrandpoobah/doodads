/* The MIT License

Copyright (c) 2011 Vastardis Capital Services, http://www.vastcap.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function ($) {
    $.extend(true, window, { Vastardis: { UI: { Components: {}}} });

    // namespace alias
    var vsc = Vastardis.UI.Components;

    vsc.Component.addValidationAPI = function (component) {
        $.each(['valid', 'validationContext', 'isValidationContextEmpty', 'dispose'], function (index, item) {
            component.prototype['_prototype_' + item] = component.prototype[item];
        });

        component.prototype.__validator = {};
        for (var key in Validator) {
            component.prototype.__validator[key] = component.prototype[key];
        }

        $.extend(component.prototype, Validator);
        component.defaultOptions = $.extend({
            validates: true
			, validationListeners: 'hintbox'
        }, component.defaultOptions);
    }

    vsc.Component.removeValidationAPI = function (component) {
        for (key in Validator) {
            component[key] = component.__validator[key];
        }

        $.each(['valid', 'validationContext', 'isValidationContextEmpty', 'dispose'], function (index, item) {
            var prototypeFunction = '_prototype_' + item;
            component[item] = component[prototypeFunction];
            delete component[prototypeFunction];
            component[prototypeFunction] = undefined;
        });
    }

    // determines how long the validator waits for an async rule to callback before
    // showing the user a message.
    var ASYNC_GRACE_PERIOD = 100;

    Validator = {
        addRule: function (value) {
            ///	<summary>
            ///		Adds a rule to the list of rules the component must validate its context against.  The context is provided by "validationContext()"
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
            ///		NOTE: When "alwaysShow" is set to true, the hintbox will always be displayed (when the component hasInputFocus() == true)
            ///	</remarks>
            /// <param name="rule" type="Object|[Object]">A single rule or an array of rules</param>

            this._rules = $.merge(this._rules || [], value instanceof Array ? value : [value]);
        }
		, addCallout: function (component) {
		    this._callouts = $.merge(this._callouts || [], component instanceof Array ? component : [component]);
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
		    /// A JS object representation of the properties of this component that are needed
		    /// to test validity.
		    ///</summary>
		    ///<remarks>
		    /// It is the responsibility of the component author to correctly expose a validationContext
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
                    if (this._pendingRules === 0) return;

                    this._backList.push({ text: 'Validating...', isAsync: true });
                    privateMethods.trigger_validationApplied.call(this);
                }, this), ASYNC_GRACE_PERIOD);
            }

            privateMethods.afterRulesRan.call(this, traversalHistory || [this]);
        }
        , required: function (/*isRequired, requirementRule*/) {
            /// <summary>
            ///		1: required() - Indicates whethere the component is required or not.
            ///		2: required(true, function(){...}) - Sets the component to required, and adds the requirement rule.
            ///		3: required(true) - Set the component to required.
            ///		4: required(false) - Set the component to not required.
            /// </summary>
            /// <remarks>
            ///		If required() is called for the first time with isRequired being true, then requirementRule must be provided.
            /// </remarks>
            /// <param name="isRequired" type="Boolean" />
            /// <param name="requirementRule" type="function" optional="true">
            ///		The rule the component must validate its context against/
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
		    for (i = 0, n = validationListeners.length; i < n; ++i) {
		        listener = validationListeners[i];

		        if (listener.canListen(this)) {
		            this._listeners = this._listeners || [];
		            this._listeners.push(listener.listen(this));
		        }
		    }
		}

		, dispose: function () {
		    privateMethods.tearDownValidationListeners.call(this);

		    return this._prototype_dispose.apply(this, arguments);
		}
    };

    var privateMethods = {
        tearDownValidationListeners: function () {
            $.each(this._listeners, function () {
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
		    if (Object.prototype.toString.call(result.message) !== '[object Array]') {
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
		    $(this).trigger('validationApplied', {
		        messages: this._backList
				, isValid: this._computedValidity
		        /* possibly others */
		    });
		}
    }

    var validationListeners = [];
    vsc.Component.registerValidationListener = function (listener) {
        ///<summary>
        /// Adds a Validation Listener to the validation listener registry.
        /// Validation Listeners perform an action after every execution of the validate function
        /// Typically, listeners modify the DOM to reflect the invalid state of a component.
        ///</summary>
        ///<param name="listener">
        /// The Validation Listener to add to the registry
        /// The listener is a type with the following static methods:
        ///  * canListen(component): determines if the listener is compatible with the given component
        ///  * listen(component): hook unto the validation infrastructure to receive notifications on validation changes
        ///</param>
        validationListeners.push(listener);
    }

    // Validation Rules
    var ValidationRules = {};

    ValidationRules.Regex = function (regex, message) {
        this.validate = function (text) {
            return {
                message: message
				, valid: regex.test(text)
            };
        };
    }

    ValidationRules.Regex.Predefined = {
        Number: function (message) {
            return new ValidationRules.Regex(ValidationRules.Regexes.Number, message);
        }
		, PositiveNumber: function (message) {
		    return new ValidationRules.Regex(ValidationRules.Regexes.PositiveNumber, message);
		}
		, Percentage: function (message) {
		    return new ValidationRules.Regex(ValidationRules.Regexes.Percentage, message);
		}
		, Date: function (message) {
		    return new ValidationRules.Regex(ValidationRules.Regexes.Date, message);
		}
		, Email: function (message) {
		    return new ValidationRules.Regex(ValidationRules.Regexes.Email, message);
		}
    }

    ValidationRules.Regexes = {
        Number: /^\-?([1-9]{1}[0-9]{0,2}(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))$|^\-?([1-9]{1}\d*(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))$|^\(([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))\)$/
		, PositiveNumber: /^([1-9]{1}[0-9]{0,2}(\,\d{3})*(\.\d{1,})?|[1-9]{1}\d{0,}(\.\d{1,})?|0(\.\d{1,})?|(\.\d{1,}))$|^([1-9]{1}\d*(\,\d{3})*(\.\d{1,})?|[1-9]{1}\d{0,}(\.\d{1,})?|0(\.\d{1,})?|(\.\d{1,}))$|^\(([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{1,})?|[1-9]{1}\d{0,}(\.\d{1,})?|0(\.\d{1,})?|(\.\d{1,}))\)$/
		, Percentage: /^(100|100\.0*)\%?$|^([1-9]{1}[0-9]{1}(\.\d{0,})?\%?|[1-9]{1}(\.\d{0,})?\%?|0(\.\d{0,})?\%?|(\.\d{0,}))\%?$|^([1-9]{1,2}(\.\d{0,})?\%?|[1-9]{1}(\.\d{1,})?\%?|0(\.\d{0,})?\%?|(\.\d{0,}))$|^([1-9]{1}\d{0,1}(\.\d{0,})?\%?|0(\.\d{0,})?\%?|(\.\d{0,}))$/
		, Date: /^(?=\d)(?:(?:(?:(?:(?:0?[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0?[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})|(?:0?2(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))|(?:(?:0?[1-9])|(?:1[0-2]))(\/|-|\.)(?:0?[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2}))($|\ (?=\d)))?(((0?[1-9]|1[012])(:[0-5]\d){0,2}(\ [AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2})?$/
		, Email: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
    }

    vsc.ValidationRules = ValidationRules;

})(jQuery);
