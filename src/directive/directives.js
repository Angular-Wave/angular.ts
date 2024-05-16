import { isFunction, valueFn } from "../core/utils";

export function ngDirective(directive) {
  if (isFunction(directive)) {
    directive = {
      link: directive,
    };
  }
  directive.restrict = directive.restrict || "AC";
  return valueFn(directive);
}
