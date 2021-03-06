/*jshint browser:true, jquery:true */
/*global doodads:true, Mustache:true */

(function() {
	/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true, undef:true, unused:true, smarttabs:true, newcap:false */
	
	'use strict';
	
	var canonicalizationDiv = null,
		headDom = null,
		guid = 0,
		cache = {
			types: {},
			stylesheets: {}
		},
		pendingConstructions = {},
		activeConstruction = null,
		utils = {
			load: function utils$load(url, callback) {
				// This code block is basically a simplication of Julian Aubourg's jQuery JSONP script load
				// implementation: https://github.com/jaubourg/jquery-jsonp/blob/master/src/jquery.jsonp.js
				// As such, it is used under the MIT License.
				var script = $('<script>')[0], 
					head = $('head')[0] || document.documentElement,
					scriptAfter;
				
				script.id = 's_' + guid++;
				
				if (window.opera && window.opera.version() < 11.60) {
					scriptAfter = $('<script>')[0];
					scriptAfter.text = 'document.getElementById(\'' + script.id + '\').onerror()';
				} else {
					script.async = 'async';
				}
				
				// IE is special.. in so many ways:
				// http://msdn.microsoft.com/en-us/library/ms533746(VS.85).aspx
				if ('onreadystatechange' in script) {
					script.event = 'onclick';
					script.htmlFor = script.id;
				}
				
				script.onload = script.onerror = script.onreadystatechange = function() {
					if (!script.readyState || !/i/.test(script.readyState)) {
						try {
							if (script.onclick) {
								script.onclick();
							}
						} catch (_) {}

						head.removeChild(script);
						if (scriptAfter) {
							head.removeChild(scriptAfter);
						}
						script.onload = script.onerror = script.onreadystatechange = null;
						
						callback();
					}
				};
				
				script.src = url;
				
				head.insertBefore(script, head.firstChild);
				if (scriptAfter) {
					head.insertBefore(scriptAfter, head.firstChild);
				}
			},
			canonicalize: function utils$canonicalize(url) {
				///<summary>
				/// Creates an absolute url out of the passed in url.
				///</summary>
				///<param name="url" type="String">The URL to canonicalize.</param>
				///<remarks>
				/// from http://grack.com/blog/2009/11/17/absolutizing-url-in-javascript/ by Matt Mastracci
				/// CC by Attribution 3.0
				/// adapted to use one time lazy initialization.
				///</remarks>
				var parts = url.split(':'), 
					repo;
					
				repo = doodads.config.repositories[parts[0]];
				if (parts.length === 2 && repo) {
					url = repo + parts[1];
				}
				
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
				var canonUrl = utils.canonicalize(url), dfd;

				dfd = pendingConstructions[canonUrl];
				if (!dfd) {
					dfd = pendingConstructions[canonUrl] = $.Deferred().done(function(type) {
						cache.types[canonUrl] = type;
						delete pendingConstructions[canonUrl];
					});
					
					utils.load(canonUrl, function() {
						/*jshint devel:true */
						var aC = activeConstruction;
						activeConstruction = null;
						
						if (!aC) {
							console.error('Unable to load doodad from url:' + canonUrl);
							return;
						}
						aC.scriptLoaded(canonUrl, dfd);
						aC = null;
					});
				}
				
				return dfd.promise();
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
						style$ = $('style#__doodads', headDom);

					if (style$.length !== 0) {
						joinedResult = style$.data('stylesheets') + '\n' + byteStream;
						style$.remove();
					} else {
						joinedResult = byteStream;
					}

					$('<style id="__doodads" type="text/css">' + joinedResult + '</style>')
						.data('stylesheets', joinedResult)
						.appendTo(headDom);
				} else {
					headDom.append('<style type="text/css">' + byteStream + '</style>');
				}
			}
		};
		
	// The builder is a class used by doodad authors to aid in the construction
	// of doodads. An instance of it is returned via the doodads.setup API.
	var builder = function() {
		// this.name = '/url/to/doodad'; // this field is automatically populated once the scripts load
		this.loadDfd = $.Deferred();
		this.setupObject = {
			base: null,
			validates: false,
			defaultOptions: {},
			init: $.noop,
			proto: {},
			templates: null,
			inheritsTemplates: false,
			stylesheets: {},
			statics: {}
		};
	};
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
			if (templates) {
				this.setupObject.templates = $.extend(this.setupObject.templates || {}, templates);
			}
			
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
		type: function builder$type() {
			///<summary>
			/// Returns a reference to the class for the doodad that is currently being constructed.
			/// This is useful for getting at defaultOptions and statics from inside the js file for the doodad itself
			///</summary>
			return doodads.getType(this.name);
		},
		complete: function builder$complete() {
			///<summary>
			/// Once all of the parameters and properties of a doodad have been set, this function must be invoked so that the
			/// doodad construction can be finalized.
			/// specified.
			///</summary>
			var setupObject = this.setupObject, 
				baseType = setupObject.base,
				key,
				new_doodad;

			new_doodad = function(options, defaultOptions) {
				if (arguments.length === 0) { return; }
				
				baseType.constructor.call(this, $.extend({}, defaultOptions, options), new_doodad.defaultOptions);
				setupObject.init.apply(this, []);
			};
			
			new_doodad.defaultOptions = setupObject.defaultOptions || {};
			if (new_doodad.defaultOptions.templates || setupObject.templates) {
				new_doodad.defaultOptions.templates = $.extend({}, 
					setupObject.inheritsTemplates ? baseType.constructor.defaultOptions.templates : {},  
					new_doodad.defaultOptions.templates,
					setupObject.templates);
			}
			
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
			this.completionDfd.resolve(new_doodad);
		},
		
		whenLoaded: function builder$whenLoaded() {
			return this.loadDfd.promise();
		},
		scriptLoaded: function builder$scriptLoaded(url, completionDfd) {
			this.name = url;
			this.completionDfd = completionDfd;
			
			this.loadDfd.resolve();
		}
	};

	$.extend(doodads, {
		setup: function doodads$setup(inheritsFrom, args) {
			///<summary>
			/// Bootstraps the doodad authoring process by associating a proto-doodad with an existing base doodad (or the root
			/// doodad object if no inheritsFrom parameter is given).
			///</summary>
			///<param name="inheritsFrom">
			/// Optional. The URL of a doodad to use as the base class for the newly constructed doodad.
			/// If not provided, the base class of the doodad will be the root doodad class.
			///</param>
			///<param name="args">
			/// Array. Optional. A list of arguments to pass to the setup callback function.
			///</param>
			///<returns>
			/// Returns a function which takes a callback parameter which must be called immediately. The callback
			/// has the following signature: function(builder, base/*, args */) where 
			///   * builder is the doodad builder class
			///   * base is the type of the superclass.
			///   * args is the arguments passed through the setup function
			///</returns>
			///<example>doodads.setup()(function(builder, base) {});</example>
			///<example>doodads.setup([jQuery])(function(builder, base, $) {});</example>
			///<example>doodads.setup('/path/to/doodad.doodad')(function(builder, base) {});</example>
			///<example>doodads.setup('/path/to/doodad.doodad', [jQuery])(function(builder, base, $) {});</example>
			///<remarks>
			/// Look at an existing doodad JavaScript file for details on how to use this function.
			///</remarks>
			if ($.isArray(inheritsFrom)) {
				args = inheritsFrom;
				inheritsFrom = undefined;
			}
			
			activeConstruction = new builder();
			var constructor = activeConstruction,
				definition = $.extend({
					templates: null,
					stylesheets: null
				}, doodads.setup.definition);
			delete doodads.setup.definition; // doodads.setup.definition is optionally populated by the server side builders
			
			return function(fn) {
				$.when(doodads.load(inheritsFrom), constructor.whenLoaded()).done(function(baseType) {
					constructor
						.templates(definition.templates)
						.stylesheets(definition.stylesheets);

					baseType = baseType.prototype;
					constructor.setupObject.base = baseType;
					
					fn.apply(null, $.merge([constructor, baseType], args || []));
				});
			};
		},
		setupMixin: function doodads$setupMixin(args) {
			var constructor;
			constructor = activeConstruction = {
				loadDfd: $.Deferred(),
				whenLoaded: function() { 
					return this.loadDfd.promise();
				},
				scriptLoaded: function(url, completionDfd) {
					this.completionDfd = completionDfd;
					this.loadDfd.resolve();
				}
			};
			
			return function(fn) {
				constructor.whenLoaded().done(function() {
					constructor.completionDfd.resolve({ setupFn: fn, args: args });
				});
			};
		},
		load: function doodads$load(url) {
			///<summary>
			/// Primes the doodad type cache with an entry for the doodad at the given url.
			///</summary>
			///<param name="url">(Optional) The url to prime the cache with</param>
			///<returns>
			/// Since the creation process is (potentially) asynchronous, this method returns a jQuery.Deferred promise object.
			/// On completion, the argument to the done method is the type of the doodad at the given url.
			///</returns>
			var dfd = $.Deferred(),
				type = doodads.getType(url);
				
			if (!type) {
				utils.require(url).done(function() {
					type = doodads.getType(url);
					dfd.resolve(type);
				});
			} else {
				dfd.resolve(type);
			}
			
			return dfd.promise();
		},
		create: function doodads$create(url, mixinUrl, options) {
			///<summary>
			/// Instantiates the doodad at the given url with the given options, loading the resource if necessary.
			///</summary>
			///<param name="url">(Optional) The doodad to load. If not provided, will load the root doodad.</param>
			///<param name="mixinUrl">(Optional) The doodad-mixin to associate with the constructed doodad.</param>
			///<param name="options">(Optional) The options to associate with the doodad.</param>
			///<returns>
			/// Since the creation process is (potentially) asynchronous, this method returns a jQuery.Deferred promise object.
			/// On completion, the argument to the done method is the newly constructed doodad instance.
			///</returns>
			if ($.isPlainObject(url)) {
				options = url;
				url = null;
			}
			if ($.isPlainObject(mixinUrl)) {
				options = mixinUrl;
				mixinUrl = null;
			}
			
			var dfd = doodads.load(url).pipe(function(type) {
				return new type(options);
			});
			if (mixinUrl) {
				dfd = dfd.pipe(function(instance) {
					return doodads.load(mixinUrl).pipe(function(mixin) {
						var dfd = $.Deferred(),
							constructor = new builder();
						
						constructor.name = url;
						constructor.complete = function(callback) {
							$.extend(instance, this.setupObject.proto);
							this.setupObject.init.call(instance);
							
							dfd.resolve(instance);
						};
						mixin.setupFn.apply(null, $.merge([constructor, Object.getPrototypeOf(instance)], mixin.args || []));
						
						return dfd;
					});
				});
			}
			
			return dfd;
		},
		getType: function doodads$getType(url) {
			///<summary>
			/// Returns the class for the given doodad url.
			///</summary>
			///<param name="url">(optional) The URL to get the class type from.</param>
			///<returns>
			/// If the doodad resource has been loaded, then returns a JS class object.
			/// If the doodad resource has not been loaded, returns undefined.
			/// If no url is given, returns the root doodad class.
			///</returns>
			if (url) {
				return cache.types[utils.canonicalize(url)];
			} else {
				return doodads.doodad;
			}
		}
	});
	
	doodads.setup.defaultAction = function doodads$setup$defaultAction() {
		///<summary>
		/// This method is used to support the doodad infrastructure and should not
		/// be called by client code. 
		/// Used by the server side builders to construct a doodad when there is no
		/// behaviour file associated with a doodad.
		///</summary>
		doodads.setup()(function(builder) {
			builder.complete();
		});
	};
})();