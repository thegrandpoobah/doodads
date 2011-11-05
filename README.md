# doodads.js - Modular UI Construction Kit

Doodads is a set of JavaScript code blocks that provide a solid foundation to build modular UI Controls for use in Web 2.0+ applications. The overarching design of the infrastructure is the idea that all UI Controls are separable into four unique parts:

* Structure (HTML, SVG, MathML, etc.)
* Look (CSS)
* Feel (Event Driven JavaScript)
* Behavior (Logic implemented as JavaScript)

Accordingly, the infrastructure completely separates these four parts into distinct code modules which allows for very low coupling and high cohesion (two highly desirable software engineering traits).

The infrastructure seamlessly assembles these constituent parts into a single entity, allowing Control authors not to get mired in the overly technical aspects of page design. In addition, because each component is a completely independent entity, they are reusable and customizable.