/**
 * @typedef {Object} AnchorScrollObject
 * @property {number|function|import("../shared/jqlite/jqlite").JQLite} yOffset
 */
/**
 * @typedef {(string) => void} AnchorScrollFunction
 */
/**
 * @typedef {AnchorScrollFunction | AnchorScrollObject} AnchorScrollService
 */
export function AnchorScrollProvider(): void;
export class AnchorScrollProvider {
    disableAutoScrolling: () => void;
    $get: (string | (($location: import("../core/location/location").Location, $rootScope: import("../core/scope/scope").Scope) => AnchorScrollFunction))[];
}
export type AnchorScrollObject = {
    yOffset: number | Function | import("../shared/jqlite/jqlite").JQLite;
};
export type AnchorScrollFunction = (string: any) => void;
export type AnchorScrollService = AnchorScrollFunction | AnchorScrollObject;
