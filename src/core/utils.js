(function($, undefined) {
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

    // Adapted from Underscore.js (http://documentcloud.github.com/underscore/underscore.js)
    // Used under the MIT license
	doodads.proxy = function bind(func, context) {
		var bound, args;
		if (func.bind === Function.prototype.bind && Function.prototype.bind) {
			return Function.prototype.bind.apply(func, Array.prototype.slice.call(arguments, 1));
		}
		if (!Object.toString.prototype.call(func) == '[object Function]') {
			throw new TypeError;
		}
		args = Array.prototype.slice.call(arguments, 2);
		return bound = function() {
			if (!(this instanceof bound)) {
				return func.apply(context, args.concat(Array.prototype.slice.call(arguments)));
			}
			var ctor = function(){};
			ctor.prototype = func.prototype;
			var self = new ctor;
			var result = func.apply(self, args.concat(Array.prototype.slice.call(arguments)));
			if (Object(result) === result) {
				return result;
			}
			return self;
		};
	};
})(jQuery);