<%@ Page Title="Vastardis.UI.Components.TextBox" Language="C#" MasterPageFile="~/Components/Unit.master"
    AutoEventWireup="true" CodeFile="UnitTest.aspx.cs" Inherits="Components_TextBox_UnitTest" %>

<asp:Content ID="Content2" ContentPlaceHolderID="Content" runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/NumericTextBox.component" />
        </Scripts>
    </asp:ScriptManagerProxy>

    <script type="text/javascript">
        (function($) {
            $(document).ready(function() {

                header.text('Vastardis.UI.Components.NumericTextBox + Validation');

                var vsc = Vastardis.UI.Components;

                module('Val', {
                    setup: function() {
                        this.txt = new vsc.NumericTextBox({ id: 'myTextBox' });
                        this.txt.render($(document.body));
                    }
					, teardown: function() {
					    this.txt.dispose();
					}
                });

                test('Set', function() {
                    var txt = this.txt;
                    var $txt = $('span.textbox input[type=text]');

                    txt.val(1);
                    equals($txt.val(), 1, 'val(<Number>)');

                    txt.val('1');
                    equals($txt.val(), 1, 'val(<Numeric String>)');

                    txt.val(null);
                    equals($txt.val(), '', 'val(null)');

                    try {
                        txt.val('');
                    } catch (e) {
                        equals(e, 'Invalid number', 'val(<String.Empty>) >> Error should be thrown');
                    }
                    equals($txt.val(), '', 'val(<String.Empty>)');

                    try {
                        txt.val('1a');
                    } catch (e) {
                        equals(e, 'Invalid number', 'val(<AlphaNumeric>) >> Error should be thrown');
                    }
                });

                test('Get', function() {
                    var txt = this.txt;
                    var $txt = $('span.textbox input[type=text]');

                    txt.val(1);
                    equals(txt.val(), 1, 'val(<Number>)');

                    txt.val('1');
                    equals(txt.val(), 1, 'val(<Numeric String>)');

                    txt.val(null);
                    equals(txt.val(), null, 'val(null)');

                    try {
                        txt.val('');
                    } catch (e) {
                    }
                    equals(txt.val(), null, 'val(<String.Empty>)');

                    try {
                        txt.val('1a');
                    } catch (e) {
                    }
                    equals(txt.val(), null, 'val(<String.Empty>)');
                });

                module('Formatting', {
                    setup: function() {
                        this.txt = new vsc.NumericTextBox({ id: 'myTextBox', textDecimals: 2, valueDecimals: 4 });
                        this.txt.render($(document.body));
                    }
					, teardown: function() {
					    this.txt.dispose();
					}
                });

                test('val, with default formatting', function() {
                    var txt = this.txt;
                    var $txt = $('span.textbox input[type=text]');

                    txt.val(1.555555);
                    equals(txt.val(), 1.5556, 'val(1.555555) - should round to 4 decimals');

                    txt.val(1.5501);
                    equals(txt.val(), 1.5501, 'val(1.5501) - should round to 4 decimals');

                    txt.val('1.555555');
                    equals(txt.val(), 1.5556, 'val("1.555555") - should round to 4 decimals');

                    txt.val('1.5501');
                    equals(txt.val(), 1.5501, 'val("1.5501") - should round to 4 decimals');
                });

                test('val, with custom formatting', function() {
                    var txt = this.txt;
                    var $txt = $('span.textbox input[type=text]');

                    txt.formatValue(function(val) {
                        var value = Vastardis.Utility.AddCommaFormat(val, 1);
                        return parseFloat(Vastardis.Utility.RemoveCommaFormat(value));
                    });

                    txt.val(1.555555);
                    equals(txt.val(), 1.6, 'val(1.555555) - should round to 1 decimal');

                    txt.val(1.5501);
                    equals(txt.val(), 1.6, 'val(1.5501) - should round to 1 decimal');

                    txt.val('1.555555');
                    equals(txt.val(), 1.6, 'val("1.555555") - should round to 1 decimal');

                    txt.val('1.5501');
                    equals(txt.val(), 1.6, 'val("1.5501") - should round to 1 decimal');

                    txt.formatText(function(val) {
                        return Vastardis.Utility.AddCommaFormat(val, 10);
                    });

                    /*
                    txt.val(1.555555);
                    equals(txt._text(), '1.6000000000', 'text - should append 9 zeros');
                    */

                    txt.formatValue(function(val) {
                        var value = Vastardis.Utility.AddCommaFormat(val, 10);
                        return parseFloat(Vastardis.Utility.RemoveCommaFormat(value));
                    });
                    txt.val(1.555555);
                    equals(txt.val(), 1.555555, 'val(1.555555) - should keep the same number');
                });

                module('Validation', {
                    setup: function() {
                        this.txt = new vsc.NumericTextBox({ value: 1, required: true });
                        this.txt.render($(document.body));
                    }
					, teardown: function() {
					    this.txt.dispose();
					}
                });

                test('Basic tests', function() {
                    var txt = this.txt;
                    var $txt = $('span.textbox input[type=text]');

                    ok(txt.valid(), 'initial value - valid');
                });

                test('Required', function() {
                    var txt = this.txt;
                    var $txt = $('span.textbox input[type=text]');

                    txt.required(false);
                    txt.val(null);
                    ok(txt.valid(), '::required(false)::val(null) >> valid');

                    txt.required(true);
                    txt.val(null);
                    ok(!txt.valid(), '::required(true)::val(null) >> invalid');
                });
            });
        })(jQuery);    
    </script>

</asp:Content>
