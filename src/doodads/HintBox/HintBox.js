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
    var HintBox = function() {
        this._cells = {};
        this._isVisible = false;
    }
    HintBox.Color = {
        Red: 1,
        Blue: 2
    };
    HintBox.prototype = $.extend(new base.constructor(), {
        constructElement: function() {
            base.constructElement.apply(this, arguments);

            this._cells = {
                top_left: this._source.find('td.tl'),
                top: this._source.find('td.t'),
                top_right: this._source.find('td.tr'),
                middle_left: this._source.find('td.ml'),
                middle: this._source.find('td.m'),
                middle_right: this._source.find('td.mr'),
                bottom_left: this._source.find('td.bl'),
                bottom: this._source.find('td.b'),
                bottom_right: this._source.find('td.br')
            }

            this._messageContainer = this._cells.middle.find('div');
        }
        , cssClassPrefix: function() {
            return 'hintbox';
        }
		, show: function(anchor, position, direction, lock) {

		    if (this._isVisible) return;

		    this.element()
                .css({ 'visibility': 'hidden', display: 'inline-block', position: 'absolute', top: '0px', left: '0px' })
                .appendTo($(document.body))
				.show();

		    // Reset the cells' classes
		    $.each(this._cells, function(key, cell) {
		        if (cell.data('arrow')) {
		            cell.removeClass(cell.data('arrow'));
		        }
		    });

		    var subpositions = position.split(' ');
		    var subdirection = direction.split(' ');

		    var placement = {
		        position_y: subpositions[0]
				, position_x: subpositions[1]
				, direction_y: subdirection[0]
				, direction_x: subdirection[1]
		    };

		    var targetRect = $.extend({}, anchor[0].getBoundingClientRect());

		    targetRect.left += $(window).scrollLeft();
		    targetRect.right += $(window).scrollLeft();
		    targetRect.top += $(window).scrollTop();
		    targetRect.bottom += $(window).scrollTop();

		    var canvasRect = {
		        top: 0,
		        left: 0,
		        bottom: $(window).height(),
		        right: $(window).width()
		    };

		    var hintboxRect = {
		        top: -1,
		        left: -1,
		        bottom: -1,
		        right: -1,
		        width: this.element().innerWidth(),
		        height: this.element().innerHeight()
		    };

		    for (var i = 0; i < 3; i++) {
		        var newPlacement = $.extend({}, placement);

		        // find hintbox rect based on newPlacement...
		        hintboxRect.left = targetRect[newPlacement.position_x];
		        hintboxRect.right = hintboxRect.left + hintboxRect.width;
		        hintboxRect.top = targetRect[newPlacement.position_y];
		        hintboxRect.bottom = hintboxRect.top + hintboxRect.height;

		        if (newPlacement.direction_y === 'up') {
		            hintboxRect.top -= hintboxRect.height - 10;
		            hintboxRect.bottom -= hintboxRect.height - 10;
		        } else {
		            hintboxRect.top -= 10;
		            hintboxRect.bottom -= 10;
		        }

		        var offset;
		        if (newPlacement.direction_x === 'left') {
		            hintboxRect.left -= hintboxRect.width;
		            hintboxRect.right -= hintboxRect.width;
		            offset = newPlacement.position_x === 'right' ? 10 : 20;
		        } else {
		            offset = -20;
		        }

		        hintboxRect.left += offset;
		        hintboxRect.right += offset;

		        if (i === 2 || lock) break;

		        if (hintboxRect.right > canvasRect.right) {
		            newPlacement.position_x = 'left';
		            newPlacement.direction_x = 'left';
		        }
		        if (hintboxRect.left < canvasRect.left) {
		            newPlacement.position_x = 'right';
		            newPlacement.direction_x = 'right';
		        }
		        if (hintboxRect.bottom > canvasRect.bottom) {
		            newPlacement.position_y = 'top';
		            newPlacement.direction_y = 'up';
		        }
		        if (hintboxRect.top < canvasRect.top) {
		            newPlacement.position_y = 'bottom';
		            newPlacement.direction_y = 'down';
		        }

		        var good = true;
		        for (var key in placement) {
		            if (placement[key] !== newPlacement[key]) {
		                good = false;
		                break;
		            }
		        }

		        if (good) {
		            break;
		        }

		        placement = newPlacement;
		    }

		    var arrowClass = '';
		    var whichCell = '';

		    if (placement.direction_y === 'down') {
		        arrowClass += 't';
		        whichCell += 'top';
		    } else if (placement.direction_y === 'up') {
		        arrowClass += 'b';
		        whichCell += 'bottom';
		    }

		    whichCell += '_';

		    if (placement.direction_x === 'left') {
		        arrowClass += 'r';
		        whichCell += 'right';
		    } else if (placement.direction_x === 'right') {
		        arrowClass += 'l';
		        whichCell += 'left';
		    }
		    arrowClass += 'a';

		    this._cells[whichCell].addClass(arrowClass).data('arrow', arrowClass);

		    this.element()
                .offset({ top: hintboxRect.top, left: hintboxRect.left })
                .css('visibility', 'visible');

		    this.element().show();
		    this._isVisible = true;
		}
		, hide: function() {
		    this.element().hide();
		    this._isVisible = false;
		}
		, addChild: function(component) {
		    base.addChild.apply(this, arguments);
		    component.render(this._messageContainer);
		}
    });

    window.getComponentType = function() {
        return HintBox;
    }

})(jQuery);
