/**
 * @returns {angular.IDirective}
 */
export function ngSwitchWhenDirective(): angular.IDirective;
/**
 * @returns {angular.IDirective}
 */
export function ngSwitchDefaultDirective(): angular.IDirective;
export const ngSwitchDirective: (
  | string
  | (($animate: any) => {
      require: string;
      controller: (
        | string
        | {
            new (): {
              cases: {};
            };
          }
      )[];
      link(scope: any, _element: any, attr: any, ngSwitchController: any): void;
    })
)[];
