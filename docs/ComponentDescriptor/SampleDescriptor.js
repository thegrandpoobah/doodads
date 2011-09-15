// This is all of the necessary boilerplate code for a given Component
(function($, undefined) {
    SampleDescriptor = function() {
    }
    SampleDescriptor.defaultOptions = {};

    SampleDescriptor.prototype = $.extend(new base.constructor(), {
    });

    window.getComponentType = function() {
        return SampleDescriptor;
    }
})(jQuery);