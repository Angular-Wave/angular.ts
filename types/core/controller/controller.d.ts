export function identifierForController(controller: any, ident: any): any;
/**
 * @ngdoc provider
 * @name $controllerProvider
 *
 *
 * @description
 * The {@link ng.$controller $controller service} is used by AngularJS to create new
 * controllers.
 *
 * This provider allows controller registration via the
 * {@link ng.$controllerProvider#register register} method.
 */
export function $ControllerProvider(): void;
export class $ControllerProvider {
    /**
     * @ngdoc method
     * @name $controllerProvider#has
     * @param {string} name Controller name to check.
     */
    has: (name: string) => any;
    /**
     * @ngdoc method
     * @name $controllerProvider#register
     * @param {string|Object} name Controller name, or an object map of controllers where the keys are
     *    the names and the values are the constructors.
     * @param {Function|Array} constructor Controller constructor fn (optionally decorated with DI
     *    annotations in the array notation).
     */
    register: (name: string | any, constructor: Function | any[]) => void;
    $get: (string | (($injector: any) => (expression: Function | string, locals: any, later: any, ident: any) => any))[];
}
