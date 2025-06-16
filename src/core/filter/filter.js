import { isObject } from "../../shared/utils.js";
import { filterFilter } from "../../filters/filter.js";
import { jsonFilter } from "../../filters/filters.js";
import { limitToFilter } from "../../filters/limit-to.js";
import { orderByFilter } from "../../filters/order-by.js";
import {
  $IncludedByStateFilter,
  $IsStateFilter,
} from "../../router/state-filters.js";

FilterProvider.$inject = ["$provide"];

/**
 * @param {import('../../interface.ts').Provider} $provide
 */
export function FilterProvider($provide) {
  const suffix = "Filter";

  /**
   * @param {string|Record<string, import('../../interface.ts').FilterFactory>} name
   * @param {import('../../interface.ts').FilterFactory} factory
   * @return {import('../../interface.ts').ServiceProvider}
   */
  function register(name, factory) {
    if (isObject(name)) {
      const filters = {};
      Object.entries(name).forEach(([key, filter]) => {
        filters[key] = register(key, filter);
      });
    }
    return $provide.factory(name + suffix, factory);
  }

  this.register = register;

  this.$get = [
    "$injector",
    /**
     *
     * @param {import("../../core/di/internal-injector.js").InjectorService} $injector
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
