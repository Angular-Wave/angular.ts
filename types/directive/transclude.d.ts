export const ngTranscludeDirective: (string | (($compile: any) => {
    restrict: string;
    compile: (tElement: any) => ($scope: any, $element: any, $attrs: any, controller: any, $transclude: any) => void;
}))[];
