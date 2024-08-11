export function $ViewScrollProvider(): void;
export class $ViewScrollProvider {
    useAnchorScroll: () => void;
    $get: (string | (($anchorScroll: import("../services/anchor-scroll").AnchorScrollObject, $timeout: any) => import("../services/anchor-scroll").AnchorScrollObject | Function))[];
}
