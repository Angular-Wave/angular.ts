export const ngOptionsDirective: (
  | string
  | ((
      $compile: import("../../core/compile/compile.js").CompileFn,
      $parse: import("../../core/parse/interface.ts").ParseService,
    ) => {
      restrict: string;
      terminal: boolean;
      require: string[];
      link: {
        pre: (scope: any, selectElement: any, attr: any, ctrls: any) => void;
        post: (
          scope: import("../../core/scope/scope.js").Scope,
          selectElement: HTMLSelectElement,
          attr: import("../../core/compile/attributes.js").Attributes,
          ctrls: any,
        ) => void;
      };
    })
)[];
