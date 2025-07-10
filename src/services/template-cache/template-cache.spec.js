import { Angular } from "../../loader.js";
import { dealoc } from "../../shared/dom.js";
import { wait } from "../../shared/test-utils.js";

describe("$templateCache", () => {
  let templateCache, templateCacheProvider, el, $compile, $scope;

  beforeEach(() => {
    el = document.getElementById("app");
    el.innerHTML = "";
    let angular = new Angular();
    angular.module("default", []).config(($templateCacheProvider) => {
      templateCacheProvider = $templateCacheProvider;
      templateCacheProvider.cache.set("test", "hello");
    });
    angular
      .bootstrap(el, ["default"])
      .invoke((_$templateCache_, _$compile_, _$rootScope_) => {
        templateCache = _$templateCache_;
        $compile = _$compile_;
        $scope = _$rootScope_;
      });
  });

  afterEach(() => {
    dealoc(el);
  });

  it("should be available as provider", () => {
    expect(templateCacheProvider).toBeDefined();
  });

  it("should be available as a service", () => {
    expect(templateCache).toBeDefined();
    expect(templateCache).toEqual(templateCacheProvider.cache);
    expect(templateCache instanceof Map).toBeTrue();
    expect(templateCache.get("test")).toEqual("hello");
  });

  it("should can be accessed via `ng-include`", async () => {
    el.innerHTML = `
        <div ng-include="'test'">test</div>
    `;
    expect(el.innerText).toEqual("test");
    $compile(el)($scope);
    await wait();
    expect(el.innerText).toEqual("hello");
  });

  it("can be leader via `text/ng-template`", async () => {
    el.innerHTML = `
      <script type="text/ng-template" id="templateId.html">
        <p>This is the content of the template</p>
      </script>
    `;
    $compile(el)($scope);
    await wait();
    expect(templateCache.get("templateId.html").trim()).toEqual(
      "<p>This is the content of the template</p>",
    );
  });
});
