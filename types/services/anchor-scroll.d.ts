export function AnchorScrollProvider(): void;
export class AnchorScrollProvider {
    disableAutoScrolling: () => void;
    $get: (string | (($location: any, $rootScope: import("../core/scope/scope").Scope) => (hash: any) => void))[];
}
