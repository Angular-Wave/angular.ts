/**
 * Dynamically updates an element's content based on events published on a specified channel.
 * If data is sent via `EventBus` on the specified `ngChannel`, the directive attempts to update the element's content accordingly,
 * either by directly setting the inner HTML or merging the scope's data if the element contains a template.
 *
 * If the element has a template and incoming data is an object, the directive will merge all key/value pairs onto the scope,
 * allowing Angular expressions (`{{ yourModel }}`) to be evaluated and rendered.
 *
 * When the scope is destroyed, the directive automatically unsubscribes from the channel.
 * Example:
 *
 * HTML:
 * <div ng-channel="userChannel">Hello {{ user.firstName }} {{ user.lastName }}</div>
 *
 * JavaScript:
 * angular.EventBus.publish('userChannel', { user: { firstName: 'John', lastName: 'Smith' } });
 *
 * @returns {import("../../interface.ts").Directive}
 */
export function ngChannelDirective(): import("../../interface.ts").Directive;
