import { Angular } from "./loader.js";
import { onReady } from "./shared/dom.js";

export const angular = new Angular();
onReady(() => angular.init(document));
