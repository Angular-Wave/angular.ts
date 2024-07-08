export const ngOptionsDirective: (
  | string
  | ((
      $compile: any,
      $document: any,
      $parse: any,
    ) => {
      restrict: string;
      terminal: boolean;
      require: string[];
      link: {
        pre: (scope: any, selectElement: any, attr: any, ctrls: any) => void;
        post: (scope: any, selectElement: any, attr: any, ctrls: any) => void;
      };
    })
)[];
