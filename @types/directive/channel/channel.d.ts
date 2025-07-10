/**
 * @param {import("../../services/pubsub/pubsub.js").PubSub} $eventBus
 * @returns {import("../../interface.ts").Directive}
 */
export function ngChannelDirective(
  $eventBus: import("../../services/pubsub/pubsub.js").PubSub,
): import("../../interface.ts").Directive;
export namespace ngChannelDirective {
  let $inject: string[];
}
