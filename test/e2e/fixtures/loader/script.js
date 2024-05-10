angular
  .module("test", [
    "ngTouch",
    "ngRoute",
    "ngResource",
    "ngParseExt",
    "ngMessages",
    "ngMessageFormat",
    "ngCookies",
    "ngAria",
    "ngAnimate",
  ])
  .controller("TestController", ($scope) => {
    $scope.text = "Hello, world!";
  });
