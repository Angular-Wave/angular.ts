export class ViewScrollProvider {
  enabled: boolean;
  useAnchorScroll(): void;
  $get: (
    | string
    | ((
        $anchorScroll: import("../services/anchor-scroll.js").AnchorScrollObject,
      ) => import("../services/anchor-scroll.js").AnchorScrollObject | Function)
  )[];
}
