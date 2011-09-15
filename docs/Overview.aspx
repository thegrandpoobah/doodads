<%@ Page Title="Vastardis UI Components - Overview" Language="C#" MasterPageFile="~/Components/Functional.master"
    AutoEventWireup="true" CodeFile="Overview.aspx.cs" Inherits="Components_Documentation_Overview" %>

<asp:Content ID="Content1" ContentPlaceHolderID="Head" runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="Stylesheets" runat="Server">
    <style type="text/css">
        h1
        {
            clear: both;
        }
        
        div.figure
        {
            font-size: 80%;
            margin: 5px;
        }
        div.figure > div
        {
            margin-bottom: 5px;
        }
    </style>
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="Content" runat="Server">
    <h1>
        Background</h1>
    <p>
        <div class="figure" style="float: right; width: 228px;">
            <div>
                <img src="Images/BlockDiagram.png" /></div>
            <div>
                <strong>Figure 1</strong> - Block Diagram of a Component</div>
        </div>
        As web applications grow more and more complicated, increasing amounts of modularity
        have to be introduced into the application design. One place where this modularization
        has historically been difficult to achieve has been in the User Interface layer.
        One industry tested method of achieving this modularization is through the use of
        UI Controls. UI Controls are code blocks that encapsulate the look and behaviour
        of a small chunk of the entire User Interface. Well known examples of UI controls
        include buttons, checkboxes, and radio buttons. The Component Infrastructure is
        a set of JavaScript code blocks that provide a solid foundation to build modular
        UI Controls for use in Web 2.0+ applications. The overarching design of the infrastructure
        is the idea that all UI Controls are separable into four unique parts:
        <ul>
            <li><strong>Structure:</strong> HTML, SVG, MathML, etc...</li>
            <li><strong>Look:</strong> CSS</li>
            <li><strong>Feel:</strong> Event Driven JavaScript</li>
            <li><strong>Behaviour:</strong> Logic implemented as JavaScript</li>
        </ul>
        Accordingly, the infrastructure completely separates these four parts into distinct
        code modules which allows for very low coupling and high cohesion (two highly desirable
        software engineering traits). The infrastructure seamlessly assembles these constituent
        parts into a single entity, allowing Control authors not to get mired in the overly
        technical aspects of page design. In addition, because each component is a completely
        independent entity, they are reusable and customizable.
    </p>
    <h1>
        Composability</h1>
    <p>
        <div class="figure" style="float: left; width: 228px;">
            <div>
                <img src="Images/Composition.png" /></div>
            <div>
                <strong>Figure 2</strong> - Block Diagram of a Component</div>
        </div>
        Composability in UI architecture refers to property of UI Controls where individual
        UI Controls are able to <em>assemble</em> together to create a more complex UI representation
        which is still reusable. For example, on a hypothetical dashboard, all widgets are
        required to have a title bar, and Maximize/Minimize buttons as part of their frame
        decoration. If you already have Controls representing Buttton, Frame, and Label,
        you can assemble them into Widget Decorator with little hassle. Composability is
        a core part of the Component Infrastructure and is implemented through the use of
        Declarative Mark-up and explicit Parent/Child relationships between individual Components.
        In addition, the Composition Hierarchy of the infrastructure is not tied to the
        DOM hierarchy allowing for expressive composition relationships. Figure 2 shows
        a potential Composition Hierarchy for a Component.
    </p>
    <h1>
        Flexibility</h1>
    <p>
        At run time, there are two primary paradigms of creating rich UI controls. The first
        is to use JavaScript to completely construct the necessary HTML code, while the
        second is to use JavaScript to build a richer representation of existing HTML nodes
        in a document. In practice, existing libraries are restricted to the usage of one
        method or the other. The Component Infrastructure, on the other hand, promotes a
        pragmatic approach to the choice of methods. For some components it makes sense
        to use the second method since it simplifies the generation of DOM, whereas for
        others it may be preferable to use the first for reasons of performance or ease
        of implementation. Either way, the Component Infrastructure does not enforce either
        and leaves the choice to the Control author. This flexibility allows authors to
        create non-HTML based Controls, such as SVG, MathML, XML, and even Flash. This design
        also allows for the usage of third party controls which do not use have awareness
        of the Component Infrastructure in any way. For example, a jQuery UI control could
        be initialized within a Component, or perhaps let the jQuery UI control wrap around
        an existing Component.</p>
    <h1>
        Technical Documentation</h1>
    <ul>
        <li><a href="ComponentDescriptor/ComponentDescriptor.aspx">Component Descriptor Schema</a></li>
        <li><a href="Validation/Validation.aspx">Adding Validation to Components</a></li>
    </ul>
</asp:Content>
