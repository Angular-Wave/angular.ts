export const ngTranscludeDirective: (
  | string
  | ((
      $compile: import("../../core/compile/compile.js").CompileFn,
    ) => import("../../interface.ts").Directive)
)[];
