export function ngRefDirective($parse: any): {
    priority: number;
    restrict: string;
    compile(tElement: any, tAttrs: any): (scope: any, element: any, attrs: any) => void;
};
export namespace ngRefDirective {
    let $inject: string[];
}
