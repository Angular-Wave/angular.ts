import { Angular } from "../../loader.js";
import { browserTrigger, wait } from "../../shared/test-utils.js";

describe("ngGet", () => {
  let $compile, $rootScope, $log, el;

  beforeEach(() => {
    el = document.getElementById("app");
    el.innerHTML = "";
    let angular = new Angular();
    angular.module("default", []);
    angular
      .bootstrap(el, ["default"])
      .invoke((_$compile_, _$rootScope_, _$log_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $log = _$log_;
      });
  });

  it("should replace innerHTML (default) on click", async () => {
    const scope = $rootScope.$new();
    el.innerHTML = '<button ng-get="/mock/hello">Load</button>';
    $compile(el)(scope);
    browserTrigger(el.querySelector("button"), "click");
    await wait(100);
    expect(el.innerText).toBe("Hello");
  });

  it("should replace innerHTML (default) on click when used with expression", async () => {
    const scope = $rootScope.$new();
    el.innerHTML = '<button ng-get="/mock/{{a}}">Load</button>';
    scope.a = "div";
    $compile(el)(scope);
    browserTrigger(el.querySelector("button"), "click");
    await wait(100);
    expect(el.firstChild.innerHTML).toBe("<div>Hello</div>");
  });

  it("should replace innerHTML on error", async () => {
    const scope = $rootScope.$new();
    el.innerHTML = '<button ng-get="/mock/422">Load</button>';
    $compile(el)(scope);
    browserTrigger(el.querySelector("button"), "click");
    await wait(100);
    expect(el.innerText).toBe("Invalid data");
  });

  it("should not trigger request if element is disabled", async () => {
    el.innerHTML = '<button ng-get="/mock/hello" disabled>Load</button>';
    const scope = $rootScope.$new();
    $compile(el)(scope);
    browserTrigger(el.querySelector("button"), "click");
    await wait(100);
    expect(el.innerText).toBe("Load");
  });

  it("should replace innerHTML on statuc error without a body", async () => {
    const scope = $rootScope.$new();
    el.innerHTML = '<button ng-get="/mock/401">Load</button>';
    $compile(el)(scope);
    browserTrigger(el.querySelector("button"), "click");
    await wait(100);
    expect(el.innerText).toBe("Unauthorized");
  });

  describe("data-swap", () => {
    it("should replace outerHTML on click", async () => {
      const scope = $rootScope.$new();
      el.innerHTML =
        '<button ng-get="/mock/hello" data-swap="outerHTML">Load</button>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      expect(el.innerText).toBe("Hello");
    });

    it("should replace textcontent on click", async () => {
      const scope = $rootScope.$new();
      el.innerHTML =
        '<button ng-get="/mock/hello" data-swap="textContent">Load</button>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      expect(el.innerText).toBe("Hello");
    });

    it("should replace beforebegin on click", async () => {
      const scope = $rootScope.$new();
      el.innerHTML =
        '<button ng-get="/mock/div" data-swap="beforebegin">Load</button>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      expect(el.firstChild.innerText).toBe("Hello");
    });

    it("should replace beforeend on click", async () => {
      const scope = $rootScope.$new();
      el.innerHTML =
        '<button ng-get="/mock/div" data-swap="beforeend">Load</button>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      expect(el.firstChild.lastChild.innerText).toBe("Hello");
    });
  });

  describe("data-target", () => {
    it("should remain unchanged if target is not found and log a warning", async () => {
      const scope = $rootScope.$new();
      spyOn($log, "warn");
      el.innerHTML =
        '<button ng-get="/mock/hello" data-target="#missing">Load</button>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      expect(el.firstChild.innerText).toBe("Load");
      expect($log.warn).toHaveBeenCalled();
    });

    it("should replace target innerHTML (default) on click", async () => {
      const scope = $rootScope.$new();
      el.innerHTML =
        '<button ng-get="/mock/hello" data-target="#found">Load</button><div id="found"></div>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      expect(el.lastChild.innerHTML).toBe("Hello");
    });

    it("should replace textcontent on click", async () => {
      const scope = $rootScope.$new();
      el.innerHTML =
        '<button ng-get="/mock/hello" data-swap="textContent" data-target="#found">Load</button><div id="found"></div>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      expect(el.lastChild.innerText).toBe("Hello");
    });

    it("should replace beforebegin on click", async () => {
      const scope = $rootScope.$new();
      el.innerHTML =
        '<button ng-get="/mock/div" data-swap="beforebegin" data-target="#found">Load</button><div id="found"></div>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      const found = el.querySelector("#found");
      // The sibling before #found should contain "Hello"
      const prevSibling = found.previousSibling;
      expect(prevSibling.textContent).toBe("Hello");
      expect(found.textContent).toBe(""); // found itself unchanged
    });

    it("should replace beforeend on click", async () => {
      const scope = $rootScope.$new();
      el.innerHTML =
        '<button ng-get="/mock/div" data-swap="beforeend" data-target="#found">Load</button><div id="found"></div>';
      $compile(el)(scope);
      browserTrigger(el.querySelector("button"), "click");
      await wait(100);
      const found = el.querySelector("#found");
      expect(found.textContent).toBe("Hello");
    });
  });
});
