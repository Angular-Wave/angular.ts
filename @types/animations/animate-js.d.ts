export function AnimateJsProvider($animateProvider: any): void;
export class AnimateJsProvider {
    constructor($animateProvider: any);
    $get: (string | (($injector: any, $$AnimateRunner: any) => (element: any, event: any, classes: any, options: any) => {
        $$willAnimate: boolean;
        end(): any;
        start(): any;
    }))[];
}
export namespace AnimateJsProvider {
    let $inject: string[];
}
