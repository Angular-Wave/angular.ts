import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";
import { jqLite } from "../../jqLite";

describe("$document", () => {
  let $document, $httpBackend, $http, $$isDocumentHidden;

  beforeEach(() => {
    publishExternalAPI();
    var injector = createInjector(["ng"]);
    $document = injector.get("$document");
    $httpBackend = injector.get("$httpBackend");
    $http = injector.get("$http");
    $$isDocumentHidden = injector.get("$$isDocumentHidden");
  });

  it("should inject $document", () => {
    expect($document).toEqual(jqLite(window.document));
  });
});

describe("$$isDocumentHidden", () => {
  let $rootScope;

  beforeEach(() => {
    publishExternalAPI();
    var injector = createInjector(["ng"]);
    $rootScope = injector.get("$rootScope");
  });

  it("should listen on the visibilitychange event", () => {
    let doc;

    const spy = spyOn(window.document, "addEventListener").and.callThrough();

    () => {
      expect(spy.calls.mostRecent().args[0]).toBe("visibilitychange");
      expect(spy.calls.mostRecent().args[1]).toEqual(jasmine.any(Function));
      expect($$isDocumentHidden()).toBeFalsy(); // undefined in browsers that don't support visibility
    };
  });

  it("should remove the listener when the $rootScope is destroyed", () => {
    const spy = spyOn(window.document, "removeEventListener").and.callThrough();

    () => {
      $rootScope.$destroy();
      expect(spy.calls.mostRecent().args[0]).toBe("visibilitychange");
      expect(spy.calls.mostRecent().args[1]).toEqual(jasmine.any(Function));
    };
  });
});
