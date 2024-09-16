/\*\*

- The `ngClass` directive allows you to dynamically set CSS classes on an HTML element by databinding
- an expression that represents all classes to be added.
-
- The directive operates in three different ways, depending on which of three types the expression
- evaluates to:
-
- 1.  If the expression evaluates to a string, the string should be one or more space-delimited class
- names.
-
- 2.  If the expression evaluates to an object, then for each key-value pair of the
- object with a truthy value the corresponding key is used as a class name.
-
- 3.  If the expression evaluates to an array, each element of the array should either be a string as in
- type 1 or an object as in type 2. This means that you can mix strings and objects together in an array
- to give you more control over what CSS classes appear. See the code below for an example of this.
-
-
- The directive won't add duplicate classes if a particular class was already set.
-
- When the expression changes, the previously added classes are removed and only then are the
- new classes added.
-
- @knownIssue
- You should not use {@link guide/interpolation interpolation} in the value of the `class`
- attribute, when using the `ngClass` directive on the same element.
- See {@link guide/interpolation#known-issues here} for more info.
-
- @animations
- | Animation | Occurs |
- |----------------------------------|-------------------------------------|
- | {@link ng.$animate#addClass addClass} | just before the class is applied to the element |
- | {@link ng.$animate#removeClass removeClass} | just before the class is removed from the element |
- | {@link ng.$animate#setClass setClass} | just before classes are added and classes are removed from the element at the same time |
-
- ### ngClass and pre-existing CSS3 Transitions/Animations
  The ngClass directive still supports CSS3 Transitions/Animations even if they do not follow the ngAnimate CSS naming structure.
  Upon animation ngAnimate will apply supplementary CSS classes to track the start and end of an animation, but this will not hinder
  any pre-existing CSS transitions already on the element. To get an idea of what happens during a class-based animation, be sure
  to view the step by step details of {@link $animate#addClass $animate.addClass} and
  {@link $animate#removeClass $animate.removeClass}.
-
- @param {String} ngClass {@link guide/expression Expression} to eval. The result
- of the evaluation can be a string representing space delimited class
- names, an array, or a map of class names to boolean values. In the case of a map, the
- names of the properties whose values are truthy will be added as css classes to the
- element.
- \*/

/\*\*

- The `ngClassOdd` and `ngClassEven` directives work exactly as
- {@link ng.directive:ngClass ngClass}, except they work in
- conjunction with `ngRepeat` and take effect only on odd (even) rows.
-
- This directive can be applied only within the scope of an
- {@link ng.directive:ngRepeat ngRepeat}.
-
- @animations
- | Animation | Occurs |
- |----------------------------------|-------------------------------------|
- | {@link ng.$animate#addClass addClass} | just before the class is applied to the element |
- | {@link ng.$animate#removeClass removeClass} | just before the class is removed from the element |
-
- @element ANY
- @param {string} ngClassOdd {@link guide/expression Expression} to eval. The result
- of the evaluation can be a string representing space delimited class names or an array.
-
- \*/

/\*\*

- The `ngClassOdd` and `ngClassEven` directives work exactly as
- {@link ng.directive:ngClass ngClass}, except they work in
- conjunction with `ngRepeat` and take effect only on odd (even) rows.
-
- This directive can be applied only within the scope of an
- {@link ng.directive:ngRepeat ngRepeat}.
-
- @animations
- | Animation | Occurs |
- |----------------------------------|-------------------------------------|
- | {@link ng.$animate#addClass addClass} | just before the class is applied to the element |
- | {@link ng.$animate#removeClass removeClass} | just before the class is removed from the element |
-
- @element ANY
- @param {string} ngClassEven {@link guide/expression Expression} to eval. The
- result of the evaluation can be a string representing space delimited class names or an array.
- \*/
