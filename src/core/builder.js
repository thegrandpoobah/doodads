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
(function($, undefined) {
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
		inheritsFrom: function(inheritsFrom) {
			this.setupObject.base = inheritsFrom;
			
			return this;
		},
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
			var baseDfd = $.Deferred(), 
				baseType,
				setupObject = this.setupObject, 
				name = this.name;

			if (setupObject.base) {
				baseType = doodads.getType(setupObject.base);
				
				if (!baseType) {
					utils.require(setupObject.base).done(function() {
						baseDfd.resolve(doodads.getType(setupObject.base).prototype);
					});
				} else {
					baseDfd.resolve(baseType.prototype);
				}
			} else {
				baseDfd.resolve(Vastardis.UI.Components.Component.prototype);
			}
			
			baseDfd.promise().done(function(baseType) {
				var key;
				var new_doodad = function(options, defaultOptions) {
					if (arguments.length === 0) { return; }
					
					this.base = baseType;
					this.base.constructor.call(this, $.extend({}, defaultOptions, options), new_doodad.defaultOptions);
					
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
					Vastardis.UI.Components.Component.addValidationAPI(new_doodad);
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
			});
		}
	}
	
	doodads = {
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
			
			cache.constructions[name] = constructor;
			
			return constructor;
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
	};
})(jQuery);
