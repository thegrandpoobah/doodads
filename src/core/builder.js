(function() {
	var canonicalizationDiv = null,
		headDom = null,
		cache = {
			types: {},
			waitFunctions: {},
			constructions: {},
			stylesheets: {}
		},
		utils = {
			getResponseFunc: function utils$getResponseFunc(url) {
				///<summary>
				/// Returns the response function associated with a given doodad.
				///</summary>
				///<remarks>
				/// This method is part of the builder infrastructure and should not be used.
				///</remarks>
				return (cache.waitFunctions[utils.canonicalize(url)] || { func : $.noop }).func;
			},
			canonicalize: function utils$canonicalize(url) {
				///<summary>
				/// Creates a absolute url out of the passed in url.
				///</summary>
				///<param name="url" type="String">The URL to canonicalize.</param>
				///<remarks>
				/// from http://grack.com/blog/2009/11/17/absolutizing-url-in-javascript/ by Matt Mastracci
				/// CC by Attribution 3.0
				/// adapted to use one time lazy initialization.
				///</remarks>
				if (!canonicalizationDiv) {
					canonicalizationDiv = document.createElement('div');
				}

				var div = canonicalizationDiv;
				div.innerHTML = '<a></a>';
				div.firstChild.href = url; // Ensures that the href is properly escaped
				div.innerHTML = div.innerHTML; // Run the current innerHTML back through the parser
				return div.firstChild.href;
			},
			require: function utils$require(url) {
				///<summary>
				/// Ensures that the doodad at the specified url is available for usage.
				///</summary>
				///<remarks>
				/// This method is part of the builder infrastructure and should not be used.
				///</remarks>
				var canonUrl = utils.canonicalize(url);

				if (cache.waitFunctions[canonUrl]) {
					return cache.waitFunctions[canonUrl].dfd.promise();
				} else {
					cache.waitFunctions[canonUrl] = {
						func: function(type) {
							var dfd = cache.waitFunctions[canonUrl].dfd;
							cache.types[canonUrl] = type;
							delete cache.waitFunctions[canonUrl];
							dfd.resolve();
						},
						dfd: $.Deferred()
					};

					yepnope(canonUrl);
				
					return cache.waitFunctions[canonUrl].dfd.promise();
				}
			},
			addStylesheet: function utils$addStylesheet(url, byteStream) {
				///<summary>
				/// Associates a stylesheet with a given url, adding the stylesheet to the DOM.
				///</summary>
				///<param name="url" type="String">The URL to associate the stylesheet with.</param>
				///<param name="byteStream" type="String">The CSS stylessheet to add to the DOM</param>
				///<remarks>
				/// This method is part of the builder infrastructure and should not be used.
				///</remarks>
				url = utils.canonicalize(url);

				if (cache.stylesheets[url]) {
					return;
				}

				cache.stylesheets[url] = true;

				if (!headDom) {
					headDom = $('head', document);
				}

				if ($.browser.msie) {
					var joinedResult,
						style$ = $('style#__componentInfrastructure', headDom);

					if (style$.length !== 0) {
						joinedResult = style$.data('stylesheets') + '\n' + byteStream;
						style$.remove();
					} else {
						joinedResult = byteStream;
					}

					$('<style id="__componentInfrastructure" type="text/css">' + joinedResult + '</style>')
						.data('stylesheets', joinedResult)
						.appendTo(headDom);
				} else {
					headDom.append('<style type="text/css">' + byteStream + '</style>');
				}			
			}
		};

	// The builder is a class used by doodad authors to aid in the construction
	// of doodads. An instance of it is returned via the doodads.setup API.
	function builder(name) {
		this.name = name;
		this.setupObject = {
			base: null,
			validates: false,
			defaultOptions: {},
			init: $.noop,
			proto: {},
			templates: {},
			inheritsTemplates: false,
			stylesheets: {},
			statics: {}
		};
	}
	builder.prototype = {
		constructor: function builder$constructor(func) {
			///<summary>
			/// Specifies the constructor function for a doodad (the function that will
			/// be called whenever a doodad is created via the doodad.create API method.
			///</summary>
			///<param name="func">The function to invoke as the constructor</param>
			this.setupObject.init = func;
			
			return this;
		},
		validates: function builder$validates() {
			///<summary>
			/// Calling this function will add validation support to a doodad.
			/// The effects of this function can only be manually reversed (see documentation).
			///</summary>
			this.setupObject.validates = true;
			
			return this;
		},
		defaultOptions: function builder$defaultOptions(defaultOptions) {
			///<summary>
			/// Each doodad has a set of "options" associated with it. This function associates
			/// the default values of those options for a given doodad.
			///</summary>
			///<param name="defaultOptions">A simple property bag that describes the default values</param>
			this.setupObject.defaultOptions = defaultOptions;
			
			return this;
		},
		proto: function builder$proto(proto) {
			///<summary>
			/// Specifies the behaviour of a given doodad using the JS object prototype.
			///</summary>
			///<param name="proto">The prototype object to associate with this doodad</param>
			$.extend(this.setupObject.proto, proto);
			
			return this;
		},
		templates: function builder$templates(templates, inheritsTemplates) {
			///<summary>
			/// Specifies the markup templates (HTML, SVG, MathML, etc.) for a given doodad via the
			/// templates argument. Optionally specifies whether this doodad will inherit the templates
			/// of its super class via the inheritsTemplates argument.
			///</summary>
			///<param name="templates">
			/// Specifies the markup templates via an object bag. The object bag must contain at least member
			/// called "base" if the doodad is using the built in rendering pipeline from the base doodad class.
			///</param>
			///<param name="inheritsTemplates">
			/// An optional boolean value indicating whether the doodad will inherit the templates of its
			/// super class.
			///</param>
			$.extend(this.setupObject.templates, templates);
			
			if (inheritsTemplates) {
				this.setupObject.inheritsTemplates = true;
			}
			
			return this;
		},
		stylesheets: function builder$stylesheets(stylesheets) {
			///<summary>
			/// Specifies the stylesheets for a given doodad via the stylesheets argument.
			///</summary>
			///<param name="stylesheets">
			/// An array of strings (the contents of which is CSS) which are used as the stylesheet for this doodad.
			///</param>
			$.extend(this.setupObject.stylesheets, stylesheets);
			
			return this;
		},
		statics: function builder$statics(statics) {
			///<summary>
			/// A doodad can have a set of static methods associated the class accessible via the doodads.getType API method.
			/// This function specifies those static methods via the statics argument.
			///</summary>
			///<param name="statics">
			/// The set of static methods to associate with the given doodad.
			///</param>
			$.extend(this.setupObject.statics, statics);
			
			return this;
		},
		complete: function builder$complete(callback) {
			///<summary>
			/// Once all of the parameters and properties of a doodad have been set, this function must be invoked so that the
			/// construction can be invoked. Once the construction is finished the callback argument will be invoked if specified.
			///</summary>
			///<param name="callback">
			/// Optional. A function to invoke once the construction is complete.
			/// The first parameter to the callback is the newly constructed doodad class object.
			///</param>
			var setupObject = this.setupObject, 
				baseType = setupObject.base,
				name = this.name,
				key,
				new_doodad;

			new_doodad = function(options, defaultOptions) {
				if (arguments.length === 0) { return; }
				
				baseType.constructor.call(this, $.extend({}, defaultOptions, options), new_doodad.defaultOptions);
				setupObject.init.apply(this, []);
			};
			
			new_doodad.defaultOptions = setupObject.defaultOptions || {};
			new_doodad.defaultOptions.templates = $.extend({}, 
				setupObject.inheritsTemplates ? baseType.constructor.defaultOptions.templates : {},  
				new_doodad.defaultOptions.templates,
				setupObject.templates);
				
			new_doodad.prototype = $.extend(new baseType.constructor(), setupObject.proto);
			new_doodad.prototype.constructor = new_doodad;
			
			if (setupObject.validates) {
				doodads.validation.add(new_doodad);
			}
			
			for (key in setupObject.statics) {
				if (setupObject.statics.hasOwnProperty(key)) {
					new_doodad[key] = setupObject.statics[key];
				}
			}

			for (key in setupObject.stylesheets) {
				if (setupObject.stylesheets.hasOwnProperty(key)) {
					utils.addStylesheet(key, setupObject.stylesheets[key]);
				}
			}
			
			// after everything is done..
			utils.getResponseFunc(name)(new_doodad);
			delete cache.constructions[name];
			
			(callback || $.noop)(new_doodad);
		}
	}

	$.extend(doodads, {
		setup: function doodads$setup(url, definition) {
			///<summary>
			/// Bootstraps the doodad authoring process by associating a proto-doodad with a url and a definition object.
			///</summary>
			///<param name="url">
			/// The url to associate with a given doodad. This url becomes the canonical name for the doodad
			/// and the only way to reference the doodad class after construction. As such, it is the user's responsibility to
			/// ensure that the URL is unique.
			///</param>
			///<param name="definition">
			/// Only used by the server-side builder support code.
			///</param>
			///<returns>
			/// Returns an object with a single member named "inherits" which must be called to continue the bootstrap procedure.
			///</returns>
			///<remarks>
			/// Look at an existing doodad JavaScript file for details on how to use this function.
			///</remarks>
			if (cache.constructions[url]) {
				return cache.constructions[url];
			}
			
			var constructor = new builder(url);
			
			definition = $.extend({
				inheritsTemplates: false,
				templates: null,
				stylesheets: null,
				validates: false
			}, definition);

			if (definition.validates) {
				constructor.validates();
			}

			constructor
				.templates(definition.templates, definition.inheritsTemplates)
				.stylesheets(definition.stylesheets);
			
			cache.constructions[url] = {
				inherits: function(from) {
					var baseDfd = $.Deferred(),
						baseType;
					
					if (from) {
						baseType = doodads.getType(from);
						
						if (!baseType) {
							utils.require(from).done(function() {
								baseDfd.resolve(doodads.getType(from).prototype);
							});
						} else {
							baseDfd.resolve(baseType.prototype);
						}
					} else {
						baseDfd.resolve(doodads.doodad.prototype);
					}
					
					return function(fn) {
						baseDfd.promise().done(function(baseType) {
							constructor.setupObject.base = baseType;
							fn.call(constructor, baseType);
						});
					};
				}
			};
			
			return cache.constructions[url];
		},
		create: function doodads$create(url, options) {
			///<summary>
			/// Instantiates the doodad at the given url with the given options, loading the resource if necessary.
			///</summary>
			///<param name="url">The doodad to load</param>
			///<param name="options">The options to associate with the doodad.</param>
			///<returns>
			/// Since the creation process is asynchronous, this method returns a jQuery.Deferred promise object.
			/// On completion, the argument to the done method is the newly constructed doodad instance.
			///</returns>
			var dfd = $.Deferred(), type = doodads.getType(url);
			
			options = options || {};
			
			if (!type) {
				utils.require(url).done(function() {
					type = doodads.getType(url);
					dfd.resolve(new type(options));
				});
			} else {
				dfd.resolve(new type(options));
			}
			
			return dfd.promise();
		},
		getType: function doodads$getType(url) {
			///<summary>
			/// Returns the class for the given doodad url.
			///</summary>
			///<param name="url">The URL to get the class type from.</param>
			///<returns>
			/// If the doodad resource has been loaded, then returns a JS class object.
			/// If the doodad resource has not been loaded, returns undefined.
			///</returns>
			return cache.types[utils.canonicalize(url)];
		}
	});
})();