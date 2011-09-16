<%@ Page Title="Vastardis.UI.Components.DropDown Functional Testing" Language="C#"
    MasterPageFile="~/Components/Functional.master" AutoEventWireup="true" CodeFile="FunctionalTest.aspx.cs"
    Inherits="Components_Default" %>

<asp:Content ContentPlaceHolderID="Stylesheets" runat="server">
    <style type="text/css">
        ul.dropdown
        {
            height: 100px;
        }
        html, body
        {
            height: 100%;
            padding: 0;
        }
    </style>
</asp:Content>
<asp:Content ContentPlaceHolderID="Content" runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/List.component" />
            <asp:ScriptReference Path="~/Components/DropDown.component" />
        </Scripts>
    </asp:ScriptManagerProxy>
    <h1>Visual Style</h1>
    <div id="enabledSite">
    </div>

    <a id="delayLoadTest" href="#">Delay Load Test (DE1564)</a>
    <a id="removeMe" href="#">Remove the selected item</a>
    <a id="addAnItem" href="#">Add an item</a>
    
    <script type="text/javascript">
        (function ($) {
            $(document).ready(function () {
                var naturalState = Vastardis.UI.Components.ComponentFactory2.create('/Components/DropDown.component', { text: 'Default' });
                naturalState.render($('#enabledSite'));

                naturalState.addItem({ text: 'Jeffrey T. Spaulding', value: 1 });
                naturalState.addItem({ text: 'S. Quentin Quale', value: 2 });
                naturalState.addItem({ text: 'Wolf J. Flywheel', value: 3 });
                naturalState.addItem({ text: 'Otis P. Driftwood', value: 4 });
                naturalState.addItem({ text: 'Mr. Hammer', value: 5 });
                naturalState.addItem({ text: 'Quincy Adams Wagstaff', value: 6 });
                naturalState.addItem({ text: 'J. Cheever Loophole', value: 7 });
                naturalState.addItem({ text: 'Hugo Z. Hackenbush', value: 8 });
                naturalState.addItem({ text: 'Ronald Kornblow', value: 9 });

                $('#delayLoadTest').click(function (e) {
                    window.setTimeout(function () {
                        naturalState.dataSource([
                            { text: 'Groucho', value: 1 }
                            , { text: 'Chico', value: 2 }
                            , { text: 'Gummo', value: 3 }
                            , { text: 'Zeppo', value: 4 }
                        ]);
                    }, 2000);
                    e.preventDefault();
                });

                $('#removeMe').click(function (e) {
                    naturalState.removeItem(naturalState.selectedIndex());
                    naturalState.selectedIndex(-1);
                    e.preventDefault();
                });

                $('#addAnItem').click(function (e) {
                    naturalState.addItem({ text: 'Rufus T. Firefly', value: 10 });
                    e.preventDefault();
                });
            });
        })(jQuery);        
    </script>
</asp:Content>
