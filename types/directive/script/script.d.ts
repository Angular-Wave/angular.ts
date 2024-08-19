export const scriptDirective: (string | (($templateCache: any) => {
    restrict: string;
    terminal: boolean;
    compile(element: any, attr: any): void;
}))[];
