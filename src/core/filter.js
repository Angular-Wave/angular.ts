import { forEach, isObject } from "../shared/utils";
import { filterFilter } from "../filters/filter";
import { jsonFilter } from "../filters/filters";
import { limitToFilter } from "../filters/limit-to";
import { orderByFilter } from "../filters/order-by";

$FilterProvider.$inject = ["$provide"];
export function $FilterProvider($provide) {
  const suffix = "Filter";

  function register(name, factory) {
    if (isObject(name)) {
      const filters = {};
      forEach(name, (filter, key) => {
        filters[key] = register(key, filter);
      });
      return filters;
    }
    return $provide.factory(name + suffix, factory);
  }
  this.register = register;

  this.$get = [
    "$injector",
    function ($injector) {
      return function (name) {
        return $injector.get(name + suffix);
      };
    },
  ];

  register("filter", filterFilter);
  register("json", jsonFilter);
  register("limitTo", limitToFilter);
  register("orderBy", orderByFilter);
}
