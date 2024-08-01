import { Angular } from "../../loader";
import { createInjector } from "../../injector";

describe("filter", function () {
  beforeEach(() => {
    window.angular = new Angular();
  });
  it("can be registered and obtained", () => {
    var myFilter = () => {};
    var myFilterFactory = () => {
      return myFilter;
    };
    var injector = createInjector([
      "ng",
      function ($filterProvider) {
        $filterProvider.register("my", myFilterFactory);
      },
    ]);
    var $filter = injector.get("$filter");
    expect($filter("my")).toBe(myFilter);
  });

  it("allows registering multiple filters with an object", () => {
    var myFilter = () => {};
    var myOtherFilter = () => {};
    var injector = createInjector([
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
    var $filter = injector.get("$filter");
    expect($filter("my")).toBe(myFilter);
    expect($filter("myOther")).toBe(myOtherFilter);
  });

  it("is available through injector", () => {
    var myFilter = () => {};
    var injector = createInjector([
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
    var injector = createInjector([
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
    var myFilter = () => {};
    angular.module("myModule", []).filter("my", () => {
      return myFilter;
    });
    var injector = createInjector(["ng", "myModule"]);
    expect(injector.has("myFilter")).toBe(true);
    expect(injector.get("myFilter")).toBe(myFilter);
  });
});

describe("filter filter", function () {
  beforeEach(function () {
    window.angular = new Angular();
  });
  it("is available", function () {
    var injector = createInjector(["ng"]);
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
