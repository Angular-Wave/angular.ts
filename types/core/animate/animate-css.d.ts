/**
 * @ngdoc service
 * @name $animateCss
 * @kind object
 *
 *
 * @description
 * This is the core version of `$animateCss`. By default, only when the `ngAnimate` is included,
 * then the `$animateCss` service will actually perform animations.
 *
 * Click here {@link ngAnimate.$animateCss to read the documentation for $animateCss}.
 */
export function CoreAnimateCssProvider(): void;
export class CoreAnimateCssProvider {
    $get: (string | (($$AnimateRunner: any) => (element: import("../../shared/jqlite/jqlite").JQLite, initialOptions: any) => {
        start: () => any;
        end: () => any;
    }))[];
}
