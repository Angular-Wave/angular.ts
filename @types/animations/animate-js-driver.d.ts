export function AnimateJsDriverProvider($$animationProvider: any): void;
export class AnimateJsDriverProvider {
  constructor($$animationProvider: any);
  $get: (
    | string
    | ((
        $$animateJs: any,
        $$AnimateRunner: any,
      ) => (animationDetails: any) => any)
  )[];
}
export namespace AnimateJsDriverProvider {
  let $inject: string[];
}
