export function $ViewScrollProvider(): void;
export class $ViewScrollProvider {
    useAnchorScroll: () => void;
    $get: (string | (($anchorScroll: any, $timeout: any) => any))[];
}
