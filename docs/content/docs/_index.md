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

AngularTS is buildless, type-safe and reactive JS framework for building stuctured web applications at any scale. It continues the legacy
of [AngularJS](https://angularjs.org/) of providing the best developer experience via immediate productivity without 
the burden of JS ecosystem tooling. Getting started with AngularTS does not even require JavaScript. All you need is a little bit of HTML.
Below is a canonical example of a counter:

#### Example 
{{< showhtml src="examples/counter/counter.html" >}}

#### Result 
{{< showraw src="examples/counter/counter.html" >}}

-------

This code demonstrates the following key AngularTS features:

- **HTML-first:** AngularTS is designed for HTML-first approach, meaning your application logic can be expressed 
declaratively in your markup using custom attributes--called *directives*. Here, we are
using `ng-init` directive to initialize our application state and `ng-click` directive to add an event handler that
changes our state. 
  
- **Template-driven:** AngularTS’s built-in template engine automatically keeps the UI in sync with your 
application state, eliminating the need for manual DOM tracking and updates. The `{{count}}` expression 
above is an example of Angular's interpolation syntax. As the value of `count` variable increases, 
our UI is updated with the new state.

- **Island-first and zero-cost:** AngularTS creates an application on any HTML tag with `ng-app` attribute, 
allowing multiple independent applications to live on a single page. The enables AngularTS to work alongside your existing 
tech stack where the majority of your page is rendered on the server, while AngularTS is isolated to small “islands” 
(regions of your page) where custom interactivity or personalization is required. 

- **Micro-framework appearance:** With its minimal setup, AngularTS is well-suited for quick experiments, LLM-generated code, 
and learning web development in general. But beneath its lightweight surface, it supports structured enterprise design patterns, 
MVC architecture, and component-driven design. With its rich directive library, state-based routing and support for animations, AngularTS is
a complete package for building large SPAs, server, mobile, and desktop applications.






