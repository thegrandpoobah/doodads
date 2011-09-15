<%@ Page Title="Vastardis.UI.Components.TextBox" Language="C#" MasterPageFile="~/Components/Unit.master"
    AutoEventWireup="true" CodeFile="UnitTest.aspx.cs" Inherits="Components_TextBox_UnitTest" %>

<asp:Content ID="Content2" ContentPlaceHolderID="Content" runat="Server">
    <asp:ScriptManagerProxy runat="server">
        <Scripts>
            <asp:ScriptReference Path="~/Components/TextBox.component" />
        </Scripts>
    </asp:ScriptManagerProxy>

    <script type="text/javascript">
        (function ($) {
            $(document).ready(function () {

                header.text('Vastardis.UI.Components.TextBox + Validation');

                var vsc = Vastardis.UI.Components;

                module('Basic tests', {
                    setup: function () {
                        this.txt = new vsc.TextBox2({ id: 'myTextBox' });
                        this.txt.render($(document.body));
                    }
					, teardown: function () {
					    this.txt.dispose();
					}
                });

                test('Constructor', function () {
                    var txt = this.txt;
                    var $txt = $('#myTextBox');

                    var hasInput = $txt.find('input[type=text]')[0];
                    ok(hasInput, 'input[type=text] exists');

                    hasPassword = $txt.find('input[type=password]')[0];
                    ok(!hasPassword, 'input[type=password] does not exist');

                    hasTextarea = $txt.find('textarea')[0];
                    ok(!hasTextarea, 'textarea does not exist');

                    var hasStar = $txt.find('span.star')[0];
                    ok(!hasStar, 'Star exists');
                });

                test('Enabled', function () {
                    var txt = this.txt;
                    var $txt = $('#myTextBox');

                    txt.enabled(false);
                    ok($txt.find('input[type=text]').attr('disabled'), '::enabled(false)');

                    ok(!txt.enabled(), '::enabled() >> false');

                    txt.enabled(true);
                    ok(!$txt.find('input[type=text]').attr('disabled'), '::enabled(true)');

                    ok(txt.enabled(), '::enabled() >> true');
                });

                module('Text', {
                    setup: function () {
                        this.txt = new vsc.TextBox2({ id: 'myTextBox' });
                        this.txt.render($(document.body));
                    }
					, teardown: function () {
					    this.txt.dispose();
					}
                });

                test('Set/Get', function () {
                    var txt = this.txt;
                    var $txt = $('#myTextBox');

                    txt.text('sample');
                    equals($txt.find('input[type=text]').val(), 'sample', '::text(String)');

                    equals(txt.text(), 'sample', '::text()');
                });

                test('Trigger - Changing', function () {
                    var txt = this.txt;

                    var response = false;

                    $(txt).bind('changing', function () {
                        response = true;
                    });

                    txt.text('h');
                    ok(!response, 'Negative test - Event does not trigger');

                    txt.text('j', true);
                    ok(response, 'Positive test - Event triggers');

                    response = false;
                    txt.text('j', true);
                    ok(!response, 'Positive test - Event triggers');
                });

                test('Trigger - Changed', function () {
                    var txt = this.txt;

                    var response = false;

                    $(txt).bind('changed', function () {
                        response = true;
                    });

                    txt.text('h');
                    ok(!response, 'Negative test - Event does not trigger');

                    txt.text('j', true);
                    ok(response, 'Positive test - Event triggers');

                    response = false;
                    txt.text('j', true);
                    ok(!response, 'Positive test - Event triggers');
                });

                module('Validation', {
                    setup: function () {
                        this.txt = new vsc.TextBox2({ id: 'myTextBox' });
                        this.txt.render($(document.body));
                        this.requiredRule = new function () {
                            this.validate = function (text) {
                                return {
                                    valid: text.length > 0
                                };
                            };
                        }
                    }
					, teardown: function () {
					    this.txt.dispose();
					}
                });

                test('Adding rules', function () {
                    var txt = this.txt;

                    var rule1 = vsc.ValidationRules.Regex.Predefined.Number('Please Enter a valid number');
                    var rule2 = vsc.ValidationRules.Regex.Predefined.Number('Please Enter a valid number');
                    var rule3 = vsc.ValidationRules.Regex.Predefined.Number('Please Enter a valid number');

                    txt.addRule(rule1);
                    equals(txt._rules.length, 1, 'Rule added correctly');

                    txt.addRule([rule2, rule3]);
                    equals(txt._rules.length, 3, 'Rules added correctly (as an Array)');
                });

                test('Required', function () {
                    var txt = this.txt;

                    txt.required(true, this.requiredRule);
                    equals(txt._rules.length, 1, 'Rule for required is added');

                    ok(txt.required(), 'required: true (added rule)');

                    txt.required(false);
                    ok(!txt.required(), 'required: false');

                    ok(txt.valid(), 'valid: true');

                    txt.required(true);
                    ok(txt.required(), 'required: true');

                    txt.required(true);
                    equals(txt._rules.length, 1, 'no transition (single argument)');

                    txt.required(true, this.requiredRule);
                    equals(txt._rules.length, 1, 'no transition (two arguments/same rule)');

                    txt.required(true, vsc.ValidationRules.Regex.Predefined.Number('Please Enter a valid number'));
                    equals(txt._rules.length, 1, 'no transition (two arguments/different rule)');

                    txt.required(false);
                });

                test('Valid', function () {
                    var txt = this.txt;

                    txt.required(true, this.requiredRule);
                    ok(!txt.valid(), 'text(String.Empty)::required(true) >> invalid');

                    txt.text('test')
                    ok(txt.valid(), 'text(String)::required(true) >> valid');

                    txt.text('')
                    ok(!txt.valid(), 'text(String.Empty)::required(true) >> invalid');

                    txt.required(false);
                    ok(txt.valid(), 'text(String.Empty)::required(false) >> valid');

                    txt.required(true);
                    ok(!txt.valid(), 'text(String.Empty)::required(true) >> invalid');

                    var newRequiredRule = new function () {
                        this.validate = function () {
                            return {
                                valid: true
                            };
                        };
                    }

                    txt.required(true, newRequiredRule);
                    ok(txt.valid(), 'text(String.Empty), required(true): valid [rule has changed to always return true]');
                });

                test('Hintbox', function () {
                    var txt = this.txt;

                    var hasInputFocus = txt.hasInputFocus;
                    txt.hasInputFocus = function () { return true; }

                    var msg = 'Please enter a valid number';
                    var rule = vsc.ValidationRules.Regex.Predefined.Number(msg);
                    txt.addRule(rule);

                    txt.text('1a')
                    ok(!txt.valid(), '::text(NaN) >> invalid [this will insert a hint in the hintbox]');

                    var hintbox = $('div.hintbox');
                    ok(hintbox[0], 'hintbox exists');
                    ok(hintbox.is(':visible'), 'Hintbox is visible');

                    var hintlist = hintbox.find('ul.hintlist');
                    var re = new RegExp(msg);
                    ok(re.test(hintlist.text()), 'Hintlist contains valid message');

                    txt.text('1')
                    ok(txt.valid(), '::text(Int) >> valid [this should remove the hint in the hinbox]');

                    ok(!hintbox.is(':visible'), 'Hintbox should be hidden');

                    var msg = 'Please enter a number greater than 10';

                    var greaterThanRule = new function () {
                        this.validate = function (context) {
                            return {
                                valid: context > 10
                                , message: msg
                            }
                        }
                    }
                    txt.addRule(greaterThanRule);

                    txt.text('@');
                    var hintlist = $('div.hintbox .hintlist');
                    ok(hintbox.is(':visible'), 'Hintbox is visible');
                    equals(hintlist.children().length, 2, 'Hintbox message count');

                    txt.text('1');
                    hintlist = $('div.hintbox .hintlist');
                    equals(hintlist.children().length, 1, 'Hintbox message count');
                    re = new RegExp(msg);
                    ok(re.test(hintlist.text()), 'Hintbox message');

                    txt.text('11');
                    hintlist = $('div.hintbox .hintlist');
                    equals(hintlist.children().length, 0, 'Hintbox message count');
                });

                test('Valid/Invalid Triggers', function () {
                    var txt = this.txt;
                    var response = true;
                    var msg = 'Please enter a valid number';
                    var rule = vsc.ValidationRules.Regex.Predefined.Number(msg);
                    txt.addRule(rule);

                    $(txt)
						.bind('valid', function () {
						    response = true;
						})
						.bind('invalid', function () {
						    response = false;
						});

                    txt.text('@');
                    ok(!response, 'Negative test - "invalid" is triggered');

                    response = false;
                    txt.text('@@');
                    ok(!response, 'Negative test - "invalid" is not triggered, since validity state hasn\'t changed');

                    txt.text('10');
                    ok(response, 'Positive test - "valid" is triggered');
                });

                module('Multi-level validation', {
                    setup: function () {
                        this.parent = new vsc.Component({});

                        this.childA = new vsc.TextBox2({ id: 'childA', required: true });
                        this.childB = new vsc.TextBox2({ id: 'childB', required: true });

                        this.childA.render($(document.body));
                        this.childB.render($(document.body));

                        this.parent.addChild(this.childA);
                        this.parent.addChild(this.childB);
                    }
					, teardown: function () {
					    this.parent.dispose();
					}
                });

                test('Validity bubbling up to parent', function () {
                    var parent = this.parent;
                    var childA = this.childA;
                    var childB = this.childB;

                    childA.required(true, this.requiredRule);
                    childB.required(true, this.requiredRule);
                    ok(!parent.valid(), 'childA::text(String.Empty)::required(true), childB::text(String.Empty)::required(true) >> parent - invalid');

                    childA.required(false);
                    ok(!parent.valid(), 'childA::text(String.Empty)::required(false), childB::text(String.Empty)::required(true) >> parent - invalid');

                    childB.required(false);
                    ok(parent.valid(), 'childA::text(String.Empty)::required(false), childB::text(String.Empty)::required(false) >> parent - valid');

                    childA.required(true);
                    childB.required(true);
                    childA.text('1');
                    ok(!parent.valid(), 'childA::text(String)::required(true), childB::text(String.Empty)::required(true) >> parent - invalid');

                    childB.text('1');
                    ok(parent.valid(), 'childA::text(String)::required(true), childB::text(String)::required(true) >> parent - invalid');
                });

                test('Parent Valid/Invalid triggers', function () {
                    var parent = this.parent;
                    var childA = this.childA;
                    var childB = this.childB;
                    var response = true;

                    childA.required(true, this.requiredRule);
                    childB.required(true, this.requiredRule);

                    $(parent)
						.bind('valid', function () {
						    response = true;
						})
						.bind('invalid', function () {
						    response = false;
						});

                    childA.text('1');
                    childB.text('1');
                    ok(response, 'Positive test - "valid" is triggered');

                    response = false;
                    childA.text('1');
                    childB.text('1');
                    ok(!response, 'Negative test - "valid" is not triggered, since validity state hasn\'t changed');
                    response = true;

                    childA.text('');
                    childB.text('1');
                    ok(!response, 'Negative test - "invalid" is triggered');
                });

                test('Event propagation', function () {
                    var parent = this.parent;
                    var childA = this.childA;
                    var childB = this.childB;
                    var parentResponse = false;
                    var childReponse = false;
                    var propagate = false;

                    childA.required(true, this.requiredRule);
                    childB.required(true, this.requiredRule);

                    $(parent)
						.bind('valid', function () {
						    parentResponse = true;
						})
						.bind('invalid', function () {
						    parentResponse = false;
						});

                    $([childA, childB])
						.bind('valid', function (e, args) {
						    childReponse = true;
						    if (!propagate) args.stopPropagation();
						})
						.bind('invalid', function (e, args) {
						    childReponse = false;
						    if (!propagate) args.stopPropagation();
						});

                    childA.text('1');
                    childB.text('1');
                    ok(!parentResponse, 'Negative test - propagation to parent stopped');

                    propagate = true;
                    childB.text('');
                    childB.text('1');
                    ok(parentResponse, 'Positive test - propagating to parent');
                });

                module('Callouts', {
                    setup: function () {
                        this.parent = new vsc.Component({});

                        this.childA = new vsc.TextBox2({ id: 'childA', required: true });
                        this.childB = new vsc.TextBox2({ id: 'childB', required: true });

                        this.childA.render($(document.body));
                        this.childB.render($(document.body));

                        this.parent.addChild(this.childA);
                        this.parent.addChild(this.childB);
                    }
					, teardown: function () {
					    this.parent.dispose();
					}
                });

                test('Simple', function () {
                    var parent = this.parent;
                    var childA = this.childA;
                    var childB = this.childB;

                    var rule = new function () {
                        this.validate = function () {
                            return {
                                valid: childA.text() === childB.text()
								, message: "Values don't match"
                            }
                        }
                    }

                    childA.addRule(rule);
                    childB.addRule(rule);

                    childA.addCallout(childB);
                    childB.addCallout(childA);

                    childA.text(1);
                    ok(!childA.valid() && !childB.valid() && !parent.valid(), 'Negative test');

                    childB.text(1);
                    ok(childA.valid() && childB.valid() && parent.valid(), 'Positive test');

                    childA.text(2);
                    ok(!childA.valid() && !childB.valid() && !parent.valid(), 'Negative test');

                    childB.text(2);
                    ok(childA.valid() && childB.valid() && parent.valid(), 'Positive test');

                    childA.text(4);
                    childB.text(5);
                    ok(!childA.valid() && !childB.valid() && !parent.valid(), 'Negative test');

                    childA.text(6);
                    childB.text(6);
                    ok(childA.valid() && childB.valid() && parent.valid(), 'Positive test');
                });

                test('Cycles', function () {
                    var parent = this.parent;
                    var childA = this.childA;
                    var childB = this.childB;
                    var childC = new vsc.TextBox2({ required: true });

                    parent.addChild(childC);

                    childC.render($(document.body));

                    var rule = new function () {
                        this.validate = function () {
                            return {
                                valid: childA.text() === childB.text() && childB.text() === childC.text()
                            }
                        }
                    }

                    childA.addRule(rule);
                    childB.addRule(rule);
                    childC.addRule(rule);

                    childA.addCallout([childB, childC]);
                    childB.addCallout([childA, childC]);
                    childC.addCallout([childA, childB]);

                    childA.text(1);
                    childB.text(1);
                    childC.text(1);
                    ok(childA.valid() && childB.valid() && childC.valid() && parent.valid(), 'Positive test');

                    childA.text(1);
                    childB.text(2);
                    childC.text(1);
                    ok(!childA.valid() && !childB.valid() && !childC.valid() && !parent.valid(), 'Negative test');
                });

                test('Single Call', function () {
                    var parent = this.parent;
                    var childA = this.childA;
                    var childB = this.childB;

                    var cached = null;
                    var testCount = 0;

                    var rule = new function () {
                        this.validate = function (context, args) {
                            var valid = false;

                            if (args.computedValidity) {
                                if (!args.isCallout) {
                                    cached = childA.text() === childB.text();
                                    testCount++;
                                }
                                valid = cached;
                            }

                            return {
                                valid: cached
                            }
                        }
                    }

                    childA.addRule(rule);
                    childB.addRule(rule);

                    childA.addCallout([childB]);
                    childB.addCallout([childA]);

                    childA.text(1);
                    childB.text(1);

                    equals(testCount, 2);

                    ok(childA.valid() && childB.valid && parent.valid(), 'Positive test');

                    childB.text('');
                    childB.text(2);
                    equals(testCount, 3);
                });

                module('Async validation', {
                    setup: function () {
                        this.txt = new vsc.TextBox2({ id: 'childA', required: true });
                        this.txt.render($(document.body));
                    }
					, teardown: function () {
					    this.txt.dispose();
					}
                });

                asyncTest('core', function () {
                    var txt = this.txt;

                    var rule = new function () {
                        this.validate = function (context, args) {
                            setTimeout(function () {
                                var result = {
                                    valid: context === '1',
                                    message: 'Rule 1 failed'
                                };

                                equals(args.callee._backList.length, 2, 'Rule count');
                                //ok(args.callee._backList[1].isAsync, 'Inserted rule is async');

                                start();
                                args.callback(result);
                            }, 500);

                            return {
                                async: true
                            };
                        }
                    }

                    var rule2 = new function () {
                        this.validate = function (context, args) {
                            setTimeout(function () {
                                var result = {
                                    valid: context === '1',
                                    message: 'Rule 2 failed'
                                };

                                start();
                                args.callback(result);
                            }, 200);

                            return {
                                async: true
                            };
                        }
                    }

                    txt.addRule(rule);
                    txt.addRule(vsc.ValidationRules.Regex.Predefined.Number('Please Enter a valid number'));

                    txt.text('A');

                    txt.addRule(rule2);
                    txt.text('A');

                });

                module('No validation', {
                    setup: function () {
                        this.txt = new vsc.TextBox2({ id: 'myTextBox', validates: false });
                        this.txt.render($(document.body));
                    }
					, teardown: function () {
					    this.txt.dispose();
					}
                });

                test('Test', function () {
                    equals(this.txt.required, undefined);
                });

            });
        })(jQuery);    
    </script>

</asp:Content>
