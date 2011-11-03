doodads.setup()
    .constructor(function () {
        this._text = this._options.text;
    })
    .defaultOptions({
        text: ''
    })
    .proto({
        templateData: function () {
            return { text: this._text };
        }
        , cssClassPrefix: function () {
            return 'c_label';
        }
    })
    .complete();
