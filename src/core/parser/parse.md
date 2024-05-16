// Sandboxing AngularJS Expressions
// ------------------------------
// AngularJS expressions are no longer sandboxed. So it is now even easier to access arbitrary JS code by
// various means such as obtaining a reference to native JS functions like the Function constructor.
//
// As an example, consider the following AngularJS expression:
//
// {}.toString.constructor('alert("evil JS code")')
//
// It is important to realize that if you create an expression from a string that contains user provided
// content then it is possible that your application contains a security vulnerability to an XSS style attack.
//
// See https://docs.angularjs.org/guide/security
