export function ASTInterpreter($filter: any): void;
export class ASTInterpreter {
    constructor($filter: any);
    $filter: any;
    compile(ast: any): any;
    recurse(ast: any, context: any, create: any): any;
    "unary+": (argument: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => any;
    "unary-": (argument: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => any;
    "unary!": (argument: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary+": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => any;
    "binary-": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => number | {
        value: number;
    };
    "binary*": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => number | {
        value: number;
    };
    "binary/": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => number | {
        value: number;
    };
    "binary%": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => number | {
        value: number;
    };
    "binary===": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary!==": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary==": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary!=": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary<": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary>": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary<=": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary>=": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => boolean | {
        value: boolean;
    };
    "binary&&": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => any;
    "binary||": (left: any, right: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => any;
    "ternary?:": (test: any, alternate: any, consequent: any, context: any) => (scope: any, locals: any, assign: any, inputs: any) => any;
    value(value: any, context: any): () => any;
    identifier(name: any, context: any, create: any): (scope: any, locals: any) => any;
    computedMember(left: any, right: any, context: any, create: any): (scope: any, locals: any, assign: any, inputs: any) => any;
    nonComputedMember(left: any, right: any, context: any, create: any): (scope: any, locals: any, assign: any, inputs: any) => any;
    inputs(input: any, watchId: any): (scope: any, value: any, locals: any, inputs: any) => any;
}
