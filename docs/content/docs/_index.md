---
title: Documentation
linkTitle: Docs
menu: {main: {weight: 20}}
---

Welcome to AngularTS documentation. 

This section is a work in progress. Its content will be updated regularly but feel free to rely on [AngularJS](https://docs.angularjs.org/guide) 
documentation in the meantime. 

-------

### What is AngularTS?

AngularTS is buildless, typesafe and reactive JS framework for building stuctured web-applications at any scale. It continues the legacy
of [AngularJS](https://angularjs.org/) by providing the best developer-experience and immediate productivity without 
the burden of JS ecosystem tooling. Getting started with AngularTS does not even require Javascript. All you need is a little bit of HTML.

Below is a canonical counter example:

#### Example 
{{< showhtml src="examples/counter/counter.html" >}}

#### Result 
{{< showraw src="examples/counter/counter.html" >}}

-------

This code demonstrates the following key AngularTS features:

- **HTML-first:** AngularTS is designed for HTML-first approach, meaning your application logic can be expressed 
declaratively in your markup using custom attributes (called *directives* in AngularTS terminology). Here we are
using `ng-init` directive to initialize our application state and `ng-click` directive to add an event-handler that
changes our state. 
  
- **Template-driven:** AngularTS comes with a built-in template engine, that allows us to declaratively reflect the appliaction state 
without any manual DOM manipulation.  The `{{count}}` expression above is an example of Angular's interpolation syntax.
As the value of `count` variable increases, our UI is automatically updated with the new state.

- **Island-first and zero-cost:** AngularTS creates an application on any HTML tag with `ng-app` attribute, 
allowing multiple independent applications to live on a single page. The enables AngularTS to work along your existing tech-stack 
where the majority of your page is rendered on the server, while AngularTS is isolated to small “islands” (regions of your page)
where custom interactivity or personalization is required. 

- **Micro-framework appearance:** With its minimal setup, AngularTS is well-suited for quick experiments, LLM-generated code, 
and learning web development in general. But beneath its lightweight surface, it supports structured enterprise-design patterns, 
MVC architecture, and components-driven design. With its rich directive library, state-based routing and animations, AngularTS is
a feature-complete package for building large SPAs, server, mobile, and desktop applications.






