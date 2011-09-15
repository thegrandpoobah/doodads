<%@ Page Title="" Language="C#" MasterPageFile="~/Components/Unit.master" AutoEventWireup="true" CodeFile="UnitTest.aspx.cs" Inherits="Components_Button_UnitTest" %>

<asp:Content ContentPlaceHolderID="Stylesheets" Runat="Server">
</asp:Content>
<asp:Content ContentPlaceHolderID="Content" Runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/Button.component" />            
        </Scripts>
    </asp:ScriptManagerProxy>
    <script type="text/javascript">
        (function($) {
            $(document).ready(function() {

                header.text('Vastardis.UI.Components.Button')
                
                var vsc = Vastardis.UI.Components;

		        module('Enable', {
                    setup: function() {
                        this.button = new vsc.Button({
                            id: 'myButton',
                            enabled: false,
                        });
				        this.button.render($(document.body));
                    }
                    , teardown: function() {
                        this.button.dispose();
                    }
                });
        		
                test("set", function() {
                    var button = this.button;
                    var $btn = $('#myButton');
        		
			        ok($btn.hasClass(button._options.disabledCssClass), 'DOM element should have <disabledCssClass>');
        			
                    button.enabled(true);
                    ok(!$btn.hasClass(button._options.disabledCssClass), 'DOM element should NOT have <disabledCssClass>');
                });
        		
		        test("get", function() {
                    var button = this.button;
                    var $btn = $('#myButton');

                    button.enabled(true);
                    ok(button.enabled(), "Positive test");
        			
			        button.enabled(false);
			        ok(!button.enabled(), "Negative test");			
                });
        		
		        module('Text', {
                    setup: function() {
                        this.button = new vsc.Button({
                            id: 'myButton',
                            text: 'Click me'
                        });
				        this.button.render($(document.body));
                    }
                    , teardown: function() {
                        this.button.dispose();
                    }
                });
        		
        		
                test("set", function() {
                    var button = this.button;
                    var $btn = $('#myButton');

                    button.text('sample text');
                    equals($btn.text(), 'sample text', "text('value') works");
                });
        		
		        test("get", function() {
		            var button = this.button;
                    var $btn = $('#myButton');

                    button.text('str');
                    equals(button.text(), 'str', "text() works");
                });
        		
		        module('Class', {
                    setup: function() {
                        this.button = new vsc.Button({
                            id: 'myButton',
                            text: 'Click me'
                        });
				        this.button.render($(document.body));
                    }
                    , teardown: function() {
                        this.button.dispose();
                    }
                });

		        test("cssClass", function() {
                    var button = this.button;
                    var $btn = $('#myButton');

                    button.cssClass('randomClass')
                    ok($btn.hasClass('randomClass'), "set");

			        equals(button.cssClass(), 'randomClass', "get");
                });
        		
		        module('Event', {
                    setup: function() {
                        this.button = new vsc.Button({
                            id: 'myButton',
                            text: 'Click me',
                            enabled: false,
                            trackingCssClass: 'down',
                            hoverCssClass: 'over'
                        });
				        this.button.render($(document.body));
				        this.e = { preventDefault: $.noop, stopPropagation: $.noop };
                    }
                    , teardown: function() {
                        this.button.dispose();
                    }
                });
        		
                test("mouse Down/Up", function() {
                    var button = this.button;
			        var $btn = $('#myButton');
			        var e = this.e;

                    button.enabled(true);
                    button.onMouseDown(e);
                    ok($btn.hasClass('down'), "onMouseDown() - button enabled, should have <mouseDownCssClass>");

                    button.enabled(false);
                    button.onMouseDown(e);
                    ok(!$btn.hasClass('down'), "onMouseDown() - button disabled, should NOT have <mouseDownCssClass>");

                    button.enabled(true);
                    button.onMouseDown(e);
                    button.onMouseUp(e);
                    ok(!$btn.hasClass('down'), "onMouseUp() - should NOT have <mouseDownCssClass>");
                });

                test("mouse Over/Out", function() {
                    var button = this.button;
			        var $btn = $('#myButton');
			        var e = this.e;

                    button.enabled(true);
                    button.onMouseOver(e);
                    ok($btn.hasClass('over'), "onMouseOver() - button enabled, should have <mouseOverCssClass>");

                    button.onMouseOut(e);
                    ok(!$btn.hasClass('over'), "onMouseOut() - button enabled, should NOT have <mouseOverCssClass>");
                });

                test("click", function() {
                    var button = this.button;
			        var $btn = $('#myButton');
			        var e = this.e;

                    button.enabled(true);

                    var result = false;
                    $(button).bind('click', function() {
                        result = true;
                    });
                    button.onClick(e);
                    ok(result, "button enabled, should fire the 'click' trigger");

                    result = false;
                    button.enabled(false);
                    button.onClick(e);
                    ok(!result, "button disabled, should NOT fire the 'click' trigger");
                });

            });
        })(jQuery);    
    </script>
</asp:Content>

