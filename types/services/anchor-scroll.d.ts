export function AnchorScrollProvider(): void;
export class AnchorScrollProvider {
    disableAutoScrolling: () => void;
    $get: (string | (($location: import("../core/location/location").Location, $rootScope: import("../core/scope/scope").Scope) => (hash: any) => void))[];
}
