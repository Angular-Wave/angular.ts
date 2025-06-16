# ngController Directive

## Description

The `ngController` directive attaches a controller class to the view. This is a key aspect of how Angular supports the principles behind the Model-View-Controller design pattern.

### MVC components in Angular:

- **Model**: Models are the properties of a scope; scopes are attached to the DOM where scope properties are accessed through bindings.
- **View**: The template (HTML with data bindings) that is rendered into the View.
- **Controller**: The `ngController` directive specifies a Controller class; the class contains business logic behind the application to decorate the scope with functions and values.

Note that you can also attach controllers to the DOM by declaring it in a route definition via the [$route](https://docs.angularjs.org/api/ngRoute/service/$route) service. A common mistake is to declare the controller again using `ng-controller` in the template itself. This will cause the controller to be attached and executed twice.

## Element

`ANY`

## Scope

Yes

## Priority

500

## Parameter

- **ngController**: Name of a constructor function registered with the current [$controllerProvider](https://docs.angularjs.org/api/ng/provider/$controllerProvider) or an [expression](https://docs.angularjs.org/guide/expression) that on the current scope evaluates to a constructor function.

  The controller instance can be published into a scope property by specifying `ng-controller="as propertyName"`.

## Example

Here is a simple form for editing user contact information. Adding, removing, clearing, and greeting are methods declared on the controller (see source tab). These methods can easily be called from the AngularTS markup. Any changes to the data are automatically reflected in the View without the need for a manual update.

Two different declaration styles are included below:

- One binds methods and properties directly onto the controller using `this`: `ng-controller="SettingsController1 as settings"`
- One injects `$scope` into the controller: `ng-controller="SettingsController2"`

The second option is more common in the AngularTS community and is generally used in boilerplates and in this guide. However, there are advantages to binding properties directly to the controller and avoiding scope.

- Using `controller as` makes it obvious which controller you are accessing in the template when multiple controllers apply to an element.
- If you are writing your controllers as classes you have easier access to the properties and methods, which will appear on the scope, from inside the controller code.
- Since there is always a `.` in the bindings, you don't have to worry about prototypal inheritance masking primitives.
