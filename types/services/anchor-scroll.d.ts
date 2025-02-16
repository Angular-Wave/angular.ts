/**
 * @typedef {Object} AnchorScrollObject
 * @property {number|function|import("../shared/dom.js").JQLite} yOffset
 */
/**
 * @typedef {(string) => void} AnchorScrollFunction
 */
/**
 * @typedef {AnchorScrollFunction | AnchorScrollObject} AnchorScrollService
 */
export class AnchorScrollProvider {
    autoScrollingEnabled: boolean;
    disableAutoScrolling(): void;
    $get: (string | (($location: import("../core/location/location").Location, $rootScope: import("../core/scope/scope.js").Scope) => AnchorScrollFunction))[];
}
export type AnchorScrollObject = {
    yOffset: number | Function | import("../shared/dom.js").JQLite;
};
export type AnchorScrollFunction = (string: any) => void;
export type AnchorScrollService = AnchorScrollFunction | AnchorScrollObject;
