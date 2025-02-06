import { Angular } from "../loader";
import { createInjector } from "../core/di/injector";
import { toJson } from "../shared/utils.js";

describe("filters", () => {
  let filter;

  beforeEach(() => {
    window.angular = new Angular();
    window.angular.module("myModule", ["ng"]);
    const injector = createInjector(["myModule"]);
    filter = injector.get("$filter");
  });

  it("should call the filter when evaluating expression", () => {
    const filter = jasmine.createSpy("myFilter");
    createInjector([
      "ng",
      function ($filterProvider) {
        $filterProvider.register("myFilter", () => filter);
      },
    ]).invoke(($rootScope) => {
      $rootScope.$eval("10|myFilter");
    });
    expect(filter).toHaveBeenCalledWith(10);
  });

  describe("json", () => {
    it("should do basic filter", () => {
      expect(filter("json")({ a: "b" })).toEqual(toJson({ a: "b" }, true));
    });
    it("should allow custom indentation", () => {
      expect(filter("json")({ a: "b" }, 4)).toEqual(toJson({ a: "b" }, 4));
    });
  });
});
