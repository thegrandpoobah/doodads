<%@ Page Title="Vastardis.UI.Components.Component" Language="C#" MasterPageFile="~/Components/Unit.master"
    AutoEventWireup="true" CodeFile="UnitTest.aspx.cs" Inherits="Components_Component_UnitTest" %>

<asp:Content ContentPlaceHolderID="Content" runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
        </Scripts>
    </asp:ScriptManagerProxy>
    <script type="text/javascript">
        (function ($, undefined) {
            $(document).ready(function () {
                var vsc = Vastardis.UI.Components;

                module('ID Mangling', {
                    setup: function () {
                        this.parent = new vsc.Component({ id: 'root' });
                        this.child = new vsc.Component({ id: 'child' });
                        this.descendant = new vsc.Component({ id: 'descendant' });
                    }
                    , teardown: function () {
                    }
                });

                test('Basic Mangling Test', function () {
                    this.parent.addChild(this.child);
                    equals(this.child.computedId(), 'root_child', 'Mangling');

                    this.child.id('renamedChild');
                    equals(this.child.computedId(), 'root_renamedChild', 'Renaming child');

                    this.parent.id('renamedRoot');
                    equals(this.child.computedId(), 'renamedRoot_renamedChild', 'Renaming Root');
                });

                test('Multi-Level Mangling Test', function () {
                    this.parent.addChild(this.child);
                    this.parent.addChild(this.descendant);
                    this.child.addChild(this.descendant);
                    equals(this.descendant.computedId(), 'root_child_descendant', 'Reparenting a child');

                    this.child.removeChild(this.descendant);
                    equals(this.descendant.computedId(), 'descendant', 'Detaching a child');
                });

                test('Complex Mangling Test', function () {
                    this.parent.addChild(this.child);
                    this.child.addChild(this.descendant);

                    this.child.id('');
                    equals(this.child.computedId(), '', 'No ID');
                    equals(this.descendant.computedId(), 'root_descendant', 'ID mangling with missing ancestor');

                    this.child.id('remapId');
                    equals(this.descendant.computedId(), 'root_remapId_descendant', 'Changing parent id');
                });

                module('DOM Attachment', {
                    setup: function () {
                        this.component = new vsc.Component({ id: 'component' });
                    },
                    teardown: function () {
                        this.component.detachElement();
                    }
                });

                test('Simple Tests', function () {
                    ok(!this.component.isAttached(), 'Negative Attachment Test');

                    this.component.render($(document.body));
                    ok(this.component.isAttached(), 'Positive Attachment Test');
                });

                test('Callback Tests', function () {
                    var attachmentCount = 0;
                    this.component.onAttached = function () { attachmentCount++; };
                    this.component.onDetached = function () { attachmentCount--; };

                    this.component.render($(document.body));
                    ok(attachmentCount === 1, 'onAttached callback');

                    this.component.detachElement();
                    ok(attachmentCount === 0, 'onDetached callback');
                });

                module('CSS Class', {
                    setup: function () {
                        this.component = new vsc.Component({ cssClass: 'basicOverride' });
                    }
                });

                test('Prefix', function () {
                    this.component.cssClassPrefix = function () { return 'prefix'; };

                    equals(this.component.element().attr('class'), 'prefix basicOverride');
                });

                test('Override', function () {
                    equals(this.component.element().attr('class'), 'basicOverride', 'Through constructor parameters');

                    this.component.cssClass('complexOverride');
                    equals(this.component.element().attr('class'), 'complexOverride', 'Through cssClass property');
                });

                module('Declarative Component Construction', {
                    setup: function () {
                        function TestComponent(options, defaultOptions) {
                            if (arguments.length === 0) { return; }

                            vsc.Component.call(this, $.extend({}, defaultOptions, options), TestComponent.defaultOptions);
                        }
                        TestComponent.defaultOptions = {
                            templates: {
                                'base': '<div><component id="bling" options="{foo:\'bar\'}" onbaz="onBaz"><script type="text/mustache" partial="row">{{=~~ ~~=}}this is an addit{{!hi!}}ional template.~~={{ }}=~~</scr' + 'ipt></component></div>'
                            }
                        };
                        TestComponent.prototype = $.extend(new vsc.Component(), { onBaz: function (e) { ok(true, 'Declarative Event Binding: Auto Triggered'); } });

                        this.component = new TestComponent({});
                    }
                    , teardown: function () {
                        this.component.dispose();
                    }
                });

                test('Child Component', function () {
                    this.component.render($(document.body));
                    ok(this.component._bling, 'Automatic Private property insertion');

                    equals(this.component._bling._options.foo, 'bar', 'Automatic Option Bag parsing');
                    equals(typeof (this.component.onBaz$proxy), 'function', 'Declarative Event Binding: Proxy Generation');

                    $(this.component._bling).trigger('baz');
                });

                test('Declarative Template Overrides', function () {
                    var z = new vsc.Component({});
                    z.render($(document.body));

                    this.component.render($(document.body));

                    equals(this.component._bling._options.templates['row'], 'this is an addit{{!hi!}}ional template.', 'Declarative Template overrides');
                    notEqual(this.component._bling._options.templates.__compiledTemplate, vsc.Component.defaultOptions.templates.__compiledTemplate, 'Declarative Template overrides (compiled form)');

                    z.dispose();
                });

                module('Declarative DOM References', {
                    setup: function () {
                        function TestComponent(options, defaultOptions) {
                            if (arguments.length === 0) { return; }

                            vsc.Component.call(this, $.extend({}, defaultOptions, options), TestComponent.defaultOptions);
                        }

                        var baseTemplate = ['<div>, <span name="foo bar baz">The SPan</span>'];
                        for (var i = 0; i < 100; i++) {
                            baseTemplate.push('<div class="iter' + i + '">');
                            baseTemplate.push('<ul name="a_' + i + '">');
                            baseTemplate.push('<li name="a1_' + i + '">');
                            baseTemplate.push('<div name="b_' + i + '" class="b">');
                            baseTemplate.push('</div>');
                            baseTemplate.push('</li>');
                            baseTemplate.push('<li name="a1_' + i + '">');
                            baseTemplate.push('<div name="c_' + i + '" class="c">');
                            baseTemplate.push('</div>');
                            baseTemplate.push('</li>');
                            baseTemplate.push('</ul>');
                            baseTemplate.push('<span name="d_' + i + '">');
                            baseTemplate.push('<div>');
                            baseTemplate.push('<input name="e_' + i + '" type="textbox" />');
                            baseTemplate.push('</div>');
                            baseTemplate.push('</span>');
                            baseTemplate.push('</div>');
                        }
                        baseTemplate.push('</div>');

                        TestComponent.defaultOptions = {
                            autoDOMReferences: true
                            , templates: {
                                'base': baseTemplate.join('')
                            }
                        };
                        TestComponent.prototype = $.extend(new vsc.Component(), {
                    });

                    this.component = new TestComponent({});
                }
                    , teardown: function () {
                        this.component.dispose();
                    }
            });

            test('Correctness', function () {
                this.component.render($(document.body));
                ok(this.component._foo[0] === this.component._bar[0] && this.component._foo[0] && this.component._baz[0], 'Aliasing');
                equals(this.component._a_1[0].tagName, 'UL', 'Matched Single');
                equals(this.component._a1_10.length, 2, 'Matched Multiple');
            });

            test('Lifecycle', function () {
                this.component.render($(document.body));
                this.component.rerender();
                this.component.rerender();
                equals(this.component._a1_10.length, 2, 'Matched Multiple');
            });

            module('Shared compiled template cache', {});

            test('Correctness', function () {
                var Mustache$compile = Mustache.compile;
                var counter = 0;
                Mustache.compile = function () {
                    counter++;
                    return Mustache$compile.apply(null, arguments);
                }

                vsc.Component.defaultOptions.templates.__compiledTemplate = null;
                var a = new vsc.Component({});
                var b = new vsc.Component({});

                a.render($(document.body));
                b.render($(document.body));

                equals(counter, 1, 'Compile template only once');

                a.dispose();
                b.dispose();

                Mustache.compile = Mustache$compile;
            });

            test('Override template', function () {
                var Mustache$compile = Mustache.compile;
                var counter = 0;
                Mustache.compile = function () {
                    counter++;
                    return Mustache$compile.apply(null, arguments);
                }

                vsc.Component.defaultOptions.templates.__compiledTemplate = null;
                var a = new vsc.Component({});
                var b = new vsc.Component({});

                a.render($(document.body));

                b.template('<span>Maria Taylor</span>');
                b.render($(document.body));

                equals(counter, 2, 'Overridden template causes recompilation');
                ok(a._options.templates != b._options.templates, 'Instance is no longer shared');

                a.dispose();
                b.dispose();

                Mustache.compile = Mustache$compile;
            });

            module('Hierarchical Resizing', {
                setup: function () {
                    this.component = new vsc.Component({ id: 'root' });
                },
                teardown: function () {
                    this.component.dispose();
                }
            });

            asyncTest('Simple Test', function () {
                this.component.onResize = function () { ok(true, 'onResize triggers correctly'); start(); };

                this.component.render($(document.body));
                $(window).trigger('resize');
            });

            asyncTest('Child with no Resizing ancestor', function () {
                var child = new vsc.Component({ id: 'child1' });
                child.onResize = function () { ok(true, 'child 1 onResize triggers correctly'); start(); };

                this.component.addChild(child);

                ok(!child._isResizeAutotriggered(), '_isResizeAutotriggered test'); // testing private members is generally bad

                this.component.render($(document.body));
                child.render($(document.body));

                $(window).trigger('resize');
            });

            asyncTest('Child with Resizing ancestor', function () {
                this.component.onResize = function () { }; // enable participation

                var child = new vsc.Component({ id: 'child2' });
                child.onWindowResize = function () { ok(false, 'child::onWindowResize should not be called'); };
                child.onResize = function () { ok(true, 'child 2 onResize triggers correctly'); start(); };

                this.component.addChild(child);
                this.component.render($(document.body));
                child.render($(document.body));

                $(window).trigger('resize');
            });

            module('Component Hierarchy');

            test('Bidirectional References', function () {
                var p1 = new vsc.Component({});
                var p2 = new vsc.Component({});
                var c1 = new vsc.Component({});
                var c2 = new vsc.Component({});

                p1.addChild(c1);
                p1.addChild(c2);
                ok(c1.parent() === p1 && c2.parent() === p1 && p1._children.length === 2, 'Initial Hierarchy is correct');

                c1.parent(p2);
                ok(c1.parent() === p2 && c2.parent() === p1 && p1._children.length === 1 && p2._children.length === 1, 'Mutation via parent maintains correct hierarchy');

                p2.addChild(c2);
                ok(c1.parent() === p2 && c2.parent() === p2 && p1._children.length === 0 && p2._children.length === 2, 'Mutation via addChild maintains correct hierarchy');

                p2.removeChild(c2);
                ok(c1.parent() === p2 && c2.parent() === null && p1._children.length === 0 && p2._children.length === 1, 'Mutation via removeChild maintains correct hierarchy');
            });

            test('Unidirectional Disposal', function () {
                var a = new vsc.Component({});
                var b = new vsc.Component({});
                var c = new vsc.Component({});
                var d = new vsc.Component({});

                a.addChild(b);
                b.addChild(c);
                b.addChild(d);

                d.dispose();

                equals(b._children.length, 1, 'B has the correct number of children');
            });

            test('Bi-directional Disposal', function () {
                var a = new vsc.Component({});
                var b = new vsc.Component({});
                var c = new vsc.Component({});
                var d = new vsc.Component({});

                a.addChild(b);
                b.addChild(c);
                b.addChild(d);

                b.dispose();

                equals(a._children.length, 0, 'A has the correct number of children');
            });

        });
    })(jQuery);
    </script>
</asp:Content>
