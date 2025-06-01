import { isObject } from "../../shared/utils.js";
import { filterFilter } from "../../filters/filter.js";
import { jsonFilter } from "../../filters/filters.js";
import { limitToFilter } from "../../filters/limit-to.js";
import { orderByFilter } from "../../filters/order-by.js";
import {
  $IncludedByStateFilter,
  $IsStateFilter,
} from "../../router/state-filters";

FilterProvider.$inject = ["$provide"];
export function FilterProvider($provide) {
  const suffix = "Filter";

  function register(name, factory) {
    if (isObject(name)) {
      const filters = {};
      Object.entries(name).forEach(([key, filter]) => {
        filters[key] = register(key, filter);
      });
      return filters;
    }
    return $provide.factory(name + suffix, factory);
  }
  this.register = register;

  this.$get = [
    "$injector",
    /**
     *
     * @param {import("../../core/di/internal-injector").InjectorService} $injector
     * @returns
     */
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
  register("isState", $IsStateFilter);
  register("includedByState", $IncludedByStateFilter);
}
