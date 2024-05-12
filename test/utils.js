import { jqLite } from "../src/jqLite";

export function browserTrigger(element, event) {
  jqLite(element)[0].dispatchEvent(
    new Event(event, { bubbles: true, cancelable: true }),
  );
}

export function wait(t) {
  return new Promise((resolve, _) => setTimeout(resolve, t));
}
