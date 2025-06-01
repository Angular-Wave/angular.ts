import { createInjector } from "./core/di/injector.js";
import { Angular } from "./loader.js";

describe("public", () => {
  beforeEach(() => {
    window.angular = new Angular();
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
    const injector = createInjector(["ng"]);
    expect(injector.has("$parse")).toBe(true);
  });

  it("sets up the $rootScope", () => {
    const injector = createInjector(["ng"]);
    expect(injector.has("$rootScope")).toBe(true);
  });
});
