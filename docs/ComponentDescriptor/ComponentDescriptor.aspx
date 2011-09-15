<%@ Page Title="Vastardis UI Components Documentation - Component Descriptors" Language="C#"
    MasterPageFile="~/Components/Functional.master" AutoEventWireup="true" CodeFile="ComponentDescriptor.aspx.cs"
    Inherits="Components_Documentation_ComponentDescriptor_ComponentDescriptor" %>

<asp:Content ContentPlaceHolderID="Content" runat="Server">
    <h1>
        Overview</h1>
    <p>
        Any given component is comprised of 4 unique parts: Behaviours, Templates, Stylesheets,
        and Imports. Collectively, these four parts define the look and feel of a self contained
        widget. To ease development and reduce the number of client to server roundtrips,
        these four parts are joined together by the server on demand and sent to the client
        as one unique file. A component developer is required to inform the server side
        assembler (ComponentBuilder.cs) which server side resources are required for the
        assembly via a Component Descriptor file.
    </p>
    <p>
        The Component descriptor file is simply an XML file with a matching Schema which
        is parsed by the assembler to generate a JavaScript file with all of the underlying
        resources merged together into one request. This article gives a quick sample of
        the different parts of a descriptor file and what their effect is on the output
        of the assembler.
    </p>
    <h2>
        Referencing Components</h2>
    <p>
        Because of the server side assembly capability of Components, each Component has
        a unique URL that can be used to reference it. This unique URL will ultimately point
        to a single JavaScript file so it can either be referenced through simple <code>&lt;script&gt;</code>
        tags, through the ASP.NET <code>&lt;ScriptManager&gt;</code>, or through a dynamic
        request through other JavaScript files. The client side portion of the Component
        Library provides a static method which will construct an instance of a component
        through its unique URL: <code>Vastardis.UI.ComponentFactory2.create</code>:
        <div class="javascript" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #003366; font-weight: bold;">var</span> newComponent <span style="color: #339933;">
                            =</span> Vastardis.<span style="color: #660066;">UI</span>.<span style="color: #660066;">Components</span>.<span
                                style="color: #660066;">ComponentFactory2</span>.<span style="color: #660066;">create</span><span
                                    style="color: #009900;">&#40;</span><span style="color: #3366CC;">'/Components/Documentation/ComponentDescriptor/SampleDescriptor.component'</span><span
                                        style="color: #339933;">,</span> <span style="color: #006600; font-style: italic;">/*options*/</span><span
                                            style="color: #009900;">&#123;</span> <span style="color: #009900;">&#125;</span><span
                                                style="color: #009900;">&#41;</span><span style="color: #339933;">;</span></div>
                </li>
            </ol>
        </div>
    </p>
    <p>
        The assembler is a <code>IHttpHandler</code> written to filter only requests with
        the extension <code>component</code>. As such, there is a mapping between the physical
        XML Descriptor file and the URL that a component user will specify to reference
        the component: If a physical descriptor file is located at <code>/Components/[ComponentName]/ComponentName.xml</code>,
        then the user should reference the following URL: <code>/Components/[ComponentName].component</code>.
        Alternatively, the assembler will also accept: <code>/Components/[ComponentName]/[ComponentName].component</code>.
        We do not forsee any significant usages for the second syntax, but it is provided
        just in case.</p>
    <h2>
        Root Element</h2>
    <p>
        A given descriptor file has a root element with the following syntax:
        <div class="xml" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;?xml</span>
                            <span style="color: #000066;">version</span>=<span style="color: #ff0000;">&quot;1.0&quot;</span>
                            <span style="color: #000066;">encoding</span>=<span style="color: #ff0000;">&quot;utf-8&quot;</span>
                            <span style="color: #000000; font-weight: bold;">?&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;component</span>
                            <span style="color: #000066;">xmlns</span>=<span style="color: #ff0000;">&quot;http://schemas.vastcap.com/componentDefinition&quot;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #000066;">
                            type</span>=<span style="color: #ff0000;">&quot;Vastardis.UI.Components.Samples.Descriptor&quot;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #000066;">
                            inheritsFrom</span>=<span style="color: #ff0000;">&quot;Vastardis.UI.Components.Component&quot;</span></span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <span style="color: #000066;">
                            validates</span>=<span style="color: #ff0000;">&quot;false&quot;</span><span style="color: #000000;
                                font-weight: bold;">&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;/component<span
                            style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
            </ol>
        </div>
    </p>
    <p>
        The <strong>type</strong> attribute determines the fully qualified type name of
        the component generated by the assembler. This value is used to refer the JS class
        type generated in code. Generally speaking, you will use this type value to create
        instances of the class.
    </p>
    <p>
        The <strong>inheritsFrom</strong> attribute specifies the fully qualified type name
        of the component used as the superclass of the defined component. The default value
        is the root object of the Vastardis UI Component library: Vastardis.UI.Component.
    </p>
    <p>
        The <strong>validates</strong> attribute determines whether or not the component
        will use the built in validation infrastructure provided by the Component library.
    </p>
    <h2>
        Behaviour</h2>
    <p>
        The behaviour file for any given component is a JavaScript file with one required
        function: <code>window.getComponentType</code>. This function returns a reference
        to a JS class which performs all of the behavioural logic of the component. The
        behaviour file is referenced via the <code>&lt;behaviour&gt;</code> element in the
        descriptor:
        <div class="xml" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;?xml</span>
                            <span style="color: #000066;">version</span>=<span style="color: #ff0000;">&quot;1.0&quot;</span>
                            <span style="color: #000066;">encoding</span>=<span style="color: #ff0000;">&quot;utf-8&quot;</span>
                            <span style="color: #000000; font-weight: bold;">?&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;component</span>
                            <span style="color: #000066;">xmlns</span>=<span style="color: #ff0000;">&quot;http://schemas.vastcap.com/componentDefinition&quot;</span>
                            ...<span style="color: #000000; font-weight: bold;">&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;behaviour</span> <span style="color: #000066;">path</span>=<span style="color: #ff0000;">&quot;~/Components/Documentation/ComponentDescriptor/SampleDescriptor.js&quot;</span>
                            <span style="color: #000000; font-weight: bold;">/&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;/component<span
                            style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
            </ol>
        </div>
    </p>
    <h2>
        Templates</h2>
    <p>
        Templates are simply Mustache.JS code files which define the structural content
        of a given component. There are two sub-types: <strong>Base</strong> and <strong>partials</strong>.
        There can only be one base template and it serves an <em>entry point</em> into the
        templating system. On the other hand there can be multiple partials which serve
        as a nice means of modularizing a component&rsquo;s structure.
    </p>
    <p>
        Templates <strong>MUST</strong> be stored in individual files and the descriptor
        provides no means of authoring templates in-line. Templates are defined as follows
        in the descriptor file:
        <div class="xml" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;?xml</span>
                            <span style="color: #000066;">version</span>=<span style="color: #ff0000;">&quot;1.0&quot;</span>
                            <span style="color: #000066;">encoding</span>=<span style="color: #ff0000;">&quot;utf-8&quot;</span>
                            <span style="color: #000000; font-weight: bold;">?&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;component</span>
                            <span style="color: #000066;">xmlns</span>=<span style="color: #ff0000;">&quot;http://schemas.vastcap.com/componentDefinition&quot;</span>
                            ...<span style="color: #000000; font-weight: bold;">&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #808080; font-style: italic;">&lt;!-- ... --&gt;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;templates<span style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;base</span> <span style="color: #000066;">path</span>=<span style="color: #ff0000;">&quot;~/Components/Documentation/ComponentDescriptor/SampleDescriptor.html&quot;</span>
                            <span style="color: #000000; font-weight: bold;">/&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;partial</span> <span style="color: #000066;">name</span>=<span style="color: #ff0000;">&quot;apartial&quot;</span>
                            <span style="color: #000066;">path</span>=<span style="color: #ff0000;">&quot;~/Components/Documentation/ComponentDescriptor/SampleDescriptor.partial.html&quot;</span><span
                                style="color: #000000; font-weight: bold;">/&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;/templates<span style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #808080; font-style: italic;">&lt;!-- ... --&gt;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;/component<span
                            style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
            </ol>
        </div>
    </p>
    <h2>
        Stylesheets</h2>
    <p>
        Stylesheets are self-explanitory. They are simply CSS Stylesheets used to provide
        a distinct visual look for a given component. As it stands now, a given component
        will typically only require one stylesheet, but the assembler provides a means of
        including multiple. For example, in the future we may serve browser specific CSS
        files or culture specific CSS files. Similar to Templates, the descriptor file does
        not provide a means of authoring Stylesheets inline and they must be contained in
        an external file. Stylesheets are defined as follows in the descriptor file:
        <div class="xml" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;?xml</span>
                            <span style="color: #000066;">version</span>=<span style="color: #ff0000;">&quot;1.0&quot;</span>
                            <span style="color: #000066;">encoding</span>=<span style="color: #ff0000;">&quot;utf-8&quot;</span>
                            <span style="color: #000000; font-weight: bold;">?&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;component</span>
                            <span style="color: #000066;">xmlns</span>=<span style="color: #ff0000;">&quot;http://schemas.vastcap.com/componentDefinition&quot;</span>
                            ...<span style="color: #000000; font-weight: bold;">&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #808080; font-style: italic;">&lt;!-- ... --&gt;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;stylesheets<span style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;stylesheet</span> <span style="color: #000066;">path</span>=<span style="color: #ff0000;">&quot;~/Components/Documentation/ComponentDescriptor/SampleDescriptor.css&quot;</span>
                            <span style="color: #000000; font-weight: bold;">/&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;/stylesheets<span style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #808080; font-style: italic;">&lt;!-- ... --&gt;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;/component<span
                            style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
            </ol>
        </div>
    </p>
    <h2>
        Imports</h2>
    <p>
        Imports are a means of providing dependency resolution hints to components. They
        are simply references to other JavaScript files (including components!) which a
        component requires before it will function correctly. Imports are specified in the
        descriptor file like so:
        <div class="xml" style="font-family: monospace; color: #006; border: 1px solid #d0d0d0;
            background-color: #f0f0f0;">
            <ol>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;?xml</span>
                            <span style="color: #000066;">version</span>=<span style="color: #ff0000;">&quot;1.0&quot;</span>
                            <span style="color: #000066;">encoding</span>=<span style="color: #ff0000;">&quot;utf-8&quot;</span>
                            <span style="color: #000000; font-weight: bold;">?&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;component</span>
                            <span style="color: #000066;">xmlns</span>=<span style="color: #ff0000;">&quot;http://schemas.vastcap.com/componentDefinition&quot;</span>
                            ...<span style="color: #000000; font-weight: bold;">&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #808080; font-style: italic;">&lt;!-- ... --&gt;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;imports<span style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
                <li style="font-weight: bold; vertical-align: top; font-weight: bold; color: #006060;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;import</span> <span style="color: #000066;">path</span>=<span style="color: #ff0000;">&quot;~/Components/Documentation/ComponentDescriptor/ExtraFunctions.js&quot;</span><span
                                style="color: #000000; font-weight: bold;">/&gt;</span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">
                            &lt;/imports<span style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        &nbsp; <span style="color: #808080; font-style: italic;">&lt;!-- ... --&gt;</span></div>
                </li>
                <li style="font-weight: normal; vertical-align: top; font: normal normal 130% 'Courier New', Courier, monospace;
                    color: #003030;">
                    <div style="font: normal normal 1em/1.2em monospace; margin: 0; padding: 0; background: none;
                        vertical-align: top; color: #000020;">
                        <span style="color: #009900;"><span style="color: #000000; font-weight: bold;">&lt;/component<span
                            style="color: #000000; font-weight: bold;">&gt;</span></span></span></div>
                </li>
            </ol>
        </div>
    </p>
    <p>
        Note that each <strong>unique</strong> import incurs a client server request roundtrip.
        That is, if an import is requested multiple times only the first one will be serviced,
        the others will simply reference the cache copy.</p>
    <h2>
        References</h2>
    <ul>
        <li><a href="SampleDescriptor.xml">XML file</a></li>
    </ul>
</asp:Content>
