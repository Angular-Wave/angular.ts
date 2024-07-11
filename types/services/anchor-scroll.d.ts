export function AnchorScrollProvider(): void;
export class AnchorScrollProvider {
    disableAutoScrolling: () => void;
    $get: (string | (($location: angular.IRootScopeService, $rootScope: any) => (hash: any) => void))[];
}
