<%@ Page Title="Vastardis.UI.Components.CheckBox" Language="C#" MasterPageFile="~/Components/Unit.master" AutoEventWireup="true"
    CodeFile="UnitTest.aspx.cs" Inherits="Components_CheckBox_UnitTest" %>

<asp:Content ContentPlaceHolderID="Content" runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/CheckBox.component" />
        </Scripts>
    </asp:ScriptManagerProxy>

    <script type="text/javascript">
        (function($) {
            $(document).ready(function() {

                header.text('Vastardis.UI.Components.Checkbox')

                var vsc = Vastardis.UI.Components;

                //Text
                module('Text', {
                    setup: function() {
                        this.checkbox = new vsc.CheckBox({ id: 'myCheckbox', text: 'Check' });
                        this.checkbox.render($(document.body));
                    }
                    , teardown: function() {
                        this.checkbox.dispose();
                    }
                });

                test("set", function() {
                    var checkbox = this.checkbox;
                    var $chk = $('#myCheckbox');

                    equals($chk.find('label').text(), 'Check', "Component is initialized with a text property");

                    checkbox.text('Check me');
                    equals($chk.find('label').text(), 'Check me', "Component's text is changed");
                });

                test("get", function() {
                    var checkbox = this.checkbox;
                    var $chk = $('#myCheckbox');

                    checkbox.text('Check me');
                    equals(checkbox.text(), 'Check me', "get text()");
                });

                //Enable
                module('Enable', {
                    setup: function() {
                        this.checkbox = new vsc.CheckBox({ id: 'myCheckbox', enabled: false });
                        this.checkbox.render($(document.body));
                    }
                    , teardown: function() {
                        this.checkbox.dispose();
                    }
                });

                test("set", function() {
                    var checkbox = this.checkbox;
                    var $chk = $('#myCheckbox');

                    ok($chk.find('input').attr('disabled'), "Component is initially disabled, DOM element should have 'disabled=true' attribute");

                    checkbox.enable(true);
                    ok(!$chk.find('input').attr('disabled'), "DOM element should NOT have 'disabled=true' attribute");
                });

                test("get", function() {
                    var checkbox = this.checkbox;
                    var $chk = $('#myCheckbox');

                    checkbox.enable(true);
                    ok(checkbox.enable(), "Postive test");

                    checkbox.enable(false);
                    ok(!checkbox.enable(), "Negative test");
                });

                //Checking
                module('Check', {
                    setup: function() {
                        this.checkbox = new vsc.CheckBox({ id: 'myCheckbox', checked: true });
                        this.checkbox.render($(document.body));
                    }
                    , teardown: function() {
                        this.checkbox.dispose();
                    }
                });

                test("set", function() {
                    var checkbox = this.checkbox;
                    var $chk = $('#myCheckbox');

                    ok($chk.find('input')[0].checked, "Component is initially checked, DOM element should be checked");

                    checkbox.checked(false);
                    ok(!$chk.find('input')[0].checked, "Negative test");

                    checkbox.checked(true);
                    ok($chk.find('input')[0].checked, "Positive test");
                });


                test("get", function() {
                    var checkbox = this.checkbox;
                    var $chk = $('#myCheckbox');

                    ok(checkbox.checked(), "get checked() - should return true");

                    checkbox.checked(false);
                    ok(!checkbox.checked(), "Negative test");
                });

                //Events
                module('Event', {
                    setup: function() {
                        this.checkbox = new vsc.CheckBox({ id: 'myCheckbox' });
                        this.checkbox.render($(document.body));
                        this.e = { preventDefault: $.noop, stopPropagation: $.noop };
                    }
                    , teardown: function() {
                        this.checkbox.dispose();
                    }
                });

                test("click", function() {
                    var checkbox = this.checkbox;
                    var $chk = $('#myCheckbox');
                    var e = this.e;

                    var result = false;
                    $(checkbox).bind('click', function() {
                        result = true;
                    });

                    checkbox.onClick(e);
                    ok(result, "should fire the 'click' trigger");
                });

            });
        })(jQuery);    
    </script>

</asp:Content>
