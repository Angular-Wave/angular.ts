export function ngAnimateSwapDirective($animate: any): {
    restrict: string;
    transclude: string;
    terminal: boolean;
    priority: number;
    link(scope: any, $element: any, attrs: any, ctrl: any, $transclude: any): void;
};
export namespace ngAnimateSwapDirective {
    let $inject: string[];
}
