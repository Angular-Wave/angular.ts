import { publishExternalAPI } from "../src/public";
import { createInjector } from "../src/injector";

describe("public", () => {
  beforeEach(() => {
    publishExternalAPI();
  });

  it("sets up the angular object and the module loader", () => {
    expect(window.angular).toBeDefined();
    expect(window.angular.module).toBeDefined();
  });

  it("sets up the ng module", () => {
    expect(createInjector(["ng"])).toBeDefined();
  });

  it("sets up the $filter service", () => {
    const injector = createInjector(["ng"]);
    expect(injector.has("$filter")).toBe(true);
  });

  it("sets up the $parse service", () => {
    publishExternalAPI();
    const injector = createInjector(["ng"]);
    expect(injector.has("$parse")).toBe(true);
  });

  it("sets up the $rootScope", () => {
    publishExternalAPI();
    const injector = createInjector(["ng"]);
    expect(injector.has("$rootScope")).toBe(true);
  });
});
