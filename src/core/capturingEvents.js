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