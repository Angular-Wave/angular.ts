import { publishExternalAPI } from "../../src/public";
import { createInjector } from "../../src/injector";
import { jqLite } from "../../src/jqLite";

describe("$$forceReflow", () => {
  let $injector, $$forceReflow;
  beforeEach(() => {
    publishExternalAPI();
    $injector = createInjector([
      "ng",
      ($provide) => {
        const doc = jqLite("<div></div>");
        doc[0].body = {};
        doc[0].body.offsetWidth = 10;
        $provide.value("$document", doc);
      },
    ]);
    $$forceReflow = $injector.get("$$forceReflow");
  });

  it("should issue a reflow by touching the `document.body.client` when no param is provided", () => {
    $injector.invoke(($$forceReflow) => {
      const value = $$forceReflow();
      expect(value).toBe(11);
    });
  });

  it("should issue a reflow by touching the `domNode.offsetWidth` when a domNode param is provided", () => {
    const elm = {};
    elm.offsetWidth = 100;
    expect($$forceReflow(elm)).toBe(101);
  });

  it("should issue a reflow by touching the `jqLiteNode[0].offsetWidth` when a jqLite node param is provided", () => {
    let elm = {};
    elm.offsetWidth = 200;
    elm = jqLite(elm);
    expect($$forceReflow(elm)).toBe(201);
  });
});
