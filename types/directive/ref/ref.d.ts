export const ngRefDirective: (
  | string
  | (($parse: any) => {
      priority: number;
      restrict: string;
      compile(
        tElement: any,
        tAttrs: any,
      ): (scope: any, element: any, attrs: any) => void;
    })
)[];
