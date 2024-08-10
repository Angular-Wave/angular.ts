import { Angular } from "./loader";
import { createInjector } from "./core/di/injector";

describe("module loader", () => {
  let angular;
  beforeEach(() => {
    angular = window.angular = new Angular();
  });

  it("allows registering a module", () => {
    const myModule = angular.module("myModule", []);
    expect(myModule).toBeDefined();
    expect(myModule.name).toEqual("myModule");
  });

  it("allows getting a module", () => {
    const myModule = angular.module("myModule", []);
    const gotModule = angular.module("myModule");
    expect(gotModule).toBeDefined();
    expect(gotModule).toBe(myModule);
  });

  it("throws when trying to get a nonexistent module", () => {
    expect(() => {
      angular.module("nonexistent");
    }).toThrow();
  });

  it("does not allow a module to be called hasOwnProperty", () => {
    expect(() => {
      angular.module("hasOwnProperty", []);
    }).toThrow();
  });

  it("attaches the requires array to the registered module", () => {
    const myModule = angular.module("myModule", ["myOtherModule"]);
    expect(myModule.requires).toEqual(["myOtherModule"]);
  });

  it("replaces a module when registered with same name again", () => {
    const myModule = angular.module("myModule", []);
    const myNewModule = angular.module("myModule", []);
    expect(myNewModule).not.toBe(myModule);
  });

  it("should record calls", () => {
    const otherModule = angular.module("other", []);
    otherModule.config("otherInit");

    const myModule = angular.module("my", ["other"], "config");

    expect(
      myModule
        .decorator("dk", "dv")
        .provider("sk", "sv")
        .factory("fk", "fv")
        .service("a", "aa")
        .value("k", "v")
        .filter("f", "ff")
        .directive("d", "dd")
        .component("c", "cc")
        .controller("ctrl", "ccc")
        .config("init2")
        .constant("abc", 123)
        .run("runBlock"),
    ).toBe(myModule);

    expect(myModule.requires).toEqual(["other"]);
    expect(myModule.invokeQueue).toEqual([
      ["$provide", "constant", jasmine.objectContaining(["abc", 123])],
      ["$provide", "provider", jasmine.objectContaining(["sk", "sv"])],
      ["$provide", "factory", jasmine.objectContaining(["fk", "fv"])],
      ["$provide", "service", jasmine.objectContaining(["a", "aa"])],
      ["$provide", "value", jasmine.objectContaining(["k", "v"])],
      ["$filterProvider", "register", jasmine.objectContaining(["f", "ff"])],
      ["$compileProvider", "directive", jasmine.objectContaining(["d", "dd"])],
      ["$compileProvider", "component", jasmine.objectContaining(["c", "cc"])],
      [
        "$controllerProvider",
        "register",
        jasmine.objectContaining(["ctrl", "ccc"]),
      ],
    ]);
    expect(myModule.configBlocks).toEqual([
      ["$injector", "invoke", jasmine.objectContaining(["config"])],
      ["$provide", "decorator", jasmine.objectContaining(["dk", "dv"])],
      ["$injector", "invoke", jasmine.objectContaining(["init2"])],
    ]);
    expect(myModule.runBlocks).toEqual(["runBlock"]);
  });

  it("should not throw error when `module.decorator` is declared before provider that it decorates", () => {
    angular
      .module("theModule", [])
      .decorator("theProvider", ($delegate) => $delegate)
      .factory("theProvider", () => ({}));

    expect(() => {
      createInjector(["theModule"]);
    }).not.toThrow();
  });

  it("should run decorators in order of declaration, even when mixed with provider.decorator", () => {
    let log = "";

    angular
      .module("theModule", [])
      .factory("theProvider", () => ({ api: "provider" }))
      .decorator("theProvider", ($delegate) => {
        $delegate.api += "-first";
        return $delegate;
      })
      .config(($provide) => {
        $provide.decorator("theProvider", ($delegate) => {
          $delegate.api += "-second";
          return $delegate;
        });
      })
      .decorator("theProvider", ($delegate) => {
        $delegate.api += "-third";
        return $delegate;
      })
      .run((theProvider) => {
        log = theProvider.api;
      });

    createInjector(["theModule"]);
    expect(log).toBe("provider-first-second-third");
  });

  it("should decorate the last declared provider if multiple have been declared", () => {
    let log = "";

    angular
      .module("theModule", [])
      .factory("theProvider", () => ({
        api: "firstProvider",
      }))
      .decorator("theProvider", ($delegate) => {
        $delegate.api += "-decorator";
        return $delegate;
      })
      .factory("theProvider", () => ({
        api: "secondProvider",
      }))
      .run((theProvider) => {
        log = theProvider.api;
      });

    createInjector(["theModule"]);
    expect(log).toBe("secondProvider-decorator");
  });

  it("should allow module redefinition", () => {
    expect(angular.module("a", [])).not.toBe(angular.module("a", []));
  });

  it("should complain of no module", () => {
    expect(() => {
      angular.module("dontExist");
    }).toThrow();
  });

  it('should complain if a module is called "hasOwnProperty', () => {
    expect(() => {
      angular.module("hasOwnProperty", []);
    }).toThrow();
  });

  describe("Module", () => {
    describe("info()", () => {
      let theModule;

      beforeEach(() => {
        theModule = angular.module("theModule", []);
      });

      it("should default to an empty object", () => {
        expect(theModule.info()).toEqual({});
      });

      it("should store the object passed as a param", () => {
        theModule.info({ version: "1.2" });
        expect(theModule.info()).toEqual({ version: "1.2" });
      });

      it("should throw if the parameter is not an object", () => {
        expect(() => {
          theModule.info("some text");
        }).toThrow();
      });

      it("should completely replace the previous info object", () => {
        theModule.info({ value: "X" });
        theModule.info({ newValue: "Y" });
        expect(theModule.info()).toEqual({ newValue: "Y" });
      });
    });
  });
});
