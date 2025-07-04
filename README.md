## AngularTS

![Build status](https://github.com/Angular-Wave/angular.ts/actions/workflows/ci.yml/badge.svg)
[![stats](https://data.jsdelivr.com/v1/package/npm/@angular-wave/angular.ts/badge?style=rounded)](https://www.jsdelivr.com/package/npm/@angular-wave/angular.ts)

This project preserves, modernises and expands the original [AngularJS](https://angularjs.org/)
framework. AngularTS is "AngularJS: The Good Parts". It takes the three core pillars of the original &ndash; a string-interpolation engine,
dependency injection, two-way data-binding &ndash; and adds a reactive change-detection model on top of modern build tooling with strong typechecking of TypeScript.

With AngularJS, you get a decade-long optimization effort of Angular Team at Google, plus a massive testing suite, required for applications like Google Cloud and Kubernetes.
AngularTS adds:

- a fully reactive change-detection model without digests or virtual DOMs, like `Vue`
- access to native DOM APIs at component and directive level (no `JQuery`or `JQLite`)
- access to native Promises API (no `$q` or `$timetout`)
- built-in enterprise-level router (`ui-router` ported as `ng-router`)
- built-in animations (`animate`)
- new directives, inspired by `HTMX`

The result is a high-performance, buildless, progressive and battle-tested JS framework that stays as close to Web standards as possible.
If you write server-rendered web applications for desktop and mobile, and do not wish to leave the comfort of your tech-stack, this is your new secret weapon.

### Getting started

#### Install

```bash
$ npm i @angular-wave/angular.ts

```

or

```html
<script src="
    https://cdn.jsdelivr.net/npm/@angular-wave/angular.ts/dist/angular-ts.umd.min.js
"></script>
```

Initialize your app

```html
<div ng-app ng-init="x='world'">Hello {{ x }}</div>
```

Or check out the updated [Angular seed](https://github.com/Angular-Wave/angular-seed), which can serve as a solid starting point
or a source of inspiration for new ideas.

New docs website is coming!

### Legacy docs

---

- Web site: https://angularjs.org
- Tutorial: https://docs.angularjs.org/tutorial
- API Docs: https://docs.angularjs.org/api
- Developer Guide: https://docs.angularjs.org/guide
- Contribution guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)
- Core Development: [DEVELOPERS.md](DEVELOPERS.md)
- Dashboard: https://dashboard.angularjs.org

## Documentation

Go to https://docs.angularjs.org

## Contribute

We've set up a separate document for our
[contribution guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md).

## Develop

We've set up a separate document for
[developers](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md).

## What to use AngularTS for and when to use it

AngularTS is the next generation framework where each component is designed to work with every other
component in an interconnected way like a well-oiled machine. AngularTS is JavaScript MVC made easy
and done right. (Well it is not really MVC, read on, to understand what this means.)

#### MVC, no, MV\* done the right way!

[MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller), short for
Model-View-Controller, is a design pattern, i.e. how the code should be organized and how the
different parts of an application separated for proper readability and debugging. Model is the data
and the database. View is the user interface and what the user sees. Controller is the main link
between Model and View. These are the three pillars of major programming frameworks present on the
market today. On the other hand AngularTS works on MV\*, short for Model-View-_Whatever_. The
_Whatever_ is AngularTS's way of telling that you may create any kind of linking between the Model
and the View here.

Unlike other frameworks in any programming language, where MVC, the three separate components, each
one has to be written and then connected by the programmer, AngularTS helps the programmer by asking
him/her to just create these and everything else will be taken care of by AngularTS.

#### Interconnection with HTML at the root level

AngularTS uses HTML to define the user's interface. AngularTS also enables the programmer to write
new HTML tags (AngularTS Directives) and increase the readability and understandability of the HTML
code. Directives are AngularTS’s way of bringing additional functionality to HTML. Directives
achieve this by enabling us to invent our own HTML elements. This also helps in making the code DRY
(Don't Repeat Yourself), which means once created, a new directive can be used anywhere within the
application.

HTML is also used to determine the wiring of the app. Special attributes in the HTML determine where
to load the app, which components or controllers to use for each element, etc. We specify "what"
gets loaded, but not "how". This declarative approach greatly simplifies app development in a sort
of WYSIWYG way. Rather than spending time on how the program flows and orchestrating the various
moving parts, we simply define what we want and AngularTS will take care of the dependencies.

#### Data Handling made simple

Data and Data Models in AngularTS are plain JavaScript objects and one can add and change properties
directly on it and loop over objects and arrays at will.

#### Two-way Data Binding

One of AngularTS's strongest features. Two-way Data Binding means that if something changes in the
Model, the change gets reflected in the View instantaneously, and the same happens the other way
around. This is also referred to as Reactive Programming, i.e. suppose `a = b + c` is being
programmed and after this, if the value of `b` and/or `c` is changed then the value of `a` will be
automatically updated to reflect the change. AngularTS uses its "scopes" as a glue between the Model
and View and makes these updates in one available for the other.

#### Less Written Code and Easily Maintainable Code

Everything in AngularTS is created to enable the programmer to end up writing less code that is
easily maintainable and readable by any other new person on the team. Believe it or not, one can
write a complete working two-way data binded application in less than 10 lines of code. Try and see
for yourself!

#### Testing Ready

AngularTS has Dependency Injection, i.e. it takes care of providing all the necessary dependencies
to its controllers and services whenever required. This helps in making the AngularTS code ready for
unit testing by making use of mock dependencies created and injected. This makes AngularTS more
modular and easily testable thus in turn helping a team create more robust applications.
