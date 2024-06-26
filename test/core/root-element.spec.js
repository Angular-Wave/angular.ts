import { jqLite, dealoc } from "../../src/jqLite";
import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";

describe("$rootElement", () => {
  let angular = new Angular();
  publishExternalAPI();

  it("should publish the bootstrap element into $rootElement", () => {
    const element = jqLite("<div></div>");
    const injector = angular.bootstrap(element);

    expect(injector.get("$rootElement")[0]).toBe(element[0]);
    dealoc(element);
  });
});
