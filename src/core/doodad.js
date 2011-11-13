var DOMMETAKEY = 'doodad'; // constant

(function() {
	// constants
	var DEBOUNCE_TIMEOUT = 50; // in milliseconds

	var $window = $(window); // cache $window, reused fairly frequently

	var doodad = function (options, defaultOptions) {
		///<summary>
		/// Constructs an instance of doodad, configuring it based on the passed in <paramref name="options">options</paramref> parameter.
		///  * The case where <paramref name="defaultOptions">defaultOptions</paramref> is supplied is reserved for use
		///    by doodad implementors and doesn't make much sense when called from code.
		///  * The case where both <paramref name="options">options</paramref> and <paramref name="defaultOptions">defaultOptions</paramref>
		///    are undefined is reserved for use by the doodad Library infrastructure. Calling the constructor in code
		///    in that fashion will result in a doodad that is not initialized properly.
		///</summary>
		///<param name="options">The configuration points for this doodad instance.</param>
		///<param name="defaultOptions">The default values of the configuration points.</param>
		if (arguments.length === 0) { return; }

		this._options = $.extend({}, doodad.defaultOptions, defaultOptions, options);
		
		$.extend(this, {
			_jQueryCache: $(this)
			
			, _id: this._options.id
			, _cssClassOverrides: this._options.cssClass
			, _tabIndex: this._options.tabIndex
			
			, _parent: null
			, _children: []
			, _autogenChildren: [] // the list of children that have private variables
			, _autogenUnbinds: [] // the list of events to auto-unbind
			, _autogenRefs: [] // the list of DOM elements with references
			, _source: null
			, _dataSource: null
			
			, _isAttached: false
			
			, _isValid: true
			, _listenToChildrenValidity: true

			, _hookedResize: false
			
			, _disposing: false
		});
		
		this.onWindowResize$proxy = doodads.proxy(this.onWindowResize, this);
		this._onResize$debounced = doodads.debounce(this._onResize, DEBOUNCE_TIMEOUT, this);

		if (this._options.validates === false) {
			doodads.validation.remove(this);
		}
	}
	doodad.instantiationSibling = $(document.createElement('div'));
	doodad.defaultOptions = {
		id: ''
		, cssClass: ''
		, tabIndex: null
		///<summary>
		/// Automatically creates a variable referencing DOM elements with name attributes in the DOM structure for 
		/// this doodad.
		///</summary>
		, autoDOMReferences: true
		, templates: { base: '<div />' }
	};
	doodad.prototype = {
		/* BEGIN ID Management */

		_setDomId: function doodad$_setDomId() {
			///<summary>
			/// Assigns a unique ID to the doodad's DOM element's id attribute. If the computed ID
			/// is the empty string, then the id attribute is removed from the DOM element.         
			///</summary>
			var computedId;

			if (this.id()) {
				computedId = this.computedId();

				if (computedId !== '') {
					this.element().attr('id', computedId);
				} else {
					this.element().removeAttr('id');
				}
			} else {
				// if this element doesn't have an ID, then there is no sense in creating the computed ID
				// remove the id attribute all together
				this.element().removeAttr('id');
			}
		}

		, id: function doodad$id(/*[newId]*/) {
			///<summary>
			/// Getter/Setter
			/// The unique ID of the doodad. Note that IDs do not necessarily have to be unique across
			/// all doodads, but that they do have to be unique at the current level in the doodad Hierarchy.
			/// The infrastructure will use ID mangling to create a unique ID for the doodad across the entire
			/// hierarchy.
			///</summary>
			///<param name="newId">The new ID for the doodad</param>
			///<returns>
			/// If newId is undefined, returns the doodad's unique ID.
			/// If newId is provided, no value is returned.
			///</returns>
			if (arguments.length === 0) {
				return this._id;
			} else {
				this._id = arguments[0];
				this._setDomId();

				$.each(this.children(), $.proxy(function (index, child) {
					child.parent(this);
				}, this));
			}
		}
		, computedId: function doodad$computedId() {
			///<summary>
			/// The Computed ID of a doodad is a mangled version of the id property that is
			/// most likely unique across all doodads.
			///</summary>
			///<returns>
			/// The Computed ID.
			///</returns>
			///<remarks>
			/// The infrastructure does not check/guarantee uniqueness, since it is always possible for
			/// developer to create doodads with the same ID as children of a particular doodad.
			///</remarks>
			var idChain = [];

			if (this.id() === '') {
				return ''; // don't care about a mangled id if no id is given
			}

			for (var p = this; p && p.id; p = p.parent()) {
				if (p.id()) {
					idChain.unshift(p.id());
				}
			}

			return idChain.join('_');
		}

		/* END ID Management */

		/* BEGIN doodad Hierarchy Management */

		, _refreshParent: function doodad$_refreshParent() {
			this._setDomId();

			this._hookWindowResize();

			$.each(this.children(), function (index, child) {
				child._refreshParent();
			});
		}
		
		, children: function doodad$children() {
			return this._children || [];
		}

		, parent: function doodad$parent(/*[newParent]*/) {
			///<summary>
			/// Getter/Setter
			/// The parent of a doodad is the doodad that provides the Naming Container.
			/// The Naming Container for a doodad provides a means of generating a unique
			/// ID for the doodad's DOM id attribute.
			/// Setting the parent for a doodad causes the DOM ID to be recomputed.
			///
			/// doodad parents are not necessarily the same as DOM parents. That is, a doodad
			/// may be a child of another doodad, but not be a descendant of the parent's DOM.
			///</summary>
			///<param name="newParent">The new parent for this doodad.</param>
			///<returns>
			/// If newParent is undefined, returns the current parent doodad.
			/// If newParent is defined, the return value is undefined.
			///</returns>
			if (arguments.length === 0) {
				return this._parent;
			} else {
				if (this._parent !== arguments[0]) {
					if (this._parent !== null) {
						this._parent.removeChild(this);
					}

					this._parent = arguments[0];
					if (this._parent !== null) {
						this._parent.addChild(this);
					}
					if (!this._source) {
						this.ensureElement();
					}
				}

				this._refreshParent();
			}
		}
		, hasChild: function doodad$hasChild(child) {
			///<summary>
			///Determines whether or not this doodad has the doodad referenced by child as a child doodad.
			///</summary>
			///<returns>True if the doodad is a child, false otherwise</returns>
			var found = false;
			$.each(this.children(), function (index, c) {
				if (c === child) {
					found = true;
					return false;
				}
			});
			return found;
		}
		, addChild: function doodad$addChild(child) {
			///<summary>
			/// Adds doodad to the list of children doodads for this doodad.
			/// This effectively reparents <paramref name="child">child</paramref>. 
			/// That is, the parent/child relationship is maintained in a bidirectional fashion.
			/// Reparenting a doodad causes the DOM ID of the doodad to be recomputed.
			///</summary>
			///<param name="child">The doodad to add to the list of children.</param>
			if (this.hasChild(child)) {
				return;
			}

			if (!child.valid() && this.listenToChildrenValidity()) {
				this._valid(false);
			}

			this._children.push(child);
			child.parent(this);
		}
		, removeChild: function doodad$removeChild(child) {
			///<summary>
			/// Removes a child from the list of children doodads maintained for this doodad.
			/// This effectively reparents <paramref name="child">child</paramref> to have no ancestery. That is
			/// <paramref name="child">child</paramref> becomes orphaned.
			/// If <paramref name="child">child</paramref>is not a child of this doodad, then this method
			/// is effectively a noop.
			///</summary>
			///<param name="doodad">The doodad to remove from the children list</param>
			var found = false,
				disposing = this._disposing,
				invalidCount = 0;

			this._children = $.map(this._children, function (c, index) {
				if (c === child) {
					found = true;
					return null;
				} else {
					if (!disposing && !c.valid()) invalidCount++;
					return c;
				}
			});

			if (found) {
				child.parent(null);

				if (!disposing && invalidCount === 0 && this.listenToChildrenValidity()) {
					this._valid(true);
				}
			}
		}

		/* END doodad Hierarchy Management */

		/* BEGIN CSS Class Management */

		, _updateCssClass: function doodad$_updateCssClass() {
			///<summary>
			///Assigns the computed CSS Class to the class attribute on the doodad's DOM element.
			///</summary>
			var computedClass = [];

			this.element().removeClass();

			if (this.cssClassPrefix() !== '') {
				computedClass.push(this.cssClassPrefix());
			}
			if (this._cssClassOverrides !== '') {
				computedClass.push(this._cssClassOverrides);
			}

			if (computedClass.length !== 0) {
				this.element().addClass(computedClass.join(' '));
			}
		}
		, cssClassPrefix: function doodad$cssClassPrefix() {
			///<summary>
			/// The CSS Class Prefix is a space delimited list of CSS Classes that defines the look for all
			/// instances of a particular doodad. By setting this property in a doodad
			/// implementation, developers can ensure that a doodad has a consistent look
			/// across all instances.
			///
			/// This property should be treated as being immutable by instances of a doodad
			/// but can/should be overridden by doodad authors for styling purposes.
			///</summary>
			///<returns>
			/// Returns the a space delimited list of this doodad's prefix CSS Classes.
			///</returns>
			///<remarks>
			///This is an abstract method on the doodad base class.
			///</remarks>
			return '';
		}
		, cssClass: function doodad$cssClass(/*[cssClass]*/) {
			///<summary>
			/// Getter/Setter
			///
			/// The CSS Class is a space delimited list of CSS Classes that overrides the look for an instance
			/// of a particular doodad. By setting this property either through the options constructor
			/// parameter or via code, a doodad user can assign unique traits to a particular doodad.
			///
			/// The setter version of this function will immediately compute the effective CSS Class list for
			/// this doodad (a merge between cssClassPrefix and cssClass) and assign it to the doodad
			/// DOM element.
			///</summary>
			///<param name="cssClass">A space delimited list of CSS classes.</param>
			///<returns>
			/// If cssClass is undefined, returns a space delimited list of CSS classes assigned to an instance
			/// of a doodad.
			/// If cssClass is defined, assigns the CSS Classes to an instance of a doodad.
			///</returns>
			///<remarks>
			/// Note that assigning cssClass will override any existing CSS Classes on the doodad DOM Element.
			///</remarks>
			if (arguments.length === 0) {
				return this._cssClassOverrides;
			} else {
				this._cssClassOverrides = arguments[0];
				this._updateCssClass();
			}
		}

		/* END CSS Class Management */

		/* BEGIN Input Focus Management */

		, tabIndex: function doodad$tabIndex(/*[tabIndex]*/) {
			///<summary>
			/// Getter/Setter
			///
			/// The tabIndex property for a doodad determines the tab order of the page based on reading order
			/// rules and quirks defined here:
			/// The tabIndex property simply adds the tabIndex attribute to the root element of the doodad
			///</summary>
			///<param name="tabIndex" type="Number" mayBeNull="true" optional="true">
			/// The new tab index for the doodad. If null, the tab index for the doodad is removed.
			/// If omitted, the current tab index is retrieved.
			///</param>
			///<returns type="Number">
			/// If tabIndex argument is undefined, returns the current tabIndex for the doodad.
			/// If tabIndex argument is null or a number, returns undefined.
			///</returns>
			if (arguments.length === 0) {
				return this._tabIndex;
			} else {
				this._tabIndex = arguments[0];
				if (this._tabIndex || this._tabIndex === 0) {
					this.element().attr('tabIndex', this._tabIndex);
				} else {
					this.element().removeAttr('tabIndex');
				}
			}
		}
		, focus: function doodad$focus() {
			///<summary>
			///Programatically assigns input focus to this doodad
			///</summary>
			this.element().focus();
		}
		, blur: function doodad$blur() {
			///<summary>
			///Programmatically removes input focus from this doodad.
			///</summary>
			this.element().blur();
		}
		, hasInputFocus: function doodad$hasInputFocus() {
			///<summary>
			/// Returns a boolean value indicating whether or not this doodad currently has
			/// input focus or not.
			///</summary>
			return false;
		}

		/* END Input Focus Management */

		/* BEGIN Data Management */

		, dataSource: function doodad$dataSource(/*[value]*/) {
			///<summary>
			/// Getter/Setter
			///
			/// The Data Source for a doodad is a simple JS object that defines some/all of the
			/// data points for a doodad. The Data Source property is useful for creating data bound
			/// doodads.
			///
			/// In the default implementaion, a change to the Data Source property does not trigger
			/// any updates to the DOM of the doodad. It is the responsibility of a doodad
			/// author to best determine how to respond to changes in data (full invalidation, partial invalidation, etc.).
			///</summary>
			///<param name="value">The new Data Source value</param>
			///<returns>
			/// If value is undefined, returns the current Data Source object for this doodad.
			/// If value is defined, no value will be returned.
			///</returns>
			if (arguments.length === 0) {
				return this._dataSource;
			} else {
				this._dataSource = arguments[0];
			}
		}
		, templateData: function doodad$templateData() {
			///<summary>
			/// The Template Data is a mapping of the Data Source property to a schema that is consumable by
			/// the Mustache templating engine. There are situations where even though it is possible to write
			/// a Mustache fragment that matches the desired output with the given Data Source, it is much
			/// simpler to map the data into a more Mustache friendly schema.
			///
			/// The default implementation of this method assumes that Template Data and Data Source are
			/// exactly the same.
			///</summary>
			return this.dataSource() || {};
		}

		/* END Data Management */

		/* BEGIN Rendering */

		, template: function doodad$template(key, value) {
			///<summary>
			///Overrides the partial template with name "key" with the template given in "value"
			///</summary>
			///<param name="key">The name of the partial template to replace. Omit this argument to default to 'base'</param>
			///<param name="value">The Mustache template fragment to replace the template with.</param>
			if (arguments.length === 1) {
				value = key;
				key = 'base';
			}

			if (!this._options.templates.__instance) {
				// if the markup templates for this doodad are the shared copy
				// and we are changing one of the markup templates, then 
				// we have to clone an instance of the shared copy
				this._options.templates = $.extend(
					{ __instance: true }
					, this._options.templates
					, { __compiledTemplate: null }
				);
			}

			this._options.templates[key] = value;
			if (this._options.templates.__compiledTemplate) {
				this._options.templates.__compiledTemplate = null;
			}
		}

		, _processTemplates: function doodad$_processTemplates() {
			///<summary>
			/// Using the templateData property and the templates defined for this doodad, generates
			/// the HTML that will be used as the source of the DOM fragment for this doodad.
			///</summary>
			///<remarks>
			/// Note that if there is a partial template reference cycle in the template definitions
			/// Mustache will be thrown into an infinite loop and a stack overflow exception
			/// will be triggered.
			///</remarks>
			if (!this._options.templates.__compiledTemplate) {
				try {
					this._options.templates.__compiledTemplate = Mustache.compile(this._options.templates['base'], this._options.templates);
				} catch (e) {
					if (e.is_mustache_error) {
						console.error(e.message);
					} else {
						throw e;
					}
				}
			}
			return this._options.templates.__compiledTemplate(this.templateData());
		}
		, _instantiateChildren: function doodad$_instantiateChildren() {
			///<summary>
			/// Finds all "doodad" elements in the doodad's DOM and instantiates the
			/// declared type. This is useful for building doodad graphs using 
			/// declarative markup rather than code. Each valid doodad element that has an
			/// ID attribute will have an autogenerated reference available in the context of this
			/// doodad.
			///</summary>
			///<example>
			/// The following simple DOM fragment will create a doodad, alias it to this._sample and place it
			/// in the context of the instantiated doodad:
			/// <doodad id="sample"></doodad>
			///</example>
			///<remarks>
			/// Note that doodad elements that do not have a type attribute will be replaced by
			/// an instance of the root doodad class.
			///</remarks>
			var templateDataCache, dfds,
				self = this;
			
			dfds = this._source.find('doodad').map(function (index, doodadElement) {
				var $doodadElement = $(doodadElement), asyncCreationDfd, dsAttr,
					options,
					autogenId;

				if ($doodadElement.attr('options') !== undefined) {
					options = eval('(' + $doodadElement.attr('options') + ')');
				} else {
					options = {};
				}
				options.id = $doodadElement.attr('id');
				
				var instantiationSibling = doodad.instantiationSibling.clone();
				instantiationSibling.insertAfter($doodadElement);
				$doodadElement.remove();

				asyncCreationDfd = $.Deferred();
				if ($doodadElement.attr('url')) {
					doodads.create($doodadElement.attr('url'), options)
						.done(function(result) {
							asyncCreationDfd.resolve(result);
						});
				} else {
					asyncCreationDfd.resolve(new doodad(options));
				}
				
				var completionDfd = $.Deferred();
				
				asyncCreationDfd.promise().done(function(new_doodad) {
					var $new_doodad = $(new_doodad),
						autogenId;
						
					new_doodad.translateInnerMarkup($doodadElement);
					
					if (options.id) {
						// if the child has an id, then create a reference to the
						// child on the parent's 'this'.
						// this way, the parent can reference the child using 'this._{id}'
						autogenId = '_' + options.id;
						self[autogenId] = new_doodad;
						self._autogenChildren.push(autogenId);
					}

					dsAttr = $doodadElement.attr('dataSource');
					if (dsAttr) {
						if (!templateDataCache) {
							templateDataCache = self.templateData();
						}

						if (dsAttr === '.') {
							// the special marker '.' is for passing the full dataSource 
							// down to the child doodad
							new_doodad.dataSource(templateDataCache);
						} else {
							// why not just new_doodad.dataSource(this.templateData()[dsAttr])?
							// dsAttr may contain a compound property ('x.y.z') which would not work
							// without the eval.
							new_doodad.dataSource(eval('templateDataCache.' + dsAttr));
						}
					}

					// auto-bind events based on attributes that start with "on"
					$.each(doodadElement.attributes, function (i, attr) {
						if (attr.name.indexOf('on') !== 0 || typeof self[attr.nodeValue] !== 'function') {
							return;
						}

						var proxyName = attr.nodeValue + '$proxy',
							evtName = attr.name.substr(2);

						if (!self[proxyName]) {
							// do not recreate the proxy if it already exists
							// happens if/when you bind to events in a mustache loop
							self[proxyName] = doodads.proxy(self[attr.nodeValue], self);
						}
						$new_doodad.bind(evtName, self[proxyName]);
						self._autogenUnbinds.push({
							doodad: new_doodad
							, evt: evtName
							, fn: self[proxyName]
						});
					});

					self.addChild(new_doodad);
					
					new_doodad.render(instantiationSibling);
					new_doodad.element().unwrap();
					
					completionDfd.resolve();
				});
				
				return completionDfd.promise();
			}).get();
			
			$.when.apply(null, dfds)
				.done(function() {
					self.onChildrenReady();
				});
		}
		, translateInnerMarkup: function doodad$translateInnerMarkup(sourceElement) {
			///<summary>
			/// Converts the inner markup of a <doodad> element in a markup template to 
			/// equivalent code. By default this function converts the text/mustache script sections
			/// into template overrides.
			///</summary>
			///<param name="sourceElement">The source element to read the markup from</param>
			///<remarks>
			/// This function is only useful for doodad authors to add additional functionality 
			/// for the <doodad> custom element in templates
			///</remarks>

			var templates = { __compiledTemplate: undefined };

			sourceElement.find('script[type="text/mustache"][partial]')
				.each(function () {
					var $domElement = $(this),
						partial = $domElement.html();

					if ($.browser.msie && $.browser.version < 9) {
						partial = partial.substring(2);
					}

					templates[$domElement.attr('partial')] = partial;
					templates.__instance = true;
				});

			if (templates.__instance) {
				delete templates.__instance;
				for (var key in templates) {
					if (templates.hasOwnProperty(key)) {
						this.template(key, templates[key]);
					}
				}
			}
		}

		, render: function doodad$render(target, rerender) {
			///<summary>
			/// Appends the DOM for this doodad to the DOM element specified by <paramref name="target">target</paramref>.
			/// If <paramref name="target">target</paramref> is null/undefined and <paramref name="rerender">rerender</paramref> is
			/// true, the DOM representation of the doodad will be regenerated in place.
			/// If <paramref name="target">target</paramref> is null/undefined and <paramref name="rerender">rerender</paramref> is
			/// false, the DOM representation of the doodad will be removed from the DOM.
			///</summary>
			///<param name="target">The DOM element to append this doodad to.</param>
			///<param name="rerender">Whether or not to recreate the DOM for this doodad.</param>
			var oldSource;
			if (rerender) {
				if (this._source) {
					oldSource = this._source;

					this.tearDownChildren();

					this._source = null;

					this._isAttached = false;

					oldSource.replaceWith(this.element());
				} else {
					this.ensureElement();
				}
			}

			if (target) {
				target.append(this.element());
			} else if (!rerender) {
				this.element().detach();
			}

			this.updateAttachment();
		}
		, rerender: function doodad$rerender() {
			///<summary>
			/// Rerenders the DOM Element for a doodad. This is a shortform for
			/// doodad.render(null, true);
			///</summary>
			this.render(null, true);
		}
		, detachElement: function doodad$detachElement() {
			///<summary>
			/// Detaches the DOM element for this doodad. This is a shortform for
			/// doodad.render(null, false);
			///</summary>
			this.render(null, false);
		}
		, constructElement: function doodad$constructElement() {
			///<summary>
			/// Constructs a DOM Fragment representing the visual look for the doodad.
			/// Child doodads should also be instantiated and referenced in this method.
			///</summary>

			// for once jQuery is not our friend. It parses the incoming string and turns it into something
			// that all browsers will load correctly without regard for the correct nesting rules of elements
			// this unfortunately conflicts with our abuse of SCRIPT for mustache.
			var htmlFrag = this._processTemplates(),
				domFrag,
				self = this;

			domFrag = document.createDocumentFragment();
			$.each($.clean([htmlFrag.trim()], undefined, null, null),
				function (index, element) { domFrag.appendChild(element); });

			if (domFrag.firstChild != domFrag.lastChild) {
				// this is more of a guard condition. doodads *must* have a single topmost node
				this._source = $('<div />').append(domFrag);
			} else {
				this._source = $(domFrag.firstChild);
			}

			this._generateDOMReferences();
		}
		, ensureElement: function doodad$ensureElement() {
			///<summary>
			/// Guarantees the existence of the DOM Fragment for this doodad.
			/// This method is intended to support the doodad infrastructure. Call this
			/// method if there is a particular code fragment that explicitly depends on the
			/// DOM for the doodad being present.
			///</summary>
			if (!this._source) {
				this.constructElement();

				this._instantiateChildren();
				this.bindEvents();

				this._setDomId();
				this._updateCssClass();
				this.tabIndex(this.tabIndex()); // make sure tabIndex is present on the DOM if necessary

				this._hookWindowResize();

				// create a two-way relationship between the doodad and the DOM
				this._source.data(DOMMETAKEY, this);

				if (this._options.validates) {
					this._initializeValidationListeners();
				}
				
				this.onReady();
			}
		}
		, _generateDOMReferences: function doodad$_generateDOMReferences() {
			if (!this._options.autoDOMReferences) {
				return;
			}

			var self = this;
			this._source.find('[name]:not(doodad)').each(function (index, elem) {
				$.each(elem.getAttribute('name').split(' '), function () {
					var name = '_' + this;
					if (self[name]) {
						self[name] = self[name].add(elem);
					} else {
						self[name] = $(elem);
						self._autogenRefs.push(name);
					}
				});
			});
		}
		, element: function doodad$element() {
			///<summary>
			/// Returns a reference to the DOM Element for a doodad.
			///</sumamry>
			///<remarks>
			/// Note that the element may be detached from the document so layout calculations
			/// should be done via the onAttached callback method.
			///</remarks>
			this.ensureElement();
			return this._source;
		}
		, isAttached: function doodad$isAttached() {
			///<summary>
			/// Determines whether or not the document element is an
			/// ancestor for the DOM element of this doodad.
			///</summary>
			if (!this._source) return false;

			var parentChain = this.element().parents();
			return parentChain.length > 0 && parentChain[parentChain.length - 1].tagName === 'HTML';
		}
		, updateAttachment: function doodad$updateAttachment() {
			///<summary>
			/// Update the DOM attachment of the doodad. Use this method if you are
			/// bypassing the usage of the render method for whatever reason.
			///</summary>
			var getAttached = this.isAttached();

			if (getAttached && !this._isAttached) {
				// transition from non-attached to attached
				this._notifyAttachment();
			} else if (!getAttached && this._isAttached) {
				// transition from attached to non-attached
				this._notifyDetachment();
			}
		}
		/* END Rendering */

		/* BEGIN Event Management */

		, _notifyAttachment: function doodad$_notifyAttachment() {
			this._isAttached = true;

			this.onAttached();

			$.each(this.children(), function (index, child) {
				child._notifyAttachment();
			});
		}
		, _notifyDetachment: function doodad$_notifyDetachment() {
			this._isAttached = false;

			this.onDetached();

			$.each(this.children(), function (index, child) {
				child._notifyDetachment();
			});
		}

		, bindEvents: function doodad$bindEvents() {
			///<summary>
			/// Called by the DOM construction method of the doodad base class to allow
			/// doodad authors to bind events onto DOM elements.
			///</summary>
			///<remarks>
			/// This method is called after all child doodads have been instantiated, so doodad
			/// events can be consumed as well.
			///</remarks>

			// Default Implementation is basically abstract since there is nothing to bind unto.
		}

		, onReady: function doodad$onReady() {
			///<summary>
			/// Callback function that gets called when the doodad has finished the rendering process.
			/// Note that this callback gets invoked after every time the root element is reconstructed (rerendered)
			///</summary>

			// Default Implementation is basically abstract since there is nothing to bind unto.
		}
		, onChildrenReady: function doodad$onChildrenReady() {
			///<summmary>
			/// Callback function that getsw called when the children doodads have finished the rendering process.
			/// Note that this callback gets invoked afer every time the root element is reconstructed (rerendered)
			///</summary>
			
			// Default Implementation is basically abstract since there is nothing to bind unto.
		}

		, onAttached: function doodad$onAttached() {
			///<summary>
			/// Callback function that gets called when the doodad's root element is attached to the DOM document.
			/// Note that this callback is only called if the doodad (or a parent of) is attached via the
			/// render/detachElement methods and not through an explicit DOM attachment since there is no way to detect
			/// that in a cross-browser fashion. In addition, the selective nature of this callback can be used to 
			/// do things without the doodads knowledge if need be.
			///</summary>

			// By default, nothing interesting happens when the doodad becomes attached.
		}
		, onDetached: function doodad$onDetached() {
			///<summary>
			/// Callback function that gets called when the doodad's root element is detached from the DOM document.
			/// Note that this callback is only called if the doodad (or a parent of) is detached via the
			/// render/detachElement methods and not through an explicit DOM detachment since there is no way to detect
			/// that in a cross-browser fashion. In addition, the selective nature of this callback can be used to 
			/// do things without the doodads knowledge if need be.
			///</summary>

			// By default, nothing interesting happens when the doodad becomes detached.
		}

		, _hookWindowResize: function doodad$_hookWindowResize() {
			///<summary>
			/// Hooks the window.onresize event if an ancestor of this doodad hasn't already
			/// hooked it.
			///</summary>
			if (!this._isResizeAutotriggered()) {
				// did the doodad developer implement the special onResize method?
				if (this.onResize && !this._hookedResize) {
					this._hookedResize = true;
					$window.bind('resize orientationchange', this.onWindowResize$proxy);
				}
			} else {
				if (this.onResize && this._hookedResize) {
					this._hookedResize = false;
					$window.unbind('resize orientationchange', this.onWindowResize$proxy);
				}
			}
		}

		, onWindowResize: function doodad$onWindowResize() {
			///<summary>
			/// Internal DOM event handler. Handles the window.onresize event 
			/// and performs the necessary machination to bootstrap a recursive resize event in the doodad tree
			///</summary>
			if (this._currheight !== document.documentElement.clientHeight ||
				this._currwidth !== document.documentElement.clientWidth) {

				this._onResize$debounced();
			}
			this._currheight = document.documentElement.clientHeight;
			this._currwidth = document.documentElement.clientWidth;
		}

		, _isResizeAutotriggered: function doodad$_isResizeAutotriggered() {
			///<summary>
			/// If an ancestor in the doodad hierarchy implements an onResize function,
			/// the onResize method of this doodad will be auto triggered either as part of a DOM triggered
			/// window.onresize, a manually triggered window.onresize, or a branch onResize (via trigger_resize)
			///</summary>
			for (var p = this.parent(); p; p = p.parent()) {
				if (p.onResize) {
					return true;
				}
			}

			return false;
		}

		, _onResize: function doodad$_onResize() {
			///<summary>
			/// Performs a recursive walk of the descendents of this doodad calling onResize
			/// if it exists on the descendent.
			///</summary>
			if (this.onResize && this._isAttached) {
				// the source element has to be attached to the main DOM tree (i.e. be visible) before
				// resizing makes sense
				this.onResize();
			}

			$.each(this.children(), function (index, child) {
				child._onResize();
			});
		}

		/*, onResize: function doodad$onResize() {
		///<summary>
		/// onResize is an "optional" member of this class. If it is implemented, the doodad 
		/// library will trigger it as part of a ancestor->descendants walk when listening to the
		/// window.onresize event.
		/// This function *must* be synchronous for the nested children to resize properly.
		///</summary>
		}*/

		, trigger_resize: function doodad$trigger_resize(deferred) {
			///<summary>
			/// Triggers a resize event with this doodad at the root of the doodad hierarchy
			///</summary>
			///<param name="deferred">
			/// An optional parameter that determines whether the resize will get fired immediately
			/// or deferred for later execution (useful if multiple resizes are going to be temporally clustered).
			/// true for deferred
			/// false for immediate
			/// The default value for this parameter is true
			/// </param>
			if (deferred || (deferred === undefined)) {
				this._onResize$debounced();
			} else {
				this._onResize();
			}
		}
		/* END Event Management */

		/* BEGIN Validation Management */
		, _trigger_validity: function doodad$trigger_validity(isValid) {
			var e = $.Event(isValid ? 'valid' : 'invalid'), $this = $(this);
			$this.trigger.call($this, e, arguments);
			
			if (!e.isPropagationStopped() && this.parent()) {
				this.parent()._valid(isValid);
			}
		}
		, trigger_valid: function doodad$trigger_valid() {
			///<summary>
			/// Triggers the "valid" event.
			///</summary>
			///<remarks>
			/// Note that this method is meant to support doodad authors and should rarely be used
			/// by doodad consumers.
			///</remarks>
			this._trigger_validity(true);
		}
		, trigger_invalid: function doodad$trigger_invalid() {
			///<summary>
			/// Triggers the "valid" event.
			///</summary>
			///<remarks>
			/// Note that this method is meant to support doodad authors and should rarely be used
			/// by doodad consumers.
			///</remarks>
			this._trigger_validity(false);
		}
		, valid: function doodad$valid(/*value*/) {
			/// <summary>
			///		1: valid() - return the current validity.
			///		2: valid(value) - sets the validity to "value".
			///
			///		Trigger the "valid" and "invalid" functions, only when the validity state changed.
			///		That is, if the state changed from true to false then "invalid" triggers, if it went from 
			///		false to true, then "valid" triggers.
			/// </summary>
			/// <param name="value" type="Boolean" optional="true" />
			/// <returns type="Boolean">
			///		true if it's valid, false otherwise
			///	</returns>
			/// <remarks>
			/// 	Calling "valid(value)" will override the validity.  Because of this, the validity of its children will never 
			///		again be included in the computation of its validity, unless "listenToChildrenValidity(true)" is called.
			/// </remarks>		    
			if (arguments.length === 0) {
				return this._valid();
			} else {
				this.listenToChildrenValidity(false);
				this._valid(arguments[0]);
			}
		}
		, validate: function doodad$validate() {
			///<summary>
			/// Validate the contents of this doodad, triggering valid/invalid events
			/// as necessary.
			///</summary>

			this._computeValidityState();

			if (this._isValid) {
				this.trigger_valid(this);
			} else {
				this.trigger_invalid(this);
			}
		}
		, _computeValidityState: function doodad$_computeValidityState() {
			///<summary>
			/// Check that all children are valid.  If one is invalid, then the doodad
			/// itself is invalid	
			///</summary>

			var isValid = true;

			if (this.listenToChildrenValidity()) {
				$.each(this.children(), function (index, child) {
					if (!child.valid()) {
						isValid = false;
						return false;
					};
				});
			}

			this._isValid = isValid;
		}
		, _valid: function doodad$_valid(/*value*/) {
			if (arguments.length === 0) {
				return this._isValid;
			} else {
				var value = arguments[0];

				if (!this._isValid && value) {
					this._computeValidityState();

					if (this._isValid) {
						this.trigger_valid(this);
					}
				} else if (this._isValid && !value) {
					this._isValid = false;
					this.trigger_invalid(this);
				}
			}
		}
		, listenToChildrenValidity: function doodad$listenToChildrenValidity(/*value*/) {
			///<summary>
			/// Determines whether or not validity of this doodad should be the LOGICAL AND of the validity
			/// states of the children or a value determined manually through the valid function.
			/// If no arguments are given, then this function returns the current value of this property:
			///  false: manually determined value
			///  true: LOGICAL AND of validity state of children.
			/// If an argument is given then it will override the value of this property.
			///</summary>
			///<param name="value">The new value for this property (boolean)</param>
			///<returns>
			/// If no parameter is given, then it returns the current value of this property.
			/// If a parameter is given, then the return value is undefined.
			///</returns>
			if (arguments.length === 0) {
				return this._listenToChildrenValidity;
			} else {
				this._listenToChildrenValidity = arguments[0];

				if (this._listenToChildrenValidity) {
					this.validate();
				}
			}
		}
		/* END Validation Management*/

		/* BEGIN Event Binding Helpers */
		
		, bind: function doodad$bind() {
			///<sumamry>
			/// Same syntax as jQuery.bind
			///</summary>
			this._jQueryCache.bind.apply(this._jQueryCache, arguments);
		}
		, unbind: function doodad$unbind() {
			///<sumamry>
			/// Same syntax as jQuery.unbind
			///</summary>
			this._jQueryCache.unbind.apply(this._jQueryCache, arguments);
		}
		, trigger: function doodad$trigger() {
			///<sumamry>
			/// Maps unto jQuery.trigger.
			///</summary>
			var params = Array.prototype.slice.call(arguments),
				evt = params.shift();
			
			this._jQueryCache.trigger(evt, params);
		}
		
		/* END Event Binding Helpers */
		
		/* BEGIN doodad Life Cycle */

		, tearDownChildren: function doodad$tearDownChildren() {
			///<summary>
			/// Dispose all the children and null out any extra references to them
			///</summary>
			$.each(this._autogenUnbinds, function (index, entry) {
				$(entry.doodad).unbind(entry.evt, entry.fn);
			});
			this._autogenUnbinds.length = 0;

			$.each($.merge([], this.children()), function (index, child) {
				child.dispose();
			});
			this._children.length = 0;

			$.each($.merge(this._autogenChildren, this._autogenRefs), $.proxy(function (index, prop) {
				delete this[prop];
			}, this));
			this._autogenChildren.length = 0;
			this._autogenRefs.length = 0;
		}

		, dispose: function doodad$dispose() {
			///<summary>
			/// By default, recursively disposes of its children and then
			/// removes the doodad out of the DOM and parent's children list
			/// and unwires any event handlers as necessary. If a doodad binds onto a
			/// DOM event for an element that is not a descendant of the root of the doodad,
			/// then that DOM element must be manually unbound. Similarly, if a doodad gets
			/// bound unto a non-DOM Event, then that event needs to be manually unbound *unless*
			/// that event is bound using the declarative syntax.
			///</summary>
			///<remarks>
			/// Note that the fragment removed from the DOM is not actually disposed until 
			/// after the Garbage Collector gets around to it.
			///</remarks>
			this._disposing = true;
			
			this.tearDownChildren();

			if (!this._isResizeAutotriggered()) {
				// did the doodad developer implement the special onResize method?
				if (this.onResize) {
					this._hookedResize = false;
					$window.unbind('resize orientationchange', this.onWindowResize$proxy);
				}
			}

			// the presense of the onResize function causes the hierarchy management functions to
			// hook unto the window.onresize event in some conditions. to prevent this,
			// unmap the function as part of teardown
			delete this['onResize'];
			this.onResize = undefined; // IE is just plain weird

			this.element()
				.empty()
				.remove();

			if (this.parent()) {
				this._parent.removeChild(this);
				this._parent = null;
			}
		}

		/* END doodad Life Cycle */
	}
	doodad.prototype.constructor = doodad;
	doodads.doodad = doodad;
})();