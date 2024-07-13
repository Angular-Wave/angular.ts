export const ngIncludeDirective: (string | (($templateRequest: any, $anchorScroll: any, $animate: any) => {
    restrict: string;
    priority: number;
    terminal: boolean;
    transclude: string;
    controller: () => void;
    compile(_element: any, attr: any): (scope: any, $element: any, _$attr: any, ctrl: any, $transclude: any) => void;
}))[];
export const ngIncludeFillContentDirective: (string | (($compile: any) => {
    restrict: string;
    priority: number;
    require: string;
    link(scope: any, $element: any, _$attr: any, ctrl: any): void;
}))[];
