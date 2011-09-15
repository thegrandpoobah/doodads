(function ($, undefined) {
    var Label = function () {
        this._text = this._options.text;
    }
    Label.defaultOptions = {
        text: ''
    };
    Label.prototype = $.extend(new base.constructor(), {
        templateData: function () {
            return { text: this._text };
        }
        , cssClassPrefix: function () {
            return 'c_label';
        }
        , text: function (/*text*/) {
            if (arguments.length === 0) {
                return this._text;
            } else {
                this._text = arguments[0];
                this.element().text(this._text);
            }
        }
    });
    Label.prototype.dataSource = Label.prototype.text; // alias text to dataSource

    window.getComponentType = function () {
        return Label;
    }
})(jQuery);