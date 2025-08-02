import { Angular } from "../../angular.js";
import { createInjector } from "../di/injector.js";

describe("filter", function () {
  beforeEach(() => {
    window.angular = new Angular();
  });
  it("can be registered and obtained", () => {
    const myFilter = () => {};
    const myFilterFactory = () => {
      return myFilter;
    };
    const injector = createInjector([
      "ng",
      function ($filterProvider) {
        $filterProvider.register("my", myFilterFactory);
      },
    ]);
    const $filter = injector.get("$filter");
    expect($filter("my")).toBe(myFilter);
  });

  it("allows registering multiple filters with an object", () => {
    const myFilter = () => {};
    const myOtherFilter = () => {};
    const injector = createInjector([
      "ng",
      function ($filterProvider) {
        $filterProvider.register({
          my: () => {
            return myFilter;
          },
          myOther: () => {
            return myOtherFilter;
          },
        });
      },
    ]);
    const $filter = injector.get("$filter");
    expect($filter("my")).toBe(myFilter);
    expect($filter("myOther")).toBe(myOtherFilter);
  });

  it("is available through injector", () => {
    const myFilter = () => {};
    const injector = createInjector([
      "ng",
      function ($filterProvider) {
        $filterProvider.register("my", () => {
          return myFilter;
        });
      },
    ]);
    expect(injector.has("myFilter")).toBe(true);
    expect(injector.get("myFilter")).toBe(myFilter);
  });

  it("may have dependencies in factory", () => {
    const injector = createInjector([
      "ng",
      function ($provide, $filterProvider) {
        $provide.constant("suffix", "!");
        $filterProvider.register("my", function (suffix) {
          return function (v) {
            return suffix + v;
          };
        });
      },
    ]);
    expect(injector.has("myFilter")).toBe(true);
  });

  it("can be registered through module API", () => {
    const myFilter = () => {};
    angular.module("myModule", []).filter("my", () => {
      return myFilter;
    });
    const injector = createInjector(["ng", "myModule"]);
    expect(injector.has("myFilter")).toBe(true);
    expect(injector.get("myFilter")).toBe(myFilter);
  });
});

describe("filter filter", function () {
  beforeEach(function () {
    window.angular = new Angular();
  });
  it("is available", function () {
    const injector = createInjector(["ng"]);
    expect(injector.has("filterFilter")).toBe(true);
  });
  // TODO
});

describe("$filter", () => {
  let $filterProvider;
  let $filter;

  beforeEach(() => {
    window.angular = new Angular();
    const injector = createInjector([
      "ng",
      function (_$filterProvider_) {
        $filterProvider = _$filterProvider_;
      },
    ]);
    $filter = injector.get("$filter");
  });

  describe("provider", () => {
    it("should allow registration of filters", () => {
      const FooFilter = function () {
        return function () {
          return "foo";
        };
      };

      $filterProvider.register("foo", FooFilter);

      const fooFilter = $filter("foo");
      expect(fooFilter()).toBe("foo");
    });

    it("should allow registration of a map of filters", () => {
      const FooFilter = function () {
        return function () {
          return "foo";
        };
      };

      const BarFilter = function () {
        return function () {
          return "bar";
        };
      };

      $filterProvider.register({
        foo: FooFilter,
        bar: BarFilter,
      });

      const fooFilter = $filter("foo");
      expect(fooFilter()).toBe("foo");

      const barFilter = $filter("bar");
      expect(barFilter()).toBe("bar");
    });
  });
});
