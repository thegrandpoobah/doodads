<%@ Page Title="Vastardis.UI.Components.DropDown" Language="C#" MasterPageFile="~/Components/Unit.master"
    AutoEventWireup="true" CodeFile="UnitTest.aspx.cs" Inherits="Components_DropDown_UnitTest" %>

<asp:Content ID="Content2" ContentPlaceHolderID="Content" runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/DropDown.component" />
        </Scripts>
    </asp:ScriptManagerProxy>

    <script type="text/javascript">
        (function($) {
            $(document).ready(function() {
                header.text('Vastardis.UI.Components.DropDown')

                var vsc = Vastardis.UI.Components;

                module('Basic', {
                    setup: function() {
                        this.dropdown = new vsc.DropDown3({});
                    }
                    , teardown: function() {
                        this.dropdown.dispose();
                    }
                });

                test('Core', function() {
                    this.dropdown.render($(document.body));
                    this.dropdown.addItem({ value: 1, text: 'Item 1' });
                    this.dropdown.addItem({ value: 2, text: 'Item 2' });
                    this.dropdown.addItem({ value: 3, text: 'Item 3' });
                    this.dropdown.addItem({ value: 4, text: 'Item 4' });

                    equals(this.dropdown._hasCustomItem(), false, '_hasCustomItem logic');

                    this.dropdown.selected(2);
                    equals(this.dropdown.selectedIndex(), 1, 'Selection via selected');

                    this.dropdown.selectedIndex(3);
                    equals(this.dropdown.selected().text, 'Item 4', 'Selection via selectedIndex');

                    this.dropdown.selectedIndex(-1);
                    equals(this.dropdown.selected(), null, 'Clearing selection');
                });

                test('CSS', function() {
                    this.dropdown.render($(document.body));

                    equals(this.dropdown.element().attr('class'), 'dropdown dropdownType1', 'Correct styling for Click Drop Downs');

                    this.dropdown.enabled(false);
                    equals(this.dropdown.element().attr('class'), 'dropdown dropdownType1 dropdownDisabled', 'Correct styling for disabled drop downs.');

                    var type1DropDown = new vsc.DropDown3({ showOnHover: true });
                    type1DropDown.render($(document.body));
                    equals(type1DropDown.element().attr('class'), 'dropdown', 'Correct styling for Hover Drop Downs');
                    type1DropDown.dispose();
                });

                test('Watermarking', function() {
                    this.dropdown.render($(document.body));

                    this.dropdown.watermark('Watermark');
                    equals(this.dropdown.element().find('.itemContainer').text(), 'Watermark', 'Watermark on empty list');

                    this.dropdown.addItem({ value: 5, text: 'Fake Item' });
                    this.dropdown.selectedIndex(0);
                    equals(this.dropdown.element().find('.itemContainer').text(), 'Fake Item', 'No Watermarks on selections');

                    this.dropdown.watermark(null);
                    this.dropdown.selectedIndex(-1);
                    equals(this.dropdown.element().find('.itemContainer').text(), '', 'Removal of watermark');
                });

                module('Custom Draw', {
                    setup: function() {
                        this.dropdown = new vsc.DropDown3({});
                        this.dropdown._options.templates = $.extend({}, vsc.DropDown3.defaultOptions.templates, {
                            item: '<li data-guid="{{__guid}}"><span>C</span><span>{{text}}</span></li>'
                        });
                    }
                    , teardown: function() {
                        this.dropdown.dispose();
                    }
                });

                test('Core', function() {
                    this.dropdown.render($(document.body));
                    this.dropdown.addItem({ value: 1, text: 'Item 1' });
                    this.dropdown.addItem({ value: 2, text: 'Item 2' });
                    this.dropdown.addItem({ value: 3, text: 'Item 3' });
                    this.dropdown.addItem({ value: 4, text: 'Item 4' });

                    equals(this.dropdown._hasCustomItem(), true, '_hasCustomItem logic');

                    this.dropdown.selected(3);
                    equals(this.dropdown.element().find('.itemContainer').html(), '<span>C</span><span>Item 3</span>', 'Custom Draw selected item contents');
                });

                module('Validation', {
                    setup: function() {
                        this.dropdown = new vsc.DropDown3({ required: true, invalidValue: 3 });
                    }
                    , teardown: function() {
                        this.dropdown.dispose();
                    }
                });

                test('Core', function() {
                    this.dropdown.render($(document.body));
                    this.dropdown.addItem({ value: 1, text: 'Item 1' });
                    this.dropdown.addItem({ value: 2, text: 'Item 2' });
                    this.dropdown.addItem({ value: 3, text: 'Item 3' });
                    this.dropdown.addItem({ value: 4, text: 'Item 4' });

                    this.dropdown.selectedIndex(-1);
                    equals(this.dropdown.valid(), false, 'default required rule (failure via no selection)');

                    this.dropdown.selected(3);
                    equals(this.dropdown.valid(), false, 'default required rule (failure via invalid value)');

                    this.dropdown.selected(2);
                    equals(this.dropdown.valid(), true, 'default required rule (success via selection)');

                    this.dropdown.addRule(new function() {
                        this.validate = function(context) {
                            equals(context.value, 1, 'custom rule (context validity)');
                            equals(context.text, 'Item 1', 'custom rule (context validity)');
                            equals(context.index, 0, 'custom rule (context validity)');

                            return {
                                valid: true
						        , message: 'Always succeed'
                            }
                        }
                    });

                    this.dropdown.selected(1);

                    this.dropdown._rules.length = 0;
                    this.dropdown.addRule(new function() {
                        this.validate = function(context) {
                            equals(context.index, -1, 'custom rule (no selection, context validity)');
                            return {
                                valid: true
                                , message: 'Always succeed'
                            };
                        }
                    });
                    this.dropdown.selectedIndex(-1);
                });
            });
        })(jQuery);    
    </script>

</asp:Content>
