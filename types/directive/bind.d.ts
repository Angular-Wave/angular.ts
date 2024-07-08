/**
 * @returns {angular.IDirective}
 */
export function ngBindDirective(): angular.IDirective;
/**
 * @returns {angular.IDirective}
 */
export function ngBindTemplateDirective(): angular.IDirective;
/**
 * TODO: add type
 */
export const ngBindHtmlDirective: (
  | string
  | (($parse: any) => {
      restrict: string;
      compile: (
        _tElement: any,
        tAttrs: any,
      ) => (scope: any, element: any) => void;
    })
)[];
