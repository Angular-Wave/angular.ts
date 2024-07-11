export function createEventDirective(
  $parse: any,
  $rootScope: any,
  $exceptionHandler: any,
  directiveName: any,
  eventName: any,
  forceAsync: any,
): {
  restrict: string;
  compile(_element: any, attr: any): (scope: any, element: any) => void;
};
export const ngEventDirectives: {};
