export function identifierForController(controller: any, ident: any): any;
/**
 * The {@link ng.$controller $controller service} is used by AngularJS to create new
 * controllers.
 *
 * This provider allows controller registration via the
 * {@link ng.$controllerProvider#register register} method.
 */
export function $ControllerProvider(): void;
export class $ControllerProvider {
    /**
     * @param {string} name Controller name to check.
     */
    has: (name: string) => any;
    /**
     * @param {string|Object} name Controller name, or an object map of controllers where the keys are
     *    the names and the values are the constructors.
     * @param {Function|Array} constructor Controller constructor fn (optionally decorated with DI
     *    annotations in the array notation).
     */
    register: (name: string | any, constructor: Function | any[]) => void;
    $get: (string | (($injector: import("../../core/di/internal-injector").InjectorService) => (expression: Function | string, locals: any, later: any, ident: any) => any))[];
}
