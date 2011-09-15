<%@ Page Title="Vastardis UI Components - Validation Infrastructure" Language="C#"
    MasterPageFile="~/Components/Functional.master" AutoEventWireup="true" CodeFile="Validation.aspx.cs"
    Inherits="Components_Documentation_Validation_Validation" %>

<asp:Content ContentPlaceHolderID="Content" runat="Server">
    <h1>
        Overview</h1>
    <p>
        This page provides an overview and code samples of the major aspects of the Validation
        infrastrucutre of the Vastardis UI Components library. The infrastrucutre is composed
        of 3 distinct parts: Rules, Callouts, Events. Rules provide a collection of criteria
        that an input context must pass before the input context is considered valid. These
        come in two variants: Syncronous and Asyncronous. The difference between the two
        is described in the Asyncronous Rules section. Callouts are a means of triggering
        validation on a component whose validation state changes based on user input in
        another component. Finally, there are two events that are exposed by the infrastructure
        as a means of <em>using</em> the validation infrastructure.
    </p>
    <p>
        In addition to the three parts, the validation infrastructure uses the existing
        composition graph of the underlying component library to specify a validation hierarchy.
        This concept is further described in the Validation Hierarchy section.
    </p>
    <h2>
        Rules</h2>
    <p>
        A Rule is a self-contained atomic <em>criteria</em> which operates on a particular
        input <em>context</em>. If the criteria passes, the context is considered to be
        valid. If the criteria fails, the context is considered to be invalid. Components
        contain a reference to a list of rules which allow the user to specify the set of
        criteria that must be passed before the component is considered to be a valid state.
    </p>
    <p>
        In implementation, a Rule is a class which has one method with the following signature:
        <div class="javascript" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #003366; font-weight: bold;">function</span><span style="color: #009900;">&#40;</span><span
                            style="color: #009900;">&#41;</span> <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #000066; font-weight: bold;">this</span>.<span
                            style="color: #660066;">validate</span> <span style="color: #339933;">=</span>
                        <span style="color: #003366; font-weight: bold;">function</span><span style="color: #009900;">&#40;</span><span
                            style="color: #009966; font-style: italic;">/*context, args*/</span><span style="color: #009900;">&#41;</span>
                        <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #000066; font-weight: bold;">return</span>
                        <span style="color: #009900;">&#123;</span> valid<span style="color: #339933;">:</span>
                        boolean<span style="color: #339933;">,</span> message<span style="color: #339933;">:</span>
                        string<span style="color: #339933;">,</span> alwaysShow<span style="color: #339933;">:</span>
                        boolean <span style="color: #009900;">&#125;</span><span style="color: #339933;">;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #009900;">&#125;</span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;">&#125;</span></div>
                </li>
            </ol>
        </div>
    </p>
    <p>
        The <code>context</code> parameter of the <code>validate</code> function is the
        input from the user that needs to be validated. The type of <code>context</code>
        is determined by the control. For example, in the TextBox, context is simply a string,
        but in the DropDown it is a object literal.</p>
    <p>
        The <code>args</code> parameter of the <code>validate</code> function is a object
        literal which gives more information regarding the internal working state of the
        validation infrastructure. It has the following type signature:
        <div class="javascript" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; computedValidity<span style="color: #339933;">:</span> boolean<span style="color: #339933;">,</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; isCallout<span style="color: #339933;">:</span> boolean<span style="color: #339933;">,</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; callback<span style="color: #339933;">:</span> <span style="color: #003366;
                            font-weight: bold;">function</span><span style="color: #009900;">&#40;</span>validationResult<span
                                style="color: #009900;">&#41;</span> <span style="color: #009900;">&#123;</span><span
                                    style="color: #009900;">&#125;</span><span style="color: #339933;">,</span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; callee<span style="color: #339933;">:</span> component</div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;">&#125;</span></div>
                </li>
            </ol>
        </div>
        Generally speaking, it is only useful when doing complex validation rules which
        are considered deviations from out standard model. For example, short circuiting
        validation rules can be implemented by interrogating the <code>computedValidity</code>
        property.
    </p>
    <p>
        The <code>valid</code> member of the return value of the <code>validate</code> function
        speficies whether the criteria passed (true) or not (false).</p>
    <p>
        The <code>message</code> member of the return value of the <code>validate</code>
        function speficies the message to display to the user if the criteria has failed.</p>
    <p>
        The <code>alwaysShow</code> member of the return value of the <code>validate</code>
        function speficies whether or not to always show the message to the end user. This
        is useful for implementing warning systems such as remaining character counts.</p>
    <h3>
        Example Rule</h3>
    <p>
        Below is an example rule which checks to see if an input string of a textbox is
        an integer value or not:
        <div class="javascript" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #003366; font-weight: bold;">function</span><span style="color: #009900;">&#40;</span><span
                            style="color: #009900;">&#41;</span> <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #000066; font-weight: bold;">this</span>.<span
                            style="color: #660066;">validate</span> <span style="color: #339933;">=</span>
                        <span style="color: #003366; font-weight: bold;">function</span><span style="color: #009900;">&#40;</span>content<span
                            style="color: #009900;">&#41;</span> <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #000066; font-weight: bold;">return</span>
                        <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; message<span style="color: #339933;">:</span>
                        <span style="color: #3366CC;">'Not an integer'</span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #339933;">,</span> valid<span style="color: #339933;">:</span>
                        <span style="color: #009900;">&#40;</span>parseInt<span style="color: #009900;">&#40;</span>content<span
                            style="color: #009900;">&#41;</span> <span style="color: #339933;">+</span>
                        <span style="color: #3366CC;">''</span><span style="color: #009900;">&#41;</span>
                        <span style="color: #339933;">===</span> content</div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #009900;">&#125;</span><span style="color: #339933;">;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #009900;">&#125;</span><span style="color: #339933;">;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp;<span style="color: #009900;">&#125;</span></div>
                </li>
            </ol>
        </div>
    </p>
    <h2>
        Asyncronous Rules</h2>
    <p>
        Generally speaking, a given rule should compute the validity result in a very very
        short period of time. However, there are instances where it may be useful to ask
        the server to compute the validity of a given field or the validation genuinely
        takes a long time to compute. In these scenarios you would implement the criteria
        as an asyncronous rule. By using the asyncronousity flag, the infrastructure will
        handle all the gory details of how to reconcile and present the asyncronous validation
        state to the end user.
    </p>
    <h3>
        Example Asyncronous Rule</h3>
    <p>
        Below is an example rule which checks the validity state of a textbox using a fictional
        web service method:
        <div class="javascript" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #003366; font-weight: bold;">var</span> rule <span style="color: #339933;">
                            =</span> <span style="color: #003366; font-weight: bold;">new</span> <span style="color: #003366;
                                font-weight: bold;">function</span><span style="color: #009900;">&#40;</span><span
                                    style="color: #009900;">&#41;</span> <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #000066; font-weight: bold;">this</span>.<span
                            style="color: #660066;">validate</span> <span style="color: #339933;">=</span>
                        <span style="color: #003366; font-weight: bold;">function</span><span style="color: #009900;">&#40;</span>context<span
                            style="color: #339933;">,</span> args<span style="color: #009900;">&#41;</span>
                        <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; $.<span style="color: #660066;">ajax</span><span style="color: #009900;">&#40;</span><span
                            style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; method<span style="color: #339933;">:</span>
                        <span style="color: #3366CC;">'WebService.asmx/IsInteger'</span><span style="color: #339933;">,</span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; data<span style="color: #339933;">:</span>
                        context<span style="color: #339933;">,</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; success<span style="color: #339933;">:</span>
                        <span style="color: #003366; font-weight: bold;">function</span><span style="color: #009900;">&#40;</span>result<span
                            style="color: #009900;">&#41;</span> <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; args.<span style="color: #660066;">callback</span><span
                            style="color: #009900;">&#40;</span>result<span style="color: #009900;">&#41;</span><span
                                style="color: #339933;">;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #009900;">&#125;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #009900;">&#125;</span><span style="color: #009900;">&#41;</span><span
                            style="color: #339933;">;</span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp;</div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #000066; font-weight: bold;">return</span>
                        <span style="color: #009900;">&#123;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; async<span style="color: #339933;">:</span>
                        <span style="color: #003366; font-weight: bold;">true</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #009900;">&#125;</span><span style="color: #339933;">;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #009900;">&#125;</span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;">&#125;</span></div>
                </li>
            </ol>
        </div>
    </p>
    <h2>
        Events</h2>
    <p>
        There are two events exposed by the validation infrastructure to a given component:
        <code>valid</code> and <code>invalid</code>. Whenever the validity state of a component
        <em>changes</em> as a result of a programmatic/user initiated change, these events
        are triggered on the component. A user can consume these events and perform presentation
        logic as a result.</p>
    <h2>
        Validation Hierarchy</h2>
    <p>
        The Component library has a built-in concept of a component tree which is basically
        an in-memory representation of the ownership hierarchy of the components present
        on the page. That is, the component hierarchy provides a means of bubbling/capturing
        events and callbacks between different components using a simple parent/child relationship
        model. In addition it provides an easy way of maintaining life cycle information
        for components.
    </p>
    <p>
        The validation infrastructure piggy-backs on the component hierarchy by exposing
        two events which traverse the hierarchy in a leaf to root fashion (bubbling). In
        this way, the default validation state of a component is coded to be dependent on
        the validation state of its children. This is a safe default and eases the implementation
        of such concepts as page level validation and validation groups.</p>
    <h2>
        Callouts</h2>
    <p>
        The previous section touched on the Validation Hierarchy which explained the default
        flow of validation events between components. There are however scenarios where
        you would want to have the event flow follow a non-tree graph. As a prototypical
        example, consider the concept of a date range: The From Date cannot be past the
        To date and vice versa. That is, when the state of one control changes, the validity
        state of <em>both</em> needs to be checked. The default event flow does not provide
        a means of performing this kind of validation. Fortunately, the infrastructure does
        provide a means of constructing non-tree validation graphs through the usage of
        <em>callouts</em>. Callouts are a collection of components maintained by a validating
        component, which specify which additional components need to be validated when the
        rules for the validating component are being run. In the case of the Date Range
        example, the From input box would specify the To input box as the callout, and vice
        versa. In this way, whenever the validity state of one of them changes, the other
        must compute its validity state as well.
    </p>
    <h2>
        Example: Credit Card Numbers</h2>
    <p>
        Credit Card numbers are prefixed with an <em>n</em> digit issuer number. Based on
        this number, you can implement a quick check to make sure the number a user types
        is actually valid for the type of credit card they've selected. This example implements
        this simple check using the validation infrastructure. This sample demonstates callouts, rules, and hierarchies.</p>
    <div>
        Credit Card type: <span class="dropdownContainer"></span>
    </div>
    <div>
        Credit Card number: <span class="issuerContainer"></span><span class="numberContainer">
        </span>
    </div>
    <div>The validity state is: <span class="validityContainer">Invalid!</span></div>

    <script type="text/javascript">
        (function($, undefined) {
            $(document).ready(function() {
                var validationContainer = new Vastardis.UI.Components.Component({});

                var issuer = Vastardis.UI.Components.ComponentFactory2.create('/Components/TextBox.component');
                issuer.render($('.issuerContainer'));
                issuer.parent(validationContainer);
                issuer.addRule(new function() {
                    this.validate = function(content) {
                        var n = parseInt(content),
                            msg = '',
                            v = true;

                        switch ((types.selected() || { id: 0 }).id) {
                            case 1: // VISA
                                if (n !== 4) {
                                    msg = 'VISA cards always begin with 4';
                                    v = false;
                                }
                                break;
                            case 2: // MasterCard
                                if (n < 51 || n > 55) {
                                    msg = 'Mastercard numbers always begin with a two digit number between 51 and 55';
                                    v = false;
                                }
                                break;
                            default:
                                msg = 'you must select a credit card type';
                                v = false;
                                break;
                        }
                        return {
                            message: msg
	            			, valid: v
                        };
                    };
                });

                var number = Vastardis.UI.Components.ComponentFactory2.create('/Components/TextBox.component');
                number.addRule(Vastardis.UI.Components.ValidationRules.Regex.Predefined.PositiveNumber('Must be a number'));
                number.parent(validationContainer);
                number.render($('.numberContainer'));

                var types = Vastardis.UI.Components.ComponentFactory2.create('/Components/DropDown.component', { watermark: 'Select a credit card type', required: true });
                types.parent(validationContainer);
                types.render($('.dropdownContainer'));
                types.addItem({ id: 1, text: 'VISA' });
                types.addItem({ id: 2, text: 'MasterCard' });

                types.addCallout(issuer);

                $(validationContainer)
                    .bind('valid', function() {
                        $('.validityContainer').html('Valid!');
                    })
                    .bind('invalid', function() {
                        $('.validityContainer').html('Invalid!');
                    });
            });
        })(jQuery);
    </script>

</asp:Content>
