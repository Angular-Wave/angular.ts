import { Angular } from "../../loader.js";
import { browserTrigger, wait } from "../../shared/test-utils.js";

describe("ngGet", () => {
  let $compile, $rootScope, $httpBackend, el;

  beforeEach(() => {
    el = document.getElementById("app");
    el.innerHTML = "";
    let angular = new Angular();
    angular.module("default", []);
    angular
      .bootstrap(el, ["default"])
      .invoke((_$compile_, _$rootScope_, _$httpBackend_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
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
      '<button ng-get="/mock/hello" data-swap="textcontent">Load</button>';
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
