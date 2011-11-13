doodads.setup()
    .constructor(function () {
        this._text = this._options.text;
    })
    .defaultOptions({
        text: ''
    })
    .proto({
        onReady: function () {
            this.base.onReady.apply(this, arguments);
        },
        onChildrenReady: function () {
            console.log(this._sahab);
        },
        templateData: function () {
            return { text: this._text };
        },
        cssClassPrefix: function () {
            return 'c_label';
        }
    })
    .complete();
