doodads.setup().inherits('/doodads/List.doodad')(function(base) {
	var FILTER_RESET_DEBOUNCE_TIME = 1000; // in ms
	var activeDropDown = null;

	var createDefaultRequiredRule = function (invalidValue, message) {
		return function (context) {
			return {
				valid: context.index !== -1 && context.value !== invalidValue,
				message: message
			};
		};
	};

	this.constructor(function () {
		this._affordanceText = null;
		this._focused = false;
		this._enabled = true;
		this._cancelHover = false;
		this._isListVisible = false;
		this._isListPinned = false;
		this._watermark = this._options.watermark;
		this._selectedIndex = undefined;
		this._selectedItem = undefined;

		this._hoverTimer = null;
		this._hidingTimeout = null;

		this.onFocus$proxy = doodads.proxy(this.onFocus, this);
		this.onBlur$proxy = doodads.proxy(this.onBlur, this);

		this.onItemRendered$proxy = doodads.proxy(this.onItemRendered, this);
		this.onModelChanged$proxy = doodads.proxy(this.onModelChanged, this);
		this.onAffordanceMouseOver$proxy = doodads.proxy(this.onAffordanceMouseOver, this);
		this.onAffordanceMouseOut$proxy = doodads.proxy(this.onAffordanceMouseOut, this);
		this.onListMouseOver$proxy = doodads.proxy(this.onListMouseOver, this);
		this.onListMouseOut$proxy = doodads.proxy(this.onListMouseOut, this);
		this.onAffordanceMouseDown$proxy = doodads.proxy(this.onAffordanceMouseDown, this);
		this.onItemHover$proxy = doodads.proxy(this.onItemHover, this);
		this.onItemClick$proxy = doodads.proxy(this.onItemClick, this);
		this.onCapturedMouseDown$proxy = doodads.proxy(this.onCapturedMouseDown, this);
		this.onKeyDown$proxy = doodads.proxy(this.onKeyDown, this);
		this.killFilter$debounced = doodads.debounce(this.killFilter, FILTER_RESET_DEBOUNCE_TIME, this);

		this._filterStr = '';
		this._filterRepeatCount = 0;
		this._enabled = this._options.enabled;

		this.bind('itemRendered', this.onItemRendered$proxy);
		this.bind('modelChanged', this.onModelChanged$proxy);
	}).defaultOptions({
		tabIndex: 0,
		enabled: true,
		invalidValue: 0,
		showOnHover: false, // true => Type1, false => Type2
		showAfter: 500, // in ms
		watermark: ''
	}).proto({
		onReady: function DropDown$onReady() {
			base.onReady.apply(this, arguments);

			if (this._options.required && this._options.validates) {
				this.required(true, createDefaultRequiredRule(this._options.invalidValue, ''));
			}

			var tempEnabled = this._enabled;
			this._enabled = null;
			this.enabled(tempEnabled);

			this._list.attr('class', this.element().attr('class')).appendTo($(document.body)); // the list needs to get the same classnames as the parent
		},
		constructElement: function DropDown$constructElement() {
			base.constructElement.apply(this, arguments);

			this._affordance = this.element().find('span.affordance');
			this._affordanceText = this._affordance.find('span.itemContainer');

			this._list = this.element().find('ul');
		},
		_templateData: function DropDown$_templateData() {
			return $.extend(base._templateData.apply(this, arguments), {
				showOnHover: this._options.showOnHover
			});
		},
		dataSource: function DropDown$dataSource() {
			if (arguments.length !== 0) {
				// if setting, the selected index needs to be nulled out
				this._selectedIndex = undefined;
			}

			var result = base.dataSource.apply(this, arguments);

			if (result === undefined) {
				this._updateItemContainer();
			}

			return result;
		},
		bindEvents: function DropDown$bindEvents() {
			this._affordance
				.focus(this.onFocus$proxy)
				.blur(this.onBlur$proxy)
				.mousedown(this.onAffordanceMouseDown$proxy)
				.bind('keydown', this.onKeyDown$proxy)
				.bind('selectstart', function () {
					return false;
				}); // prevents selection in IE
				
			if (this._options.showOnHover) {
				this._affordance
					.mouseover(this.onAffordanceMouseOver$proxy)
					.mouseout(this.onAffordanceMouseOut$proxy);

				this._list
					.mouseover(this.onListMouseOver$proxy)
					.mouseout(this.onListMouseOut$proxy);
			}
		},
		_updateItemContainer: function DropDown$_updateItemContainer() {
			if (!this._source) {
				return;
			}

			if (this.selectedIndex() >= 0) {
				this._affordanceText.removeClass('itemContainerWatermark');
				var item = this._itemMap[this.selectedIndex()].domNode;
				if (this._hasCustomItem()) {
					this._affordanceText.empty();
					item.children().clone().appendTo(this._affordanceText);
				} else {
					this._list.children().removeClass('active');
					var itemText = this.item(this.selectedIndex()).text;
					item.addClass('active');

					// Scroll to item (if item is not in view)
					var top = this._list[0].scrollTop;
					var bottom = top + this._list[0].offsetHeight;
					if (item[0].offsetTop < top || item[0].offsetTop > bottom) {
						this._list[0].scrollTop = item[0].offsetTop;
					}

					if (!this._options.showOnHover && this.isAttached()) {
						itemText = this._ellipsesText(itemText);
					}

					this._affordanceText.text(itemText);
				}
			} else if (this._watermark !== '') {
				var itemText = this._watermark;
				if (!this._options.showOnHover && this.isAttached()) {
					itemText = this._ellipsesText(itemText);
				}
				this._affordanceText.empty().text(itemText).addClass('itemContainerWatermark');
			} else {
				this._affordanceText.empty();
			}
		},
		onAttached: function DropDown$onAttached() {
			this._updateItemContainer();
		},
		cssClassPrefix: function DropDown$cssClassPrefix() {
			if (this._options.showOnHover) {
				return 'dropdown';
			} else {
				return 'dropdown dropdownType1';
			}
		},
		rerender: function DropDown$rerender() {
			if (this._source && this._list) {
				this._list.appendTo(this.element());
			}
			base.rerender.apply(this, arguments);
		},
		/* BEGIN Properties */
		watermark: function DropDown$watermark( /*text*/ ) {
			if (arguments.length === 0) {
				return this._watermark;
			} else {
				this._watermark = arguments[0] || '';
				this._updateItemContainer();
			}
		},
		selected: function DropDown$selected( /*[value], triggerEvents*/ ) {
			if (arguments.length === 0) {

				this.ensureElement();
				if (this.selectedIndex() === -1) {
					return null;
				} else {
					return this.item(this.selectedIndex());
				}
			} else {
				var found = false;

				for (var i = 0; i < this.count(); ++i) {
					if (this.item(i).value == arguments[0]) {
						this.selectedIndex(i, arguments[1]);
						found = true;
						break;
					}
				}

				if (!found) {
					throw 'Value is not in list';
				}
			}
		},
		selectedIndex: function DropDown$selectedIndex( /*index, triggerEvents*/ ) {
			if (arguments.length === 0) {

				this.ensureElement();
				return this._selectedIndex === undefined ? -1 : this._selectedIndex;

			} else if (this._selectedIndex !== arguments[0]) {
				if (arguments[1]) {
					if (!this.trigger_changing(this._selectedIndex, arguments[0])) {
						// change was programmatically cancelled
						return;
					}
				}

				if (this._selectedIndex !== undefined && this._selectedIndex >= 0) {
					this._itemMap[this._selectedIndex].domNode.removeClass('active');
				}

				this._selectedIndex = arguments[0];
				if (this._selectedIndex >= 0) {
					this._selectedItem = this.item(this._selectedIndex);
				} else {
					this._selectedItem = undefined;
				}

				this._updateItemContainer();

				this.validate();

				if (arguments[1]) {
					this.trigger('changed');
				}
			}
		},
		_hasCustomItem: function DropDown$_hasCustomItem() {
			return this._options.templates.item !== doodads.getType('/doodads/DropDown.doodad').defaultOptions.templates.item;
		},
		_ellipsesText: function DropDown$_ellipsesText(itemText) {
			// The minus is for the arrow... i think
			return itemText.crop(this._affordance.width() - 20, this._affordanceText[0]);
		},
		enabled: function DropDown$enabled( /*enabled*/ ) {
			if (arguments.length === 0) {
				return this._enabled;
			} else if (this._enabled !== arguments[0]) {
				this._enabled = arguments[0];
				if (!this._enabled) {
					// if we transitioned to disabled
					this._affordance.data('tabIndex', this.tabIndex());
					this.element().addClass('dropdownDisabled');
					this.tabIndex(null);
				} else {
					// if we transitioned to enabled
					this.tabIndex(this._affordance.data('tabIndex') || this._options.tabIndex);
					this.element().removeClass('dropdownDisabled');
				}
			}
		},
		/* END Properties */
		
		/* BEGIN Events */
		onCapturedMouseDown: function DropDown$onCapturedMouseDown(e) {
			e.stopPropagation();

			for (var target = e.originalTarget; target !== null; target = target.parentNode) {
				if (target === this.element()[0] || target === this._list[0]) {
					return;
				}
			}

			this.hide();
		},
		onAffordanceMouseDown: function DropDown$onAffordanceMouseDown(e) {
			if (!this.enabled()) return;

			window.clearTimeout(this._hoverTimer);

			if (this._options.showOnHover) {
				if (!this._isListPinned) {
					this._isListPinned = true;
				}
				if (!this._isListVisible) {
					this.show();
				}
			} else {
				if (this._isListVisible) {
					this.hide();
				} else {
					this.show();
				}
			}
			
			e.stopImmediatePropagation();
		},
		onAffordanceMouseOver: function DropDown$onAffordanceMouseOver(e) {
			if (!this.enabled()) return;

			this._cancelHover = false;

			if (!this._isListVisible) {
				this._affordance.addClass('tracking');
			}

			if (this._hoverTimer !== null) {
				clearTimeout(this._hoverTimer);
			}

			this._hoverTimer = setTimeout($.proxy(function () {
				this._hoverTimer = null;
				if (this._cancelHover) return;
				this._affordance.removeClass('tracking');
				this.show();
				this.focus();
			}, this), this._options.showAfter);

			if (!this._isListPinned) {
				window.clearTimeout(this._hidingTimeout);
			}
		},
		onAffordanceMouseOut: function DropDown$onAffordanceMouseOver(e) {
			this._cancelHover = true;
			this._affordance.removeClass('tracking');

			this._delayHide();
		},
		onListMouseOver: function DropDown$onListMouseOver(e) {
			if (!this._isListPinned) {
				window.clearTimeout(this._hidingTimeout);
				this._hidingTimeout = null;
			}
		},
		onListMouseOut: function DropDown$onListMouseOut(e) {
			this._delayHide();
		},
		_delayHide: function DropDown$_delayHide() {
			if (!this._isListPinned && this._isListVisible) {
				if (this._hidingTimeout !== null) {
					window.clearTimeout(this._hidingTimeout);
				}
				this._hidingTimeout = window.setTimeout($.proxy(this.hide, this), this._options.showAfter / 2);
			}
		},
		onItemHover: function DropDown$onItemHover(e) {
			this._list.children().removeClass('active');
			$(e.currentTarget).closest('li').toggleClass('active');
		},
		onItemRendered: function DropDown$onItemRendered(e, data) {
			data.domNode.click(this.onItemClick$proxy).bind('selectstart', function () {
				return false;
			}) // prevent selection in IE
			.hover(this.onItemHover$proxy);
		},
		onModelChanged: function DropDown$onModelChanged(e) {
			if (!this._selectedItem) {
				return;
			}

			this._selectedIndex = undefined;
			this.selectedIndex(this.indexOf(this._selectedItem));
		},
		onItemClick: function DropDown$onItemClick(e) {
			var metadata = $(e.currentTarget).closest('li').data('metadata');
			this.hide();
			this.selected(metadata.value, true);

			this.focus();

			e.preventDefault();
			e.stopPropagation();
		},
		onFocus: function DropDown$onFocus() {
			if (!this.enabled()) return;

			this._focused = true;
			this._affordance.addClass('tracking');

			this.trigger('focus');
		},
		onBlur: function DropDown$onBlur() {
			this._focused = false;

			if (!this._isListVisible) {
				this._affordance.removeClass('tracking');
			}

			this.trigger('blur');
		},
		onResize: function DropDown$onResize() {
			this._updateItemContainer();
			this.hide();
		},
		_moveSelectedItem: function DropDown$_moveSelectedItem(delta) {
			var item = this._list.find('li.active');

			this._list.children().removeClass('active');

			if (delta > 0) {
				item = item.next();
				if (item.length === 0) {
					item = this._list.children().first();
				}
			} else if (delta < 0) {
				item = item.prev();
				if (item.length === 0) {
					item = this._list.children().last();
				}
			}

			if (this._options.showOnHover) {
				item.addClass('active');
			} else {
				this.selectedIndex(item.index(), true);
			}
		},
		_filter: function (ch) {
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
				this.selectedIndex(matchSet[(repeatCount - 1) % matchSet.length], true);
			}
		},
		killFilter: function DropDown$killFilter(e) {
			this._filterStr = '';
			this._filterRepeatCount = 0;
		},
		onKeyDown: function DropDown$onKeyDown(e) {
			if (!this.enabled()) return;

			var key = e.keyCode || e.which;

			switch (key) {
				case doodads.keyCode.TAB:
				case doodads.keyCode.ESCAPE:
					this.hide();

					e.stopPropagation();
					break;
				case doodads.keyCode.ENTER:
					if (this._options.showOnHover) {
						this.selectedIndex(this._list.find('li.active').index(), true);
					}

					this.hide();

					if (this._options.showOnHover) {
						this.focus();
					}

					e.preventDefault();
					e.stopPropagation();
					break;
				case doodads.keyCode.UP:
					if (this._options.showOnHover) {
						this._isListPinned = true;
						this.show();
					}
					this._moveSelectedItem(-1);

					e.preventDefault();
					e.stopPropagation();
					break;
				case doodads.keyCode.DOWN:
					if (this._options.showOnHover) {
						this._isListPinned = true;
						this.show();
					}
					this._moveSelectedItem(1);

					e.preventDefault();
					e.stopPropagation();
					break;
				default:
					var ch = String.fromCharCode(key);

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
		trigger_changing: function DropDown$trigger_changing(currentSelection, newSelection) {
			var evt = $.Event('changing');
			this.trigger(evt, {
				currentSelection: currentSelection,
				newSelection: newSelection
			});
			return !evt.isDefaultPrevented();
		} /* END Events */

		,
		show: function DropDown$show() {
			if (this._isListVisible) return;

			if (this._options.showOnHover) {
				this._list.children().removeClass('active');
				if (this.selectedIndex() >= 0) {
					this._itemMap[this.selectedIndex()].domNode.addClass('active');
				}
			}

			this._isListVisible = true;

			if (activeDropDown) {
				activeDropDown.hide();
			}
			activeDropDown = this;

			this._affordance.addClass('active');

			var list = this._list[0];
			var affordance = this._affordance[0];

			if (this._hasCustomItem()) {
				this._affordanceText.width(this._affordance.width() - 13);
			}

			var $window = $(window);

			list.style.left = '0px';
			list.style.top = '0px';
			list.style.width = '';
			list.style.maxHeight = '';
			list.style.visibility = 'hidden';
			list.style.display = 'block';

			var listBound = list.getBoundingClientRect();
			var affordanceBound = affordance.getBoundingClientRect();

			if (!listBound.width) {
				listBound = $.extend({}, listBound, {
					width: listBound.right - listBound.left,
					height: listBound.bottom - listBound.top
				});
				affordanceBound = $.extend({}, affordanceBound, {
					width: affordanceBound.right - affordanceBound.left
				});
			}

			var affordanceStyle, listStyle;
			if (list.currentStyle) {
				affordanceStyle = affordance.currentStyle;
				listStyle = list.currentStyle;
			} else {
				affordanceStyle = document.defaultView.getComputedStyle(affordance, '');
				listStyle = document.defaultView.getComputedStyle(list, '');
			}

			var replaceStyle = {
				top: null,
				maxHeight: null,
				left: null,
				width: null,
				visibility: 'visible'
			};

			var topPos = affordanceBound.bottom - parseFloat(affordanceStyle.borderTopWidth);
			replaceStyle.top = (topPos + $window.scrollTop()) + 'px';

			var widthAdjusted = false;
			if (topPos + listBound.height > $window.height()) {
				replaceStyle.maxHeight = ($window.height() - topPos - 40) + 'px';

				replaceStyle.width = (listBound.width + getScrollbarWidth()) + 'px';
				widthAdjusted = true;
			}

			var borderWidth = Math.ceil(parseFloat(listStyle.borderLeftWidth) + parseFloat(listStyle.borderRightWidth));
			var leftPos;
			if (affordanceBound.left + listBound.width > $window.width()) {
				leftPos = affordanceBound.right - listBound.width;
				if (widthAdjusted) {
					leftPos -= getScrollbarWidth() + borderWidth;
				}
			} else {
				leftPos = affordanceBound.left;
			}
			leftPos += $window.scrollLeft();

			replaceStyle.left = leftPos + 'px';

			if (affordanceBound.width > listBound.width) {
				replaceStyle.width = (affordanceBound.width - borderWidth) + 'px';
			}

			$.extend(list.style, replaceStyle);

			// HACK(ish) -> For Vastardis
			// DE1667: For whatever reason, in FF3.6, the Doc Upload overlay flashes whenever 
			// a DropDown list has a scrollTop not equal to zero. Tried a bunch of things, but the
			// only thing that seems to reliably fix the problem is to remember the scrollTop value
			// zero it out, and then once the list is ready, set the scroll top value to the buffered
			// one
			if (this.selected()) {
				this._list.children().removeClass('active');
				list.scrollTop = this._itemMap[this.selectedIndex()].domNode[0].offsetTop;
				this._itemMap[this.selectedIndex()].domNode.addClass('active');
			} else if (this._scrollTopBuffered) {
				list.scrollTop = this._scrollTopBuffered;
			}

			captureEvent('mousedown', this.element(), this.onCapturedMouseDown$proxy);
		},
		hide: function DropDown$hide() {
			releaseEvent('mousedown');

			this._affordance.removeClass('active');

			if (this._isListVisible) {
				// VASTARDIS Hack: Look in the show function above for an explanation
				this._scrollTopBuffered = this._list[0].scrollTop;
				this._list[0].scrollTop = 0;

				this._list.hide();
				activeDropDown = null;
				this._isListVisible = false;
			}

			this._isListPinned = false;
			this._hidingTimeout = null;
		}

		/* BEGIN Focus Management */
		,
		focus: function DropDown$focus() {
			if (this.isAttached()) {
				this._affordance.focus();
			}
		},
		blur: function DropDown$blur() {
			if (this.isAttached()) {
				this._affordance.blur();
			}
		},
		tabIndex: function DropDown$tabIndex() {
			if (arguments.length === 0) {
				return base.tabIndex.apply(this, arguments);
			} else {
				this.ensureElement();

				this._tabIndex = arguments[0];
				if (this._tabIndex || this._tabIndex === 0) {
					this._affordance.attr('tabIndex', this._tabIndex);
				} else {
					this._affordance.removeAttr('tabIndex');
				}
			}
		} /* END Focus Management */

		/* BEGIN Validation Framework Requirements */
		,
		validationContext: function DropDown$validationContext() {
			return $.extend({}, this.selected() || {}, {
				index: this.selectedIndex()
			});
		},
		validationTarget: function DropDown$validationTarget() {
			this.ensureElement();
			return this._affordance;
		},
		hasInputFocus: function DropDown$hasInputFocus() {
			return this._focused && !this._isListVisible;
		} /* END Validation Framework Requirements */

		,
		dispose: function DropDown$dispose() {
			if (this._source && this._list) {
				this._list.appendTo(this.element());
			}

			base.dispose.apply(this, arguments);

			this.unbind('itemRendered', this.onItemRendered$proxy);
			this.unbind('modelChanged', this.onModelChanged$proxy);
		}
	}).complete();
});