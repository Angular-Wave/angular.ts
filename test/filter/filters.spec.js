import { publishExternalAPI } from "../../src/public";
import { createInjector } from "../../src/injector";
import { toJson } from "../../src/shared/utils";

describe("filters", () => {
  let filter;

  beforeEach(() => {
    publishExternalAPI();
    var injector = createInjector(["ng"]);
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
