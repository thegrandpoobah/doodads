<%@ Page Title="Vastardis.UI.Components.Button Functional Testing" Language="C#" MasterPageFile="~/Components/Functional.master" AutoEventWireup="true" CodeFile="FunctionalTest.aspx.cs" Inherits="Components_Default" %>

<asp:Content ContentPlaceHolderID="Stylesheets" Runat="server">
    <style type="text/css">
        .customButton {
            width: 200px;
        }
    </style>
</asp:Content>
<asp:Content ContentPlaceHolderID="Content" Runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/Button.component" />
        </Scripts>
    </asp:ScriptManagerProxy>
    
    <h1>Visual Style</h1>
    <div><span id="enabledSite"></span>: Natural State</div>
    <div><span id="disabledSite"></span>: Disabled State</div>
    <div><span id="trackingSite"></span>: Tracking State</div>
    <div><span id="activeSite"></span>: Active State</div>
    <div><span id="customSite"></span>: Customized Styles</div>
    <h1>Eventing</h1>
    <div>
        <div id="eventingSite"></div>
        <div id="eventingMessage"></div>
        <ol>
            <li>Click</li>
        </ol>    
    </div>
    <script type="text/javascript">
        (function($) {
            $(document).ready(function() {
                var naturalState = Vastardis.UI.Components.ComponentFactory2.create('/Components/Button.component', { text: 'Default' });
                naturalState.render($('#enabledSite'));

                var disabledState = Vastardis.UI.Components.ComponentFactory2.create('/Components/Button.component', { text: 'Disabled' });
                disabledState.enabled(false);
                disabledState.render($('#disabledSite'));

                var trackingState = Vastardis.UI.Components.ComponentFactory2.create('/Components/Button.component', { text: 'Tracking' });
                trackingState.cssClass(Vastardis.UI.Components.Button.defaultOptions.trackingCssClass);
                trackingState.render($('#trackingSite'));

                var activeSite = Vastardis.UI.Components.ComponentFactory2.create('/Components/Button.component', { text: 'Active' });
                activeSite.cssClass(Vastardis.UI.Components.Button.defaultOptions.activeCssClass);
                activeSite.render($('#activeSite'));

                var customSite = Vastardis.UI.Components.ComponentFactory2.create('/Components/Button.component', { text: 'Custom', cssClass: 'customButton' });
                customSite.render($('#customSite'));

                var eventing = Vastardis.UI.Components.ComponentFactory2.create('/Components/Button.component', { text: 'Eventing' });
                $(eventing).bind('click', function() {
                    $('#eventingMessage').text('clicked');
                });
                eventing.render($('#eventingSite'));
            });
        })(jQuery);        
    </script>
</asp:Content>

