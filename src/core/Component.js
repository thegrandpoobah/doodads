(function ($, undefined) {
    $.extend(true, window, { Vastardis: { UI: { Components: {}}} });
    var vsc = Vastardis.UI.Components; // namespace alias

    // constants
    var DOMCOMPONENTMETA = 'vsc.component',
        DEBOUNCE_TIMEOUT = 50; // in milliseconds

    var $window = $(window); // cache $window, reused fairly frequently

    // make sure that IE can render all of the custom tags we have
    'component'.replace(/\w+/g, function (n) { document.createElement(n); });

    /* innerShiv: makes HTML5shim work on innerHTML & jQuery
    * http://jdbartlett.github.com/innershiv
    *
    * This program is free software. It comes without any warranty, to
    * the extent permitted by applicable law. You can redistribute it
    * and/or modify it under the terms of the Do What The F@#$ You Want
    * To Public License, Version 2, as published by Sam Hocevar. See
    * http://sam.zoy.org/wtfpl/COPYING for more details.
    */
    var innerShiv = (function () {
        var div;
        var doc = document;
        var needsShiv;

        // Used to idiot-proof self-closing tags
        function fcloseTag(all, front, tag) {
            return (/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i).test(tag) ? all : front + '></' + tag + '>';
        }

        return function (html/* string */, returnFrag /* optional false bool */) {
            if (!div) {
                div = doc.createElement('div');

                // needsShiv if can't use HTML5 elements with innerHTML outside the DOM
                div.innerHTML = '<nav></nav>';
                needsShiv = div.childNodes.length !== 1;

                if (needsShiv) {
                    // MSIE allows you to create elements in the context of a document
                    // fragment. Jon Neal first discovered this trick and used it in his
                    // own shimprove: http://www.iecss.com/shimprove/
                    var shimmedFrag = doc.createDocumentFragment();
                    // Array of elements that are new in HTML5
                    'abbr article aside audio canvas datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video'.replace(/\w+/g, function (tag) {
                        shimmedFrag.createElement(tag);
                    });

                    shimmedFrag.appendChild(div);
                }
            }

            html = html
            // Trim whitespace to avoid unexpected text nodes in return data:
			    .replace(/^\s\s*/, '').replace(/\s\s*$/, '')
            // Strip any scripts:
            /*.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')*/
            // Fix misuses of self-closing tags:
			    .replace(/(<([\w:]+)[^>]*?)\/>/g, fcloseTag);

            // Fix for using innerHTML in a table
            var tabled;
            if (tabled = html.match(/^<(tbody|tr|td|th|col|colgroup|thead|tfoot)[\s\/>]/i)) {
                div.innerHTML = '<table>' + html + '</table>';
            } else {
                div.innerHTML = html;
            }

            // Avoid returning the tbody or tr when fixing for table use
            var scope;
            if (tabled) {
                scope = div.getElementsByTagName(tabled[1])[0].parentNode;
            } else {
                scope = div;
            }

            // If not in jQuery return mode, return child nodes array
            if (returnFrag === false) {
                return scope.childNodes;
            }

            // ...otherwise, build a fragment to return
            var returnedFrag = doc.createDocumentFragment();
            var j = scope.childNodes.length;
            while (j--) {
                returnedFrag.appendChild(scope.firstChild);
            }

            return returnedFrag;
        };
    } ());

    var ValidationEventArgs = function (args) {
        this.data = args;
        this._propagationStopped = false;
    }
    ValidationEventArgs.prototype = {
        stopPropagation: function ValidationEventArgs$stopPropagation() {
            this._propagationStopped = true;
        }
        , isPropagationStopped: function ValidationEventArgs$isPropagationStopped() {
            return this._propagationStopped;
        }
    };

    var Component = function (options, defaultOptions) {
        ///<summary>
        /// Constructs an instance of Component, configuring it based on the passed in <paramref name="options">options</paramref> parameter.
        ///  * The case where <paramref name="defaultOptions">defaultOptions</paramref> is supplied is reserved for use
        ///    by Component implementors and doesn't make much sense when called from code.
        ///  * The case where both <paramref name="options">options</paramref> and <paramref name="defaultOptions">defaultOptions</paramref>
        ///    are undefined is reserved for use by the Component Library infrastructure. Calling the constructor in code
        ///    in that fashion will result in a Component that is not initialized properly.
        ///</summary>
        ///<param name="options">The configuration points for this component instance.</param>
        ///<param name="defaultOptions">The default values of the configuration points.</param>
        if (arguments.length === 0) { return; }

        this._options = $.extend({}, Component.defaultOptions, defaultOptions, options);

        this._parent = null;
        this._children = [];
        this._autogenChildren = []; // the list of children that have private variables
        this._autogenUnbinds = []; // the list of events to auto-unbind
        this._autogenRefs = []; // the list of DOM elements with references
        this._source = null;
        this._id = this._options.id;
        this._cssClassOverrides = this._options.cssClass;
        this._tabIndex = this._options.tabIndex;
        this._isAttached = false;
        this._isValid = true;

        this._listenToChildrenValidity = true;

        this._dataSource = null;

        this._hookedResize = false;
        this.onWindowResize$proxy = $.proxy(this.onWindowResize, this);
        this._onResize$debounced = $.debounce(this._onResize, DEBOUNCE_TIMEOUT, this);

        if (this._options.validates === false) {
            vsc.Component.removeValidationAPI(this);
        }
    }
    Component.instantiationSibling = $(document.createElement('div'));
    Component.defaultOptions = {
        id: ''
        , cssClass: ''
        , tabIndex: null
        ///<summary>
        /// For each Component element in the DOM, instantiates the referenced component and inserts it into the
        /// children array.
        ///</summary>
        , instantiateComponents: true
        ///<summary>
        /// Automatically creates a variable referencing DOM elements with name attributes in the DOM structure for 
        /// this component.
        ///</summary>
        , autoDOMReferences: true
        , templates: { base: '<div />' }
    };
    Component.prototype = {
        /* BEGIN ID Management */

        _setDomId: function Component$_setDomId() {
            ///<summary>
            /// Assigns a unique ID to the component's DOM element's id attribute. If the computed ID
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

        , id: function Component$id(/*[newId]*/) {
            ///<summary>
            /// Getter/Setter
            /// The unique ID of the Component. Note that IDs do not necessarily have to be unique across
            /// all components, but that they do have to be unique at the current level in the Component Hierarchy.
            /// The infrastructure will use ID mangling to create a unique ID for the component across the entire
            /// hierarchy.
            ///</summary>
            ///<param name="newId">The new ID for the Component</param>
            ///<returns>
            /// If newId is undefined, returns the Component's unique ID.
            /// If newId is provided, no value is returned.
            ///</returns>
            if (arguments.length === 0) {
                return this._id;
            } else {
                this._id = arguments[0];
                this._setDomId();

                $.each(this._children, $.proxy(function (index, child) {
                    child.parent(this);
                }, this));
            }
        }
        , computedId: function Component$computedId() {
            ///<summary>
            /// The Computed ID of a component is a mangled version of the id property that is
            /// most likely unique across all components.
            ///</summary>
            ///<returns>
            /// The Computed ID.
            ///</returns>
            ///<remarks>
            /// The infrastructure does not check/guarantee uniqueness, since it is always possible for
            /// developer to create components with the same ID as children of a particular Component.
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

        /* BEGIN Component Hierarchy Management */

        , _refreshParent: function Component$_refreshParent() {
            this._setDomId();

            this._hookWindowResize();

            $.each(this._children, function (index, child) {
                child._refreshParent();
            });
        }

        , parent: function Component$parent(/*[newParent]*/) {
            ///<summary>
            /// Getter/Setter
            /// The parent of a Component is the Component that provides the Naming Container.
            /// The Naming Container for a Component provides a means of generating a unique
            /// ID for the Component's DOM id attribute.
            /// Setting the parent for a Component causes the DOM ID to be recomputed.
            ///
            /// Component parents are not necessarily the same as DOM parents. That is, a Component
            /// may be a child of another component, but not be a descendant of the parent's DOM.
            ///</summary>
            ///<param name="newParent">The new parent for this component.</param>
            ///<returns>
            /// If newParent is undefined, returns the current parent Component.
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
        , hasChild: function Component$hasChild(child) {
            ///<summary>
            ///Determines whether or not this component has the component referenced by child as a child component.
            ///</summary>
            ///<returns>True if the component is a child, false otherwise</returns>
            var found = false;
            $.each(this._children, function (index, c) {
                if (c === child) {
                    found = true;
                    return false;
                }
            });
            return found;
        }
        , addChild: function Component$addChild(child) {
            ///<summary>
            /// Adds component to the list of children components for this Component.
            /// This effectively reparents <paramref name="child">child</paramref>. 
            /// That is, the parent/child relationship is maintained in a bidirectional fashion.
            /// Reparenting a Component causes the DOM ID of the Component to be recomputed.
            ///</summary>
            ///<param name="child">The component to add to the list of children.</param>
            if (this.hasChild(child)) {
                return;
            }

            if (!child.valid() && this.listenToChildrenValidity()) {
                this._valid(false);
            }

            this._children.push(child);
            child.parent(this);
        }
        , removeChild: function Component$removeChild(child) {
            ///<summary>
            /// Removes a child from the list of children components maintained for this Component.
            /// This effectively reparents <paramref name="child">child</paramref> to have no ancestery. That is
            /// <paramref name="child">child</paramref> becomes orphaned.
            /// If <paramref name="child">child</paramref>is not a child of this Component, then this method
            /// is effectively a noop.
            ///</summary>
            ///<param name="component">The component to remove from the children list</param>
            var found = false;

            var invalidCount = 0;

            this._children = $.map(this._children, function (c, index) {
                if (c === child) {
                    found = true;
                    return null;
                } else {
                    if (!c.valid()) invalidCount++;
                    return c;
                }
            });

            if (found) {
                child.parent(null);

                if (invalidCount === 0 && this.listenToChildrenValidity()) {
                    this._valid(true);
                }
            }
        }

        /* END Component Hierarchy Management */

        /* BEGIN CSS Class Management */

        , _updateCssClass: function Component$_updateCssClass() {
            ///<summary>
            ///Assigns the computed CSS Class to the class attribute on the Component's DOM element.
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
        , cssClassPrefix: function Component$cssClassPrefix() {
            ///<summary>
            /// The CSS Class Prefix is a space delimited list of CSS Classes that defines the look for all
            /// instances of a particular component. By setting this property in a Component
            /// implementation, developers can ensure that a Component has a consistent look
            /// across all instances.
            ///
            /// This property should be treated as being immutable by instances of a component
            /// but can/should be overridden by component authors for styling purposes.
            ///</summary>
            ///<returns>
            /// Returns the a space delimited list of this Component's prefix CSS Classes.
            ///</returns>
            ///<remarks>
            ///This is an abstract method on the component base class.
            ///</remarks>
            return '';
        }
        , cssClass: function Component$cssClass(/*[cssClass]*/) {
            ///<summary>
            /// Getter/Setter
            ///
            /// The CSS Class is a space delimited list of CSS Classes that overrides the look for an instance
            /// of a particular component. By setting this property either through the options constructor
            /// parameter or via code, a Component user can assign unique traits to a particular component.
            ///
            /// The setter version of this function will immediately compute the effective CSS Class list for
            /// this component (a merge between cssClassPrefix and cssClass) and assign it to the Component
            /// DOM element.
            ///</summary>
            ///<param name="cssClass">A space delimited list of CSS classes.</param>
            ///<returns>
            /// If cssClass is undefined, returns a space delimited list of CSS classes assigned to an instance
            /// of a Component.
            /// If cssClass is defined, assigns the CSS Classes to an instance of a Component.
            ///</returns>
            ///<remarks>
            /// Note that assigning cssClass will override any existing CSS Classes on the Component DOM Element.
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

        , tabIndex: function Component$tabIndex(/*[tabIndex]*/) {
            ///<summary>
            /// Getter/Setter
            ///
            /// The tabIndex property for a component determines the tab order of the page based on reading order
            /// rules and quirks defined here:
            /// The tabIndex property simply adds the tabIndex attribute to the root element of the component
            ///</summary>
            ///<param name="tabIndex" type="Number" mayBeNull="true" optional="true">
            /// The new tab index for the component. If null, the tab index for the component is removed.
            /// If omitted, the current tab index is retrieved.
            ///</param>
            ///<returns type="Number">
            /// If tabIndex argument is undefined, returns the current tabIndex for the component.
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
        , focus: function Component$focus() {
            ///<summary>
            ///Programatically assigns input focus to this component
            ///</summary>
            this.element().focus();
        }
        , blur: function Component$blur() {
            ///<summary>
            ///Programmatically removes input focus from this component.
            ///</summary>
            this.element().blur();
        }
        , hasInputFocus: function Component$hasInputFocus() {
            ///<summary>
            /// Returns a boolean value indicating whether or not this component currently has
            /// input focus or not.
            ///</summary>
            return false;
        }

        /* END Input Focus Management */

        /* BEGIN Data Management */

        , dataSource: function Component$dataSource(/*[value]*/) {
            ///<summary>
            /// Getter/Setter
            ///
            /// The Data Source for a Component is a simple JS object that defines some/all of the
            /// data points for a Component. The Data Source property is useful for creating data bound
            /// Components.
            ///
            /// In the default implementaion, a change to the Data Source property does not trigger
            /// any updates to the DOM of the Component. It is the responsibility of a Component
            /// author to best determine how to respond to changes in data (full invalidation, partial invalidation, etc.).
            ///</summary>
            ///<param name="value">The new Data Source value</param>
            ///<returns>
            /// If value is undefined, returns the current Data Source object for this Component.
            /// If value is defined, no value will be returned.
            ///</returns>
            if (arguments.length === 0) {
                return this._dataSource;
            } else {
                this._dataSource = arguments[0];
            }
        }
        , templateData: function Component$templateData() {
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

        , template: function Component$template(key, value) {
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
                // if the markup templates for this component are the shared copy
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

        , _processTemplates: function Component$_processTemplates() {
            ///<summary>
            /// Using the templateData property and the templates defined for this component, generates
            /// the HTML that will be used as the source of the DOM fragment for this component.
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
        , _instantiateChildComponents: function Component$_instantiateChildComponents() {
            ///<summary>
            /// Finds all "component" elements in the component's DOM and instantiates the
            /// declared type. This is useful for building component graphs using 
            /// declarative markup rather than code. Each valid component element that has an
            /// ID attribute will have an autogenerated reference available in the context of this
            /// Component.
            ///</summary>
            ///<example>
            /// The following simple DOM fragment will create a variable this._sample of type
            /// Vastardis.UI.Components.Component in the context of the instantiated component:
            /// <component id="sample"></component>
            ///</example>
            ///<remarks>
            /// Note that component elements that do not have a type attribute will be replaced by
            /// an instance of the root Component class.
            ///</remarks>
            if (!this._options.instantiateComponents) { return; }

            var templateDataCache,
                self = this;

            this._source.find('component').each(function (index, componentElement) {
                var $componentElement = $(componentElement), dsAttr,
                    options,
                    component, $component,
                    autogenId;

                if ($componentElement.attr('options') !== undefined) {
                    options = eval('(' + $componentElement.attr('options') + ')');
                } else {
                    options = {};
                }
                options.id = $componentElement.attr('id');

                if ($componentElement.attr('url')) {
                    component = vsc.ComponentFactory2.create($componentElement.attr('url'), options);
                } else {
                    component = new vsc.Component(options);
                }
                $component = $(component);

                component.translateInnerMarkup($componentElement);

                if (options.id) {
                    // if the child has an id, then create a reference to the
                    // child on the parent's 'this'.
                    // this way, the parent can reference the child using 'this._{id}'
                    autogenId = '_' + options.id;
                    self[autogenId] = component;
                    self._autogenChildren.push(autogenId);
                }

                dsAttr = $componentElement.attr('dataSource');
                if (dsAttr) {
                    if (!templateDataCache) {
                        templateDataCache = self.templateData();
                    }

                    if (dsAttr === '.') {
                        // the special marker '.' is for passing the full dataSource 
                        // down to the child component
                        component.dataSource(templateDataCache);
                    } else {
                        // why not just component.dataSource(this.templateData()[dsAttr])?
                        // dsAttr may contain a compound property ('x.y.z') which would not work
                        // without the eval.
                        component.dataSource(eval('templateDataCache.' + dsAttr));
                    }
                }

                // auto-bind events based on attributes that start with "on"
                $.each(componentElement.attributes, function (i, attr) {
                    if (attr.name.indexOf('on') !== 0 || typeof self[attr.nodeValue] !== 'function') {
                        return;
                    }

                    var proxyName = attr.nodeValue + '$proxy',
                        evtName = attr.name.substr(2);

                    if (!self[proxyName]) {
                        // do not recreate the proxy if it already exists
                        // happens if/when you bind to events in a mustache loop
                        self[proxyName] = $.proxy(self[attr.nodeValue], self);
                    }
                    $component.bind(evtName, self[proxyName]);
                    self._autogenUnbinds.push({
                        component: component
                        , evt: evtName
                        , fn: self[proxyName]
                    });
                });

                self.addChild(component);

                Component.instantiationSibling.insertAfter($componentElement);
                component.render(Component.instantiationSibling);
                component.element().unwrap();
            }).remove();
        }
        , translateInnerMarkup: function Component$translateInnerMarkup(sourceElement) {
            ///<summary>
            /// Converts the inner markup of a <component> element in a markup template to 
            /// equivalent code. By default this function converts the text/mustache script sections
            /// into template overrides.
            ///</summary>
            ///<param name="sourceElement">The source element to read the markup from</param>
            ///<remarks>
            /// This function is only useful for Component authors to add additional functionality 
            /// for the <component> custom element in templates
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

        , render: function Component$render(target, rerender) {
            ///<summary>
            /// Appends the DOM for this component to the DOM element specified by <paramref name="target">target</paramref>.
            /// If <paramref name="target">target</paramref> is null/undefined and <paramref name="rerender">rerender</paramref> is
            /// true, the DOM representation of the Component will be regenerated in place.
            /// If <paramref name="target">target</paramref> is null/undefined and <paramref name="rerender">rerender</paramref> is
            /// false, the DOM representation of the Component will be removed from the DOM.
            ///</summary>
            ///<param name="target">The DOM element to append this Component to.</param>
            ///<param name="rerender">Whether or not to recreate the DOM for this component.</param>
            var oldSource;
            if (rerender) {
                if (this._source) {
                    oldSource = this._source;

                    this.tearDownComponents();

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
        , rerender: function Component$rerender() {
            ///<summary>
            /// Rerenders the DOM Element for a component. This is a shortform for
            /// component.render(null, true);
            ///</summary>
            this.render(null, true);
        }
        , detachElement: function Component$detachElement() {
            ///<summary>
            /// Detaches the DOM element for this component. This is a shortform for
            /// component.render(null, false);
            ///</summary>
            this.render(null, false);
        }
        , constructElement: function Component$constructElement() {
            ///<summary>
            /// Constructs a DOM Fragment representing the visual look for the Component.
            /// Child Components should also be instantiated and referenced in this method.
            ///</summary>

            // for once jQuery is not our friend. It parses the incoming string and turns it into something
            // that all browsers will load correctly without regard for the correct nesting rules of elements
            // this unfortunately conflicts with our abuse of SCRIPT for mustache.
            var htmlFrag = this._processTemplates(),
                domFrag,
                self = this;

            if ($.browser.msie) {
                domFrag = innerShiv(htmlFrag);
            } else {
                domFrag = document.createDocumentFragment();
                $.each($.clean([htmlFrag.trim()], undefined, null, null),
                    function (index, element) { domFrag.appendChild(element); });
            }

            if (domFrag.firstChild != domFrag.lastChild) {
                // this is more of a guard condition. components *must* have a single topmost node
                this._source = $('<div />').append(domFrag);
            } else {
                this._source = $(domFrag.firstChild);
            }

            this._generateDOMReferences();
        }
        , ensureElement: function Component$ensureElement() {
            ///<summary>
            /// Guarantees the existence of the DOM Fragment for this component.
            /// This method is intended to support the Component infrastructure. Call this
            /// method if there is a particular code fragment that explicitly depends on the
            /// DOM for the Component being present.
            ///</summary>
            if (!this._source) {
                this.constructElement();

                this._instantiateChildComponents();
                this.bindEvents();

                this._setDomId();
                this._updateCssClass();
                this.tabIndex(this.tabIndex()); // make sure tabIndex is present on the DOM if necessary

                this._hookWindowResize();

                // create a two-way relationship between the component and the DOM
                this._source.data(DOMCOMPONENTMETA, this);

                this.onComponentReady();
            }
        }
        , _generateDOMReferences: function Component$_generateDOMReferences() {
            if (!this._options.autoDOMReferences) {
                return;
            }

            var self = this;
            this._source.find('[name]:not(component)').each(function (index, elem) {
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
        , element: function Component$element() {
            ///<summary>
            /// Returns a reference to the DOM Element for a Component.
            ///</sumamry>
            ///<remarks>
            /// Note that the element may be detached from the document so layout calculations
            /// should be done via the onAttached callback method.
            ///</remarks>
            this.ensureElement();
            return this._source;
        }
        , isAttached: function Component$isAttached() {
            ///<summary>
            /// Determines whether or not the document element is an
            /// ancestor for the DOM element of this component.
            ///</summary>
            if (!this._source) return false;

            var parentChain = this.element().parents();
            return parentChain.length > 0 && parentChain[parentChain.length - 1].tagName === 'HTML';
        }
        , updateAttachment: function Component$updateAttachment() {
            ///<summary>
            /// Update the DOM attachment of the component. Use this method if you are
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

        , _notifyAttachment: function Component$_notifyAttachment() {
            this._isAttached = true;

            this.onAttached();

            $.each(this._children, function (index, child) {
                child._notifyAttachment();
            });
        }
        , _notifyDetachment: function Component$_notifyDetachment() {
            this._isAttached = false;

            this.onDetached();

            $.each(this._children, function (index, child) {
                child._notifyDetachment();
            });
        }

        , bindEvents: function Component$bindEvents() {
            ///<summary>
            /// Called by the DOM construction method of the Component base class to allow
            /// Component authors to bind events onto DOM elements.
            ///</summary>
            ///<remarks>
            /// This method is called after all child components have been instantiated, so component
            /// events can be consumed as well.
            ///</remarks>

            // Default Implementation is basically abstract since there is nothing to bind unto.
        }

        , onComponentReady: function Component$onComponentReady() {
            ///<summary>
            /// Callback function that gets called when the component has finished the rendering process.
            /// Note that this callback gets invoked after every time the root element is reconstructed (rerendered)
            ///</summary>

            // Default Implementation is basically abstract since there is nothing to bind unto.
        }

        , onAttached: function Component$onAttached() {
            ///<summary>
            /// Callback function that gets called when the component's root element is attached to the DOM document.
            /// Note that this callback is only called if the component (or a parent of) is attached via the
            /// render/detachElement methods and not through an explicit DOM attachment since there is no way to detect
            /// that in a cross-browser fashion. In addition, the selective nature of this callback can be used to 
            /// do things without the components knowledge if need be.
            ///</summary>

            // By default, nothing interesting happens when the component becomes attached.
        }
        , onDetached: function Component$onDetached() {
            ///<summary>
            /// Callback function that gets called when the component's root element is detached from the DOM document.
            /// Note that this callback is only called if the component (or a parent of) is detached via the
            /// render/detachElement methods and not through an explicit DOM detachment since there is no way to detect
            /// that in a cross-browser fashion. In addition, the selective nature of this callback can be used to 
            /// do things without the components knowledge if need be.
            ///</summary>

            // By default, nothing interesting happens when the component becomes detached.
        }

        , _hookWindowResize: function Component$_hookWindowResize() {
            ///<summary>
            /// Hooks the window.onresize event if an ancestor of this component hasn't already
            /// hooked it.
            ///</summary>
            if (!this._isResizeAutotriggered()) {
                // did the component developer implement the special onResize method?
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

        , onWindowResize: function Component$onWindowResize() {
            ///<summary>
            /// Internal DOM event handler. Handles the window.onresize event 
            /// and performs the necessary machination to bootstrap a recursive resize event in the Component tree
            ///</summary>
            if (this._currheight !== document.documentElement.clientHeight ||
                this._currwidth !== document.documentElement.clientWidth) {

                this._onResize$debounced();
            }
            this._currheight = document.documentElement.clientHeight;
            this._currwidth = document.documentElement.clientWidth;
        }

        , _isResizeAutotriggered: function Component$_isResizeAutotriggered() {
            ///<summary>
            /// If an ancestor in the component hierarchy implements an onResize function,
            /// the onResize method of this component will be auto triggered either as part of a DOM triggered
            /// window.onresize, a manually triggered window.onresize, or a branch onResize (via trigger_resize)
            ///</summary>
            for (var p = this.parent(); p; p = p.parent()) {
                if (p.onResize) {
                    return true;
                }
            }

            return false;
        }

        , _onResize: function Component$_onResize() {
            ///<summary>
            /// Performs a recursive walk of the descendents of this component calling onResize
            /// if it exists on the descendent.
            ///</summary>
            if (this.onResize && this._isAttached) {
                // the source element has to be attached to the main DOM tree (i.e. be visible) before
                // resizing makes sense
                this.onResize();
            }

            $.each(this._children, function (index, child) {
                child._onResize();
            });
        }

        /*, onResize: function Component$onResize() {
        ///<summary>
        /// onResize is an "optional" member of this class. If it is implemented, the Component 
        /// library will trigger it as part of a ancestor->descendants walk when listening to the
        /// window.onresize event.
        /// This function *must* be synchronous for the nested children to resize properly.
        ///</summary>
        }*/

        , trigger_resize: function Component$trigger_resize(deferred) {
            ///<summary>
            /// Triggers a resize event with this component at the root of the component hierarchy
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
		, trigger_valid: function Component$trigger_valid() {
		    ///<summary>
		    /// Triggers the "valid" event.
		    ///</summary>
		    ///<remarks>
		    /// Note that this method is meant to support component authors and should rarely be used
		    /// by component consumers.
		    ///</remarks>
		    var e = new ValidationEventArgs(arguments);

		    $(this).trigger('valid', e);

		    if (!e.isPropagationStopped() && this.parent()) {
		        this.parent()._valid(true);
		    }

		}
		, trigger_invalid: function Component$trigger_invalid() {
		    ///<summary>
		    /// Triggers the "valid" event.
		    ///</summary>
		    ///<remarks>
		    /// Note that this method is meant to support component authors and should rarely be used
		    /// by component consumers.
		    ///</remarks>
		    var e = new ValidationEventArgs(arguments);

		    $(this).trigger('invalid', e);

		    if (!e.isPropagationStopped() && this.parent()) {
		        this.parent()._valid(false);
		    }
		}
		, valid: function Component$valid(/*value*/) {
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
		, validate: function Component$validate() {
		    ///<summary>
		    /// Validate the contents of this component, triggering valid/invalid events
		    /// as necessary.
		    ///</summary>

		    this._computeValidityState();

		    if (this._isValid) {
		        this.trigger_valid(this);
		    } else {
		        this.trigger_invalid(this);
		    }
		}
		, validationContext: function Component$validationContext() {
		    ///<summary>
		    /// A JS object representation of the properties of this component that are needed
		    /// to test validity.
		    ///</summary>
		    return null;
		}
		, validationTarget: function Component$validationTarget() {
		    ///<summary>
		    /// Returns the DOM element that acts as the user-visible validation site.
		    /// The validation infrastructure will use this DOM element to show hints/notes
		    /// to the end user about why the component is in an invalid state.
		    ///</summary>
		    return this.element();
		}
        , _computeValidityState: function Component$_computeValidityState() {
            ///<summary>
            /// Check that all children are valid.  If one is invalid, then the component
            /// itself is invalid	
            ///</summary>

            var isValid = true;

            if (this.listenToChildrenValidity()) {
                $.each(this._children, function (index, child) {
                    if (!child.valid()) {
                        isValid = false;
                        return false;
                    };
                });
            }

            this._isValid = isValid;
        }
		, _valid: function Component$_valid(/*value*/) {
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
		, listenToChildrenValidity: function Component$listenToChildrenValidity(/*value*/) {
		    ///<summary>
		    /// Determines whether or not validity of this component should be the LOGICAL AND of the validity
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

        /* BEGIN Component Life Cycle */

        , tearDownComponents: function Component$tearDownComponents() {
            ///<summary>
            /// Dispose all the children and null out any extra references to them
            ///</summary>
            $.each(this._autogenUnbinds, function (index, entry) {
                $(entry.component).unbind(entry.evt, entry.fn);
            });
            this._autogenUnbinds.length = 0;

            $.each($.merge([], this._children), function (index, child) {
                child.dispose();
            });
            this._children.length = 0;

            $.each($.merge(this._autogenChildren, this._autogenRefs), $.proxy(function (index, prop) {
                delete this[prop];
            }, this));
            this._autogenChildren.length = 0;
            this._autogenRefs.length = 0;
        }

        , dispose: function Component$dispose() {
            ///<summary>
            /// By default, recursively disposes of its children and then
            /// removes the component out of the DOM and parent's children list
            /// and unwires any event handlers as necessary. If a component binds onto a
            /// DOM event for an element that is not a descendant of the root of the component,
            /// then that DOM element must be manually unbound. Similarly, if a component gets
            /// bound unto a non-DOM Event, then that event needs to be manually unbound *unless*
            /// that event is bound using the declarative syntax.
            ///</summary>
            ///<remarks>
            /// Note that the fragment removed from the DOM is not actually disposed until 
            /// after the Garbage Collector gets around to it.
            ///</remarks>

            this.tearDownComponents();

            if (!this._isResizeAutotriggered()) {
                // did the component developer implement the special onResize method?
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

        /* END Component Life Cycle */
    }
    Component.prototype.constructor = Component;
    vsc.Component = Component;

    /* BEGIN Static Methods */

    Component.create = function (url, options) {
        ///<summary>
        /// Instantiates a copy of the component located at url with the given options.
        ///</summary>
        ///<param name="url" type="String">The URL to load the Component from.</param>
        ///<param name="options" type="Object" mayBeNull="true" optional="true">The options to initialize the component with</param>
        ///<returns type="Vastardis.UI.Components.Component" />
        return ComponentFactory2.create(url, options);
    }

    Component.measureString = function (string, styles) {
        ///<summary>
        /// Returns the pixel dimensions of the given string with the given styles applied.
        ///</summary>
        ///<param anme="string" type="String">The string to measure.</param>
        ///<param name="styles" optional="true">
        /// The styles to apply to the string when measuring. This is an object literal (or DOMNode.style object) with 
        /// the following optional fields: 'fontFamily', 'fontSize', 'fontStyle', fontVariant', 'fontWidth'
        /// All other fields will be ignored
        ///</param>
        ///<param name="element" optional="true">
        /// The DOM element to copy styles from.
        ///</param>
        ///<returns>An object with width and height properties which contain the measurement of the DIV in pixels</returns>
        ///<remarks>
        ///Note: Either the styles or element argument must be supplied, but not both.
        ///Note: This function is very slow. Use it judisiously.
        ///</remarks>
        return Component.bulkMeasureString([string], styles)[0];
    }

    Component.bulkMeasureString = function (strs, styles) {
        ///<summary>
        /// Returns the pixel dimensions of a set of strings with the given styles applied.
        ///</summary>
        ///<param name="strs">The strings to measure.</param>
        ///<param name="styles" optional="true">
        /// The styles to apply to the string when measuring. This is an object literal (or DOMNode.style object) with 
        /// the following optional fields: 'fontFamily', 'fontSize', 'fontStyle', fontVariant', 'fontWidth'
        /// All other fields will be ignored
        ///</param>
        ///<param name="element" optional="true">
        /// The DOM element to copy styles from.
        ///</param>
        ///<returns>
        /// An array of objects with width and height properties which contain 
        /// the measurement of the DIV in pixels
        /// </returns>
        ///<remarks>
        ///Note: Either the styles or element argument must be supplied, but not both.
        ///Note: This function is very slow. Use it judisiously.
        ///</remarks>
        var i, n,
			result = [];

        attachMeasurementDiv(styles);

        for (i = 0, n = strs.length; i < n; ++i) {
            result.push(internalMeasureString(strs[i]));
        }

        detachMeasurementDiv();

        return result;
    }

    Component.cropString = function (string, targetWidth, styles) {
        ///<summary>
        /// Crops a string to a given pixel length, adding ellipsis (...) onto the end.
        ///</summary>
        ///<param name="string">The string to crop</param>
        ///<param name="targetWidth">The pixel length to crop against. Strings longer than this value will be cropped</param>
        ///<param name="styles" optional="true">
        /// The styles to apply to the string when measuring. This is an object literal (or DOMNode.style object) with 
        /// the following optional fields: 'fontFamily', 'fontSize', 'fontStyle', fontVariant', 'fontWidth'
        /// All other fields will be ignored
        ///</param>
        ///<param name="element" optional="true">
        /// The DOM element to copy styles from.
        ///</param>
        ///<returns>The cropped string or the empty string if none of the text fits</returns>
        ///<remarks>
        ///Note: Either the styles or element argument must be supplied, but not both.
        ///Note: This function is very slow. Use it judisiously.
        ///</remarks>
        var start, end,
			bisection, partial = string,
			width;

        attachMeasurementDiv(styles);

        width = internalMeasureString(partial).width;
        if (width > targetWidth) {
            start = 0;
            end = string.length;

            do {
                bisection = start + Math.ceil((end - start) / 2);
                partial = string.substring(0, bisection) + '...';
                width = internalMeasureString(partial).width;

                if (width > targetWidth) {
                    end = bisection;
                } else {
                    start = bisection;
                }
            } while (end - start > 1);
        }

        // if the result will effectively be empty, 
        // then return the empty string
        if (start === 0 && end === 1 && width > targetWidth) {
            partial = '';
        }

        detachMeasurementDiv();

        return partial;
    }

    /* END Static Methods */

    /* BEGIN String Measurement Helpers */

    var borrowStyles = 'fontFamily fontSize fontStyle fontVariant fontWeight'.split(' '),
		measurementDiv = document.createElement('div');

    measurementDiv.style.top = '0px';
    measurementDiv.style.left = '0px';
    measurementDiv.style.visibility = 'hidden';
    measurementDiv.style.position = 'absolute';

    function attachMeasurementDiv(styles) {
        var styles_t;

        styles = styles || document.body;
        styles_t = typeof styles;

        if (styles_t === 'string') {
            measurementDiv.style.font = styles;
        } else if (styles_t === 'object') {
            if (styles.nodeType) {
                if (styles.currentStyle) {
                    // for IE
                    styles = styles.currentStyle;
                } else {
                    // for Standards Complaint browsers
                    styles = document.defaultView.getComputedStyle(styles, null);
                }
            }

            copyStyles(styles);
        }

        document.body.appendChild(measurementDiv);
    }

    function detachMeasurementDiv() {
        var i, n;

        document.body.removeChild(measurementDiv);

        measurementDiv.style.font = 'inherit';
        for (i = 0, n = borrowStyles.length; i < n; ++i) {
            measurementDiv.style[borrowStyles[i]] = '';
        }
    }

    function copyStyles(styles) {
        var i, n, key;

        for (i = 0, n = borrowStyles.length; i < n; ++i) {
            key = borrowStyles[i];

            measurementDiv.style[key] = styles[key] || '';
        }
    }

    function internalMeasureString(str) {
        function escapeHtml(str) {
            return ('' + str)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
        }

        measurementDiv.innerHTML = escapeHtml(str);
        bounds = measurementDiv.getBoundingClientRect();

        return {
            width:
				bounds.width ? bounds.width : (bounds.right - bounds.left)
			, height:
				bounds.height ? bounds.height : (bounds.bottom - bounds.top)
        };
    }

    /* END String Measurement Helpers */

    var ComponentFactory2 = {
        _loadedComponents: {}
        , _resolutionCache: null
        , _headDom: null // frequently accessed DOM element, cache it
        , _canonicalizationDiv: null

        , create: function ComponentFactory$create(url, options) {
            ///<summary>
            /// Instantiates a copy of the component located at url with the given options.
            ///</summary>
            ///<param name="url" type="String">The URL to load the Component from.</param>
            ///<param name="options" type="Object" mayBeNull="true" optional="true">The options to initialize the component with</param>
            ///<returns type="Vastardis.UI.Components.Component" />
            var componentClass, canonUrl = this.canonicalize(url);

            this._loadDependency(canonUrl, true);

            componentClass = this._loadedComponents[canonUrl];
            if (!componentClass) {
                // if at this point, the loadedComponents does not have something inside,
                // it means that the url does not reference an instantiatable component.
                throw new Error(url + ' does not reference an instantiatable Component.');
            }

            return $.extend(new componentClass(options || {}), { __instantiatedTypeUrl: url });
        }
        , canonicalize: function ComponentFactory$canonicalize(url) {
            ///<summary>
            /// Creates a absolute url out of the passed in url.
            ///</summary>
            ///<param name="url" type="String">The URL to canonicalize.</param>
            ///<remarks>
            /// from http://grack.com/blog/2009/11/17/absolutizing-url-in-javascript/ by Matt Mastracci
            /// CC by Attribution 3.0
            /// adapted to use one time lazy initialization.
            ///</remarks>
            if (!this._canonicalizationDiv) {
                this._canonicalizationDiv = document.createElement('div');
            }

            var div = this._canonicalizationDiv;
            div.innerHTML = '<a></a>';
            div.firstChild.href = url; // Ensures that the href is properly escaped
            div.innerHTML = div.innerHTML; // Run the current innerHTML back through the parser
            return div.firstChild.href;
        }
        , _loadDependency: function ComponentFactory$loadDependency(url, isCanon) {
            ///<summary>
            /// Loads JavaScript dependencies for a given component from the specified URL.
            ///</summary>
            ///<param name="url" type="String">The URL to load dynamically.</param>
            ///<param name="isCanon" type="Boolean">Whether or not the url is already canonicalized</param>

            this._prepopulateResolutionCache();

            if (!isCanon) {
                url = this.canonicalize(url);
            }
            if (!this._resolutionCache[url]) {
                this._resolutionCache[url] = true;
                $.ajax({
                    url: url
                    , dataType: 'script'
                    , async: false
                    , cache: true
                });
            }
        }
        , _addStylesheet: function ComponentFactory$addStylesheet(url, byteStream) {
            ///<summary>
            /// Associates a stylesheet with a given url, adding the stylesheet to the DOM.
            ///</summary>
            ///<param name="url" type="String">The URL to associate the stylesheet with.</param>
            ///<param name="byteStream" type="String">The CSS stylessheet to add to the DOM</param>
            url = this.canonicalize(url);

            this._prepopulateResolutionCache();

            if (this._resolutionCache[url]) {
                return;
            }

            this._resolutionCache[url] = true;

            if (!this._headDom) {
                this._headDom = $('head', document);
            }

            if ($.browser.msie) {
                var joinedResult,
                    style$ = $('style#__componentInfrastructure', this._headDom);

                if (style$.length !== 0) {
                    joinedResult = style$.data('stylesheets') + '\n' + byteStream;
                    style$.remove();
                } else {
                    joinedResult = byteStream;
                }

                $('<style id="__componentInfrastructure" type="text/css">' + joinedResult + '</style>')
                    .data('stylesheets', joinedResult)
                    .appendTo(this._headDom);
            } else {
                this._headDom.append('<style type="text/css">' + byteStream + '</style>');
            }
        }
        , _prepopulateResolutionCache: function ComponentFactory$_prepopulateResolutionCache() {
            if (!this._resolutionCache) {
                this._resolutionCache = {};
            }

            var self = this;

            $('script[src]').each(function () {
                self._resolutionCache[self.canonicalize($(this).attr('src'))] = true;
            });
        }
    };
    vsc.ComponentFactory2 = ComponentFactory2;

    $.fn.component = function () {
        ///<summary>
        /// Returns the components that back the elements in a particular jQuery list of elements.
        /// This method is useful if you have a reference to the DOM elememt of a component,
        /// but not the component itself.
        ///</summary>
        ///<returns>

        /// If none of the elements have a backing component, then returns undefined.
        /// If only one of the elements has a component, then that component is returned.
        /// If some/all of the elements have a component, then the input array is mapped into an
        /// array where elements have a component are populated
        ///</returns>

        var components = $.map(this, function (element, index) {
            return $(element).data(DOMCOMPONENTMETA);
        });

        switch (components.length) {
            case 0:
                return undefined;
            case 1:
                return components[0];
            default:
                return components;
        }
    }

    /* CAPTURING EVENTS */

    // this is a list of valid events to capture. Because there is some overhead involved
    // in having the capturing "infrastructure" in place, this list should be kept as small
    // as possible.
    var capturables = ['mousedown'];

    var captureSinks = {};

    // creates a capturing variant of the passed in eventArgs object
    function createCapturedEventArgs(eventArgs) {
        var expando = eventArgs[$.expando];
        delete eventArgs[$.expando];

        var evt = $.event.fix(eventArgs);
        evt.type = 'captured' + eventArgs.type;
        evt.originalEvent = eventArgs;
        evt.originalTarget = eventArgs.target;

        eventArgs[$.expando] = expando;

        return evt;
    }

    // the jQuery goo necessary for making capturing events work.
    $.each(capturables, function (index, evtName) {
        captureSinks[evtName] = [];
        captureSinks[evtName].peek = function () { return this[this.length - 1]; };

        $.event.special[evtName] = {
            add: function (handleObj) {
                var oldHandler = handleObj.handler;

                handleObj.handler = function (eventArgs) {
                    if ((captureSinks[evtName] || []).length > 0) {
                        var retVal;

                        if (!$(eventArgs.originalEvent).data('executedCapture')) {
                            $(eventArgs.originalEvent).data('executedCapture', true);
                            if ($.browser.msie) {
                                eventArgs.originalEvent[$.expando] = undefined;
                            } else {
                                delete eventArgs.originalEvent[$.expando];
                            }

                            evt = createCapturedEventArgs(eventArgs);

                            $(captureSinks[evtName].peek().element).trigger(evt);

                            retVal = evt.result;
                        }

                        if (!eventArgs.isPropagationStopped()) {
                            retVal = oldHandler.apply(this, arguments);
                        }

                        return retVal;
                    } else {
                        return oldHandler.apply(this, arguments);
                    }
                };
            }
        };
    });

    window.captureEvent = function (eventName, element, handler) {
        ///<summary>
        /// When an event is "captured", all future instances of that event will first get routed through the
        /// element who called for the capture before bubbling up the DOM tree as usual. This allows the
        /// captor element to inspect the incoming event and either mutate it, or perform a specific action
        /// in response to an event that is "outside" of its DOM.
        /// Once an event is captured, if that event is triggered, the matching 'captured' version of that event
        /// is triggered on the captor element. So for example, if you capture the 'mousedown' event with element x,
        /// a 'capturedmousedown' event is first triggered on element x before the usual mousedown trigger and bubble.
        /// Note that captured events "stack", meaning that if an existing captor exists for an event and that event
        /// is captured again, a subsequent releaseEvent call will reroute events to that captor.
        ///
        /// This functionality is based on the WIN32 SetCapture API which routes all mouse events through a particular
        /// window. For more information: http://msdn.microsoft.com/en-us/library/ms646262%28VS.85%29.aspx
        ///</summary>
        ///<param name="eventName">The name of the DOM event to capture.</param>
        ///<param name="element">The DOM element that is designated as the captor.</param>
        ///<param name="handler">
        /// [OPTIONAL] The function to call that will inspect the captured event.
        /// When the handler is bound through this function, it will be unbound when calling releaseEvent.
        /// Otherwise, you can bind the handler manually by writing $(element).bind('captured' + eventName', function(eventArgs) {});
        /// The eventArgs.originalTarget contains the DOM element that initially triggered the event.
        /// </param>
        ///</remarks>
        /// Although it is highly recommended that the element argument be an actual DOM element, the code
        /// does not make this check and the parameter can just as easily be an object literal. This functionality
        /// is not tested and should be avoided.
        ///</remarks>
        if (typeof (captureSinks[eventName]) === 'undefined') {
            // if event is not captured, then there is nothing to do
            return;
        }

        if (captureSinks[eventName].length > 0) {
            // if an existing capture exists, disable the capture
            $(captureSinks[eventName].peek().element).unbind('captured' + eventName + '.capturingTool');
        }

        captureSinks[eventName].push({ element: element, handler: handler });
        if (typeof (handler) === 'function') {
            $(element).bind('captured' + eventName + '.capturingTool', handler);
        }

        if (captureSinks[eventName].length === 1) {
            // if this is the first capture to get added, then hook the final source
            $(document.body).bind(eventName + '.capturingTool', function (eventArgs) {
                // if the originating event bubbled all the way up to the document node,
                // then perhaps no interested consumers exist for the event, which means
                // the event filter won't be installed.
                // but we have to funnel the event to the appropriate capture sink anyways
                // so do that here.
                if (!$(eventArgs.originalEvent).data('executedCapture')) {
                    $(captureSinks[eventName].peek()).trigger(createCapturedEventArgs(eventArgs));
                }
            });
        }
    }

    window.releaseEvent = function (eventName) {
        ///<summary>
        /// Releases the current capture on the event specified by eventName.
        /// If eventName is not captured, this function is effectively a no-op.
        ///</summary>
        ///<param name="eventName">The captured event to release</param>
        var sink;

        if ((captureSinks[eventName] || { length: 0 }).length === 0) {
            // if eventName is not captured, or the stack is empty
            // then there is nothing to do
            return;
        }

        sink = captureSinks[eventName].pop();
        $(sink.element).unbind('captured' + eventName + '.capturingTool');

        if (captureSinks[eventName].length === 0) {
            // if this was the last capture, then remove the final source
            $(document.body).unbind(eventName + '.capturingTool');
        } else {
            // if there were captures we stacked on, rebind
            sink = captureSinks[eventName].peek();
            if (typeof (sink.handler) === 'function') {
                $(sink.element).bind('captured' + eventName + '.capturingTool', sink.handler);
            }
        }
    }
})(jQuery);
