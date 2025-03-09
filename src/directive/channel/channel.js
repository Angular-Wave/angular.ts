import { EventBus } from "../../core/pubsub/pubsub.js";
import { isObject } from "../../shared/utils.js";

/**
 * Dynamically updates an element's content based on events published on a specified channel.
 * If data is sent via `EventBus` on the specified `ngChannel`, the directive attempts to update the element's content accordingly,
 * either by directly setting the inner HTML or merging the scope's data if the element contains a template.
 *
 * If the element has a template (i.e., child nodes), the directive will use `scope.$merge` to update the scope,
 * allowing Angular expressions (`{{ yourModel }}`) to be evaluated and rendered.
 *
 * When the scope is destroyed, the directive automatically unsubscribes from the channel.
 *
 *
 * @returns {import("../../types.js").Directive}
 */
export function ngChannelDirective() {
  return {
    restrict: "EA",
    link: (scope, element, attrs) => {
      const hasTemplate = element.childNodes.length > 0;
      const channel = attrs["ngChannel"];

      const key = EventBus.subscribe(channel, async (val) => {
        if (!hasTemplate) {
          element.innerHTML = val;
        } else {
          if (isObject(val)) {
            scope.$merge(val);
          }
        }
      });

      scope.$on("$destroy", () => {
        EventBus.unsubscribeByKey(key);
      });
    },
  };
}
