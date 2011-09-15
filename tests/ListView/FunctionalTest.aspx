<%@ Page Title="Vastardis.UI.Components.ListView" Language="C#" MasterPageFile="~/Components/Functional.master" AutoEventWireup="true" CodeFile="FunctionalTest.aspx.cs" Inherits="Components_ListView_FunctionalTest" %>

<asp:Content ContentPlaceHolderID="Content" Runat="Server">
    <div class="container">
    </div>
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/List.component" />
            <asp:ScriptReference Path="~/Components/ListView.component" />
        </Scripts>
    </asp:ScriptManagerProxy>
    <script type="text/javascript">
        (function($, undefined) {
            $(document).ready(function() {
                var listView = Vastardis.UI.Components.ComponentFactory2.create('/Components/ListView.component', {});

                listView.dataSource([
                    { id: '1', text: 'Sahab' }
                    , { id: '2', text: 'Soroosh' }
                    , { id: '3', text: 'Sehri' }
                    , { id: '4', text: 'Fariborz' }
                    , { id: '5', text: 'Homa' }
                    , { id: '6', text: 'Tori' }
                    , { id: '7', text: 'Niki' }
                ]);
                listView.render($('.container'));
            });
        })(jQuery);
    </script>
</asp:Content>

