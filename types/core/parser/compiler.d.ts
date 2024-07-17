export function ASTCompiler($filter: any): void;
export class ASTCompiler {
    constructor($filter: any);
    $filter: any;
    compile(ast: any): any;
    state: {
        nextId: number;
        filters: {};
        fn: {
            vars: any[];
            body: any[];
            own: {};
        };
        assign: {
            vars: any[];
            body: any[];
            own: {};
        };
        inputs: any[];
    };
    stage: string;
    watchFns(): string;
    generateFunction(name: any, params: any): string;
    filterPrefix(): string;
    varsPrefix(section: any): string;
    body(section: any): any;
    recurse(ast: any, intoId: any, nameId: any, recursionFn: any, create: any, skipWatchIdCheck: any): void;
    getHasOwnProperty(element: any, property: any): any;
    assign(id: any, value: any): any;
    filter(filterName: any): any;
    ifDefined(id: any, defaultValue: any): string;
    plus(left: any, right: any): string;
    return_(id: any): void;
    if_(test: any, alternate: any, consequent: any): void;
    not(expression: any): string;
    isNull(expression: any): string;
    notNull(expression: any): string;
    nonComputedMember(left: any, right: any): string;
    computedMember(left: any, right: any): string;
    member(left: any, right: any, computed: any): string;
    getStringValue(item: any): void;
    lazyRecurse(ast: any, intoId: any, nameId: any, recursionFn: any, create: any, skipWatchIdCheck: any): () => void;
    lazyAssign(id: any, value: any): () => void;
    stringEscapeRegex: RegExp;
    stringEscapeFn(c: any): string;
    escape(value: any): any;
    nextId(skip: any, init: any): string;
    current(): any;
}
