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
    Vastardis.UI.Components.ComponentFactory2 = ComponentFactory2;
})(jQuery);
