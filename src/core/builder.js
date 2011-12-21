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
			getResponseFunc: function(url) {
				return (cache.waitFunctions[utils.canonicalize(url)] || { func : $.noop }).func;
			},
			canonicalize: function ComponentFactory$canonicalize(url) {
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
			require: function(url) {
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
			addStylesheet: function(url, byteStream) {
				///<summary>
				/// Associates a stylesheet with a given url, adding the stylesheet to the DOM.
				///</summary>
				///<param name="url" type="String">The URL to associate the stylesheet with.</param>
				///<param name="byteStream" type="String">The CSS stylessheet to add to the DOM</param>
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
		constructor: function(func) {
			this.setupObject.init = func;
			
			return this;
		},
		validates: function() {
			this.setupObject.validates = true;
			
			return this;
		},
		defaultOptions: function(defaultOptions) {
			this.setupObject.defaultOptions = defaultOptions;
			
			return this;
		},
		proto: function(proto) {
			$.extend(this.setupObject.proto, proto);
			
			return this;
		},
		templates: function(templates, inheritsTemplates) {
			$.extend(this.setupObject.templates, templates);
			
			if (inheritsTemplates) {
				this.setupObject.inheritsTemplates = true;
			}
			
			return this;
		},
		stylesheets: function(stylesheets) {
			$.extend(this.setupObject.stylesheets, stylesheets);
			
			return this;
		},
		statics: function(statics) {
			$.extend(this.setupObject.statics, statics);
			
			return this;
		},
		complete: function() {
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
		}
	}

	$.extend(doodads, {
		setup: function(name, definition) {
			if (cache.constructions[name]) {
				return cache.constructions[name];
			}
			
			var constructor = new builder(name);
			
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
			
			cache.constructions[name] = {
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
			
			return cache.constructions[name];
		},
		create: function(url, options) {
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
		getType: function(url) {
			return cache.types[utils.canonicalize(url)];
		}
	});
})();