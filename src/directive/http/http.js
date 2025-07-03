import { createHttpDirective } from "./utils.js";

/**
 * @param {"get" | "delete" | "post" | "put"} method
 * @returns {import('../../interface.ts').DirectiveFactory}
 */
function defineDirective(method) {
  const attrName = "ng" + method.charAt(0).toUpperCase() + method.slice(1);
  const directive = createHttpDirective(method, attrName);
  directive["$inject"] = ["$http", "$compile", "$log"];
  return directive;
}

export const ngGetDirective = defineDirective("get");
export const ngDeleteDirective = defineDirective("delete");
export const ngPostDirective = defineDirective("post");
export const ngPutDirective = defineDirective("put");
