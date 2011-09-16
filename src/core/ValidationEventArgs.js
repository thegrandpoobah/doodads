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
	
	$.extend(true, window, { Vastardis: { UI: { Components: { ValidationEventArgs: ValidationEventArgs}}} });
})(jQuery);
