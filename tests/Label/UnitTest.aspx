<%@ Page Title="Vastardis.UI.Components.Label" Language="C#" MasterPageFile="~/Components/Unit.master" AutoEventWireup="true" CodeFile="UnitTest.aspx.cs" Inherits="Components_Label_UnitTest" %>

<asp:Content ID="Content2" ContentPlaceHolderID="Content" Runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/Label.component" />
        </Scripts>
    </asp:ScriptManagerProxy>
    <script type="text/javascript">
        (function($) {
            $(document).ready(function() {

                header.text('Vastardis.UI.Components.Label')

                var vsc = Vastardis.UI.Components;

                test("Core", function() {

                    var label = new vsc.Label({ id: 'myLabel' });

                    equals(label.id(), 'myLabel', "id()");

                    label.render($(document.body));
                    var $lbl = $('#myLabel');

                    equals(label.element().parent()[0].tagName.toUpperCase(), 'BODY', "render() - attach component to BODY");

                    equals(label.element()[0], $lbl[0], "element() - component should be part of the DOM");

                    label.dispose();
                    equals($('#myLabel')[0], null, "dispose() - should remove component from DOM");
                });

                test("text", function() {

                    var label = new vsc.Label({ id: 'myLabel' });
                    label.render($(document.body));
                    var $lbl = $('#myLabel');

                    label.text('Read me');
                    equals($lbl.text(), 'Read me', "set text()");

                    equals(label.text(), 'Read me', "get text()");

                    label.dispose();
                });

            });
        })(jQuery);    
    </script>
</asp:Content>

