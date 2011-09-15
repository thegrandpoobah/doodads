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
(function ($, undefined) {
    var zManager = function (options) {
        ///<summary>
        /// This object maintains an ordered list of DOM elements and ensures that they are ordered
        /// back-to-front in the browser's z-ordering. The list is live, which means that any modification to the list
        /// results in an update to the browser's DOM.
        ///</summary>
        this._list = [];
        this._options = $.extend(zManager.defaultOptions, options);
    }
    zManager.defaultOptions = {
        ///<summary>
        /// The value to start the z-index from. 
        ///</summary>
        basis: 1
    };
    zManager.prototype = {
        add: function zManager$add(element, index) {
            ///<summary>
            /// Adds an element to the managed z-index list. Once managed, an element is guaranteed to have a z-index
            /// larger than its predecessor and smaller than its successor. If the element is already managed
            /// the element is moved to its new location in the z-index list. 
            ///</summary>
            ///<param name="element">The element to insert into the managed z-index list.</param>
            ///<param name="index" optional="true">At which layer to insert the element. If omitted, the element will be added as the top-most layer.</param>
            var existingIndex = this._find(element), entry;

            if (existingIndex !== null) {
                // if it already exists, splice it out
                entry = this._list.splice(existingIndex, 1)[0];
            }

            if (!entry) {
                entry = {
                    element: element
                    , layer: 0
                    , unmanagedIndex: $(element).css('z-index') // remember what the unmanaged value of z-index was
                };
            } else {
                entry.layer = 0;
            }

            if (typeof index === 'undefined') {
                this._list.push(entry);
                this._updateZIndexes(this._list.length - 1);
            } else {
                this._list.splice(index, 0, entry);
                this._updateZIndexes(index);
            }
        }
		, remove: function zManager$remove(element) {
		    ///<summary>
		    /// Removes an element from the managed z-index list.
		    ///</summary>
		    var existingIndex = this._find(element);

		    if (existingIndex !== null) {
		        // if it already exists, splice it out
		        $(element).css('z-index', this._list[existingIndex].unmanagedIndex); // recall unmanaged value of z-index
		        this._list.splice(existingIndex, 1);
		    }
		}

		, bringToFront: function zManager$bringToFront(element) {
		    ///<summary>
		    /// Brings an element to the front of the z-index list, ensuring it is the top-most object in the z stack.
		    /// This is just a short form for this.add(element);
		    ///</summary>
		    this.add(element);
		}
		, moveToBack: function zManager$moveToBack(element) {
		    ///<summary>
		    /// Moves an element to the back of the z-index list, ensuring it is the bottom-most object in the z stack.
		    /// This is just a short form for this.add(element, 0);
            ///</summary>
		    this.add(element, 0);
		}

		, maxZIndex: function zManager$maxZIndex() {
		    ///<summary>
		    /// Returns the maximum z-index value issued by the manager.
		    ///</summary>
		    return this._list[this._list.length - 1].layer;
		}

        , _find: function zManager$_find(element) {
            var existingIndex = null;

            $.each(this._list, function (i, e) {
                if (e.element === element) {
                    existingIndex = i;
                    return false;
                }
            });

            return existingIndex;
        }

		, _updateZIndexes: function zManager$_updateZIndexes(index) {
		    var curr, prev, next,
                first = true;

		    curr = this._list[index];
		    if (index !== 0) {
		        prev = this._list[index - 1];
		    } else {
		        prev = { layer: this._options.basis - 1 };
		    }

		    if (index !== this._list.length - 1) {
		        next = this._list[index + 1];
		    }

		    while (curr) {
		        if (curr.layer <= prev.layer || first) {
		            // curr is behind prev, even though it should be ahead
		            curr.layer = prev.layer + 1;
		            $(curr.element).css('z-index', curr.layer);

		            first = false;
		        }

		        if (next && next.layer > curr.layer) {
		            // next is ahead of curr's new value, so the rest of the list is 
		            // ordered correctly
		            break;
		        }

		        prev = curr;
		        curr = next;

		        index++;

		        if (index !== this._list.length - 1) {
		            next = this._list[index + 1];
		        } else {
		            next = null;
		        }
		    }
		}
    };

    // The z manager is a singleton
    window.zManager = new zManager();
})(jQuery);