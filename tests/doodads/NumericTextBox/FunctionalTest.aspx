<%@ Page Title="Vastardis.UI.Components.NumericTextBox Functional Testing" Language="C#"
    MasterPageFile="~/Components/Functional.master" AutoEventWireup="true" CodeFile="FunctionalTest.aspx.cs"
    Inherits="Components_Default" %>

<asp:Content ContentPlaceHolderID="Stylesheets" runat="server">
    <style type="text/css">
        
    </style>
</asp:Content>
<asp:Content ContentPlaceHolderID="Content" runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/TextBox.component" />
            <asp:ScriptReference Path="~/Components/NumericTextBox.component" />
        </Scripts>
    </asp:ScriptManagerProxy>
    <h1>
        Visual Style</h1>
    <div id="container">
    </div>
    <a id="ChangeValueTest" href="#">Change Value</a>
    <script type="text/javascript">
        (function ($) {
            $(document).ready(function () {
                window.numTextBox = Vastardis.UI.Components.ComponentFactory2.create('/Components/NumericTextBox.component', {required: false});

                //var numTextBox = new Vastardis.UI.Components.NumericTextBox({ text: '1' });
                window.numTextBox.addRule(new function () {
                    this.validate = function (context) {
                        return {
                            valid: context === 100
                            , message: 'Only 100'
                        }
                    }
                });
                window.numTextBox.render($('#container'));
                //window.numTextBox.val(1.88888888888888888);

                $('#ChangeValueTest').click(function (e) {
                    window.numTextBox.val(1.88888888888888888);
                    e.preventDefault();
                });

            });
        })(jQuery);        
    </script>
</asp:Content>
