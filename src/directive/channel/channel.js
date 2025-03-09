import { EventBus } from "../../core/pubsub/pubsub.js";
import { isObject } from "../../shared/utils.js";

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
 * @returns {import("../../types.js").Directive}
 */
export function ngChannelDirective() {
  return {
    restrict: "EA",
    link: (scope, element, attrs) => {
      const hasTemplate = element[0].childNodes.length > 0;
      const channel = attrs["ngChannel"];

      const key = EventBus.subscribe(channel, async (val) => {
        if (!hasTemplate) {
          element[0].innerHTML = val;
        } else {
          if (isObject(val)) {
            Object.entries(val).forEach(([key, value]) => {
              scope[key] = value;
            });
          }
        }
      });

      scope.$on("$destroy", () => {
        EventBus.unsubscribeByKey(key);
      });
    },
  };
}
