doodads.setup('core:List.doodad', [jQuery])(function(builder, base, $) {
	var FILTER_RESET_DEBOUNCE_TIME = 1000; // in ms
	
	builder.constructor(function () {
		this._selectionSet = [];

		this._modifierComboMode = '_addToSelection';
		this._rangeAnchorItem = null;
		this._keyboardNavItem = null;

		this._hasInputFocus = false;

		this._filterStr = '';
		this._filterRepeatCount = 0;
		this.killFilter$debounced = doodads.debounce(this.killFilter, FILTER_RESET_DEBOUNCE_TIME, this);

		this.onFocus$proxy = doodads.proxy(this.onFocus, this);
		this.onBlur$proxy = doodads.proxy(this.onBlur, this);
		this.onKeyDown$proxy = doodads.proxy(this.onKeyDown, this);
		this.onItemClick$proxy = doodads.proxy(this.onItemClick, this);
		this.onItemdblClick$proxy = doodads.proxy(this.onItemdblClick, this);
		this.onBackgroundClick$proxy = doodads.proxy(this.onBackgroundClick, this);
		this.onModelChanged$proxy = doodads.proxy(this.onModelChanged, this);
	}).defaultOptions({
		multiselect: true,
		tabIndex: 0
	}).proto({
		cssClassPrefix: function ListView$cssClassPrefix() {
			return 'listView';
		},
		bindEvents: function ListView$bindEvents() {
			this.element()
				.focus(this.onFocus$proxy)
				.blur(this.onBlur$proxy)
				.keydown(this.onKeyDown$proxy)
				.delegate('li', 'click', this.onItemClick$proxy)
				.delegate('li', 'dblclick', this.onItemdblClick$proxy)
				.bind('click', this.onBackgroundClick$proxy)
				.bind('selectstart', function () {
					return false
				}); // disable text selection in IE
		},
		onComponentReady: function ListView$onComponentReady() {
			this.bind('modelChanged', this.onModelChanged$proxy);
		},
		dataSource: function ListView$dataSource() {
			var retVal = base.dataSource.apply(this, arguments);

			if (arguments.length > 0 && this.count() > 0) {
				// if we set, and the number of elements is greater than 0, update the kayboard nav item
				this._keyboardNavItem = this.item(0);
				if (this._source) {
					this._setKeyboardNavItem(this._keyboardNavItem);
				}
			}

			return retVal;
		}

		,
		hasInputFocus: function ListView$hasInputFocus() {
			return this._hasInputFocus;
		}

		,
		_setKeyboardNavItem: function ListView$_setKeyboardNavItem(value) {
			this._keyboardNavItem = value;

			this.element()
				.find('.keyboardSelection,.keyboardSelectionInverted')
					.removeClass('keyboardSelection')
					.removeClass('keyboardSelectionInverted');

			if (this._keyboardNavItem !== null) {
				if (this._itemInSelectionSet(this._keyboardNavItem)) {
					this._itemMap[this.indexOf(this._keyboardNavItem)].domNode.addClass('keyboardSelection');
				} else {
					this._itemMap[this.indexOf(this._keyboardNavItem)].domNode.addClass('keyboardSelectionInverted');
				}
			}
		},
		_scrollKeyboardNavItemIntoView: function ListView$_scrollKeyboardNavItemIntoView() {
			if (this._keyboardNavItem === null) {
				// no keyboard nav item, so no scrolling necessary
				return;
			}

			var source = this.element(),
				domNode = this._itemMap[this.indexOf(this._keyboardNavItem)].domNode,
				itemBottom = domNode[0].offsetTop + domNode.outerHeight(),
				itemTop = domNode[0].offsetTop - source.find('> li:first-child')[0].offsetTop,
				containerBottom = source[0].scrollTop + source.height();

			if (itemBottom > containerBottom) {
				// out of the viewport (bottom side)
				source[0].scrollTop += itemBottom - containerBottom;
			} else if (itemTop < source[0].scrollTop) {
				// out of the viewport (top side)
				source[0].scrollTop = itemTop;
			}
			// otherwise inside the viewport so nothing to do
		}

		,
		selection: function ListView$selection( /*value, trigger*/ ) {
			if (arguments.length === 0) {
				return this._selectionSet;
			} else {
				if ($.isArray(this._selectionSet)) {
					this._selectionSet = arguments[0];
				} else {
					this._selectionSet = [arguments[0]];
				}

				this.element()
					.find('.selected,.selectedTop,.selectedBottom,.selectedTopBottom')
						.removeClass('selected')
						.removeClass('selectedTop')
						.removeClass('selectedBottom')
						.removeClass('selectedTopBottom');
						
				var indices = $.map(this._selectionSet, $.proxy(function (item) {
					return this.indexOf(item);
				}, this));
				
				indices.sort(function (a, b) {
					return a - b;
				}); // mostly sorted, but still
				
				if (indices.length > 1) {
					var current = 0,
						next = 1,
						nextHasTop = true, // first element should have top
						cssClassName;
						
					do {
						cssClassName = 'selected'; // always have background
						if (nextHasTop) {
							// element has top
							cssClassName += 'Top';
							nextHasTop = false;
						}

						if (current === indices.length - 1 || indices[next] - indices[current] > 1) {
							// last element OR
							// next element is disjointed, so have bottom
							cssClassName += 'Bottom';

							// disjointed element, the next element should have top
							nextHasTop = true;
						}

						this._itemMap[indices[current]].domNode.addClass(cssClassName);

						current = next;
						next++;
					} while (current < indices.length);
				} else if (indices.length === 1) {
					this._itemMap[indices[0]].domNode.addClass('selectedTopBottom');
				}

				if (arguments[1]) {
					this.trigger_changed();
				}
			}
		}

		,_filter: function ListView$_filter(ch) {
			var i;

			if (ch === this._filterStr) {
				this._filterRepeatCount++;
			} else {
				if (this._filterStr.length === 0) {
					this._filterStr = ch;
					this._filterRepeatCount = 1;
				} else {
					if (this._filterRepeatCount !== 0) {
						for (i = this._filterRepeatCount - 1; i !== 0; --i) {
							this._filterStr += this._filterStr.charAt(0);
						}
					}
					this._filterStr += ch;
					this._filterRepeatCount = 0;
				}
			}

			var matchSet = [];
			for (i = 0; i < this.count(); ++i) {
				if (this.item(i).text.substring(0, this._filterStr.length).toUpperCase() === this._filterStr) {
					matchSet.push(i);
				}
			}

			if (matchSet.length > 0) {
				var repeatCount = this._filterRepeatCount === 0 ? 1 : this._filterRepeatCount;
				var idx = matchSet[(repeatCount - 1) % matchSet.length];
				this._overrideSelection(idx);
				this._setKeyboardNavItem(this.item(idx));
				this._scrollKeyboardNavItemIntoView();
			}
		},
		killFilter: function ListView$killFilter() {
			this._filterStr = '';
			this._filterRepeatCount = 0;
		},
		
		onFocus: function ListView$onFocus() {
			this._hasInputFocus = true;
		},
		onBlur: function ListView$onBlur() {
			this._hasInputFocus = false;
		},
		
		_resetSelection: function ListView$_resetSelection() {
			this.selection([], true);
		},
		_overrideSelection: function ListView$_overrideSelection(start, end) {
			end = typeof (end) === 'undefined' ? start : end; // a single selection
			if (start > end) {
				// swap them in the case where the user moved above the anchor
				var temp = start;
				start = end;
				end = temp;
			}

			var newSelection = [];
			for (var i = start; i < end + 1; ++i) {
				newSelection.push(this.item(i));
			}
			this.selection(newSelection, true);
		},
		_addToSelection: function ListView$_addToSelection(start, end) {
			var addAfter, nI, temp, i, newSelection = this.selection();

			end = typeof (end) === 'undefined' ? start : end;

			if (start > end) {
				// swap them in the case where the user moved above the anchor
				temp = start;
				start = end;
				end = temp;
			}

			for (i = start; i < end + 1; ++i) {
				addAfter = true;
				nI = this.item(i);

				$.each(newSelection, $.proxy(function (index, sI) {
					if (sI === nI) {
						addAfter = false;
						return false; // break;
					}
				}, this));

				if (addAfter) {
					newSelection.push(nI);
				}
			}

			this.selection(newSelection, true);
		},
		_subtractFromSelection: function ListView$_subtractFromSelection(start, end) {
			var temp, removeAfter, i, newSelection = this.selection();

			end = typeof (end) === 'undefined' ? start : end;

			if (start > end) {
				// swap them in the case where the user moved above the anchor
				temp = start;
				start = end;
				end = temp;
			}

			newSelection = $.map(newSelection, $.proxy(function (sI) {
				removeAfter = false;

				for (i = start; i < end + 1; ++i) {
					if (sI === this.item(i)) {
						removeAfter = true;
						break;
					}
				}

				if (removeAfter) {
					return null;
				} else {
					return sI;
				}
			}, this));

			this.selection(newSelection, true);
		},
		_itemInSelectionSet: function ListView$_itemInSelectionSet(item) {
			var hadItem = false;

			$.each(this.selection(), function (idx, sI) {
				if (sI === item) {
					hadItem = true;
					return true;
				}
			});

			return hadItem;
		},
		_resetModifierComboMode: function ListView$_resetModifierComboMode() {
			this._modifierComboMode = '_addToSelection';
			this._setKeyboardNavItem(this._keyboardNavItem);
		},
		_setModifierComboMode: function ListView$_setModifierComboMode(item) {
			if (!this._itemInSelectionSet(item)) {
				this._modifierComboMode = '_addToSelection';
			} else {
				this._modifierComboMode = '_subtractFromSelection';
			}
		},

		onBackgroundClick: function ListView$onBackgroundClick(e) {
			if (e.target !== this.element()[0]) {
				// only continue if we explictly clicked on the parent element
				return;
			}

			this._resetSelection();
			this._resetModifierComboMode();
		},
		onItemdblClick: function ListView$onItemdblClick(e) {
			var itemIdx = this.indexOf($(e.currentTarget).data('metadata')),
				item = this.item(itemIdx),
				start;
			//Override the selection with item being double clicked
			this._overrideSelection(itemIdx);
			this.trigger_dblclick();

			e.preventDefault();
			e.stopPropagation();
		},
		onItemClick: function ListView$onItemClick(e) {
			var itemIdx = this.indexOf($(e.currentTarget).data('metadata')),
				item = this.item(itemIdx),
				start;

			if (this._options.multiselect) {
				if (e.metaKey && e.shiftKey) {
					// union or subtraction
					if (!this._rangeAnchorItem) {
						start = 0;
					} else {
						start = this.indexOf(this._rangeAnchorItem);
					}

					// [start,end] points to the range to add/subtract from the existing selection
					this[this._modifierComboMode](start, itemIdx);
				} else if (e.metaKey) {
					this._setModifierComboMode(item);

					this[this._modifierComboMode](itemIdx);

					this._rangeAnchorItem = item;
				} else if (e.shiftKey) {
					if (!this._rangeAnchorItem) {
						start = 0;
					} else {
						start = this.indexOf(this._rangeAnchorItem);
					}

					this._resetModifierComboMode();
					this._overrideSelection(start, itemIdx);
				} else {
					// neither
					this._resetModifierComboMode();
					this._overrideSelection(itemIdx);

					this._rangeAnchorItem = item;
				}
			} else {
				this._overrideSelection(itemIdx);

				this._rangeAnchorItem = item;
			}

			this._setKeyboardNavItem(item);
		},
		_keyboardIndex: function ListView$_keyboardIndex(delta, loopBack) {
			var idx;

			if (this._keyboardNavItem) {
				idx = this.indexOf(this._keyboardNavItem) + delta;
				if (idx > this.count() - 1) {
					if (loopBack) {
						idx = 0;
					} else {
						idx = this.count() - 1;
					}
				} else if (idx < 0) {
					if (loopBack) {
						idx = this.count() - 1;
					} else {
						idx = 0;
					}
				}
			} else {
				// set the selection to the last item
				if (delta > 0) {
					idx = 0;
				} else {
					idx = this.count() - 1;
				}
			}

			return idx;
		},
		onKeyDown: function ListView$onKeyDown(e) {
			function navigationHelper(delta) {
				if (this._options.multiselect) {
					if (e.metaKey && e.shiftKey) {
						// if shift is pressed, then use range anchor to find the range to select
						if (!this._rangeAnchorItem) {
							start = 0;
						} else {
							start = this.indexOf(this._rangeAnchorItem);
						}

						itemIdx = this._keyboardIndex(delta, false);

						this[this._modifierComboMode](start, itemIdx);
						this._setKeyboardNavItem(this.item(itemIdx));
					} else if (e.metaKey) {
						// if ctrl is pressed, then only move the input focus, do not change selection
						this._setKeyboardNavItem(this.item(this._keyboardIndex(delta, true)));
					} else if (e.shiftKey) {
						// if shift is pressed, then use range anchor to find the range to select
						if (!this._rangeAnchorItem) {
							start = 0;
						} else {
							start = this.indexOf(this._rangeAnchorItem);
						}

						itemIdx = this._keyboardIndex(delta, false);

						this._resetModifierComboMode();
						this._overrideSelection(start, itemIdx);

						this._setKeyboardNavItem(this.item(itemIdx));
					} else {
						// no modifiers, always overrides
						itemIdx = this._keyboardIndex(delta, true);

						this._resetModifierComboMode();

						item = this.item(itemIdx);
						this._rangeAnchorItem = item;

						this._overrideSelection(itemIdx);
						this._setKeyboardNavItem(item);
					}
				} else {
					// single select, always overrides
					itemIdx = this._keyboardIndex(delta, true);

					this._resetModifierComboMode();

					item = this.item(itemIdx);
					this._rangeAnchorItem = item;

					this._overrideSelection(itemIdx);
					this._setKeyboardNavItem(item);
				}

				this._scrollKeyboardNavItemIntoView();

				e.preventDefault();
			}

			var item, itemIdx, start, end;

			switch (e.which) {
				case doodads.keyCode.DOWN:
					navigationHelper.call(this, 1);
					break;
				case doodads.keyCode.UP:
					navigationHelper.call(this, -1);
					break;
				case doodads.keyCode.SPACE:
					// multiselect mode's activation function
					if (this._options.multiselect && this._keyboardNavItem) {
						if (e.shiftKey) {
							// if the shift key is held down do a range add/subtract
							if (this._rangeAnchorItem) {
								start = this.indexOf(this._rangeAnchorItem);
							} else {
								start = 0;
							}

							end = this.indexOf(this._keyboardNavItem);

							this[this._modifierComboMode](start, end);
						} else if (this._rangeAnchorItem !== this._keyboardNavItem) {
							// this condition is a little strange, but it basically says
							// that the inversion operation shouldn't happen when the two "cursors"
							// are lined up
							this._setModifierComboMode(this._keyboardNavItem);

							this[this._modifierComboMode](this.indexOf(this._keyboardNavItem));
						}

						this._rangeAnchorItem = this._keyboardNavItem;
					}
					break;
				case doodads.keyCode.TAB:
					// don't prevent tabbing
					break;
				case 65:
					// A
					if (e.metaKey) {
						// CTRL + A means select all
						this._overrideSelection(0, this.count() - 1);
						e.preventDefault();
						break;
					}
				default:
					var ch = String.fromCharCode(e.which);

					if (/\w|\s/.test(ch)) {
						this._filter(ch);
						this.killFilter$debounced(e);
					} else {
						this.killFilter(e);
					}

					e.preventDefault();
					e.stopPropagation();
					break;
			}
		},
		onModelChanged: function ListView$onModelChanged() {
			if (this._source === null) {
				return;
			}

			// realign selection with the change in the model
			var newSelection = $.map(this.items(), $.proxy(function (item) {
				if (this._itemInSelectionSet(item)) {
					return item;
				} else {
					return null;
				}
			}, this));
			this.selection(newSelection);

			// realign keyboard navigation with the change in the model
			if (this._keyboardNavItem !== null) {
				if (this.indexOf(this._keyboardNavItem) === -1) {
					// the item with the keyboard navigation got deleted
					// so reset the keyboard navigation to the first element
					// if the number of elements is zero, then set the keyboard navigation
					// to null
					if (this.count() > 0) {
						this._setKeyboardNavItem(this.item(0));
					} else {
						this._setKeyboardNavItem(null);
					}
				} else {
					// do an identity set for the styling side effects
					this._setKeyboardNavItem(this._keyboardNavItem);
				}
			}
		},
		
		trigger_changed: function ListView$trigger_changed() {
			this.trigger('changed');
		},
		trigger_dblclick: function ListView$trigger_dblclick() {
			this.trigger('dblclick');
		},
		
		dispose: function ListView$dispose() {
			this.unbind('modelChanged', this.onModelChanged$proxy);

			base.dispose.apply(this);
		}
	}).complete();
});
