import { dealoc } from "../../src/jqLite";
import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";
import { wait } from "../test-utils";

describe("uiView", () => {
  describe("scrollIntoView", () => {
    let elem, $anchorScroll, $uiViewScroll, $timeout;

    beforeEach(() => {
      dealoc(document.getElementById("dummy"));
      window.angular = new Angular();
      publishExternalAPI();
      window.angular.module("defaultModule", ["ui.router"]);
      let $injector = window.angular.bootstrap(
        document.getElementById("dummy"),
        ["defaultModule"],
      );

      $injector.invoke((_$uiViewScroll_, _$timeout_, _$anchorScroll_) => {
        $anchorScroll = _$anchorScroll_;
        $uiViewScroll = _$uiViewScroll_;
        $timeout = _$timeout_;
      });
      elem = [{ scrollIntoView: jasmine.createSpy("scrollIntoView") }];
    });

    it("should scroll element into view after timeout", async () => {
      $uiViewScroll(elem);
      expect(elem[0].scrollIntoView).not.toHaveBeenCalled();

      await wait(100);
      expect(elem[0].scrollIntoView).toHaveBeenCalled();
    });

    it("should return the promise from the timeout", async () => {
      const promise = $uiViewScroll(elem);

      await wait(100);
      expect(elem[0].scrollIntoView).toHaveBeenCalled();
      expect(promise).toBeDefined();
    });
  });

  describe("useAnchorScroll", () => {
    let elem, $anchorScroll, $uiViewScroll;

    beforeEach(() => {
      dealoc(document.getElementById("dummy"));
      window.angular = new Angular();
      publishExternalAPI();
      let module = window.angular.module("defaultModule", ["ui.router"]);
      module.config(($provide, $uiViewScrollProvider) => {
        $provide.decorator("$anchorScroll", function ($delegate) {
          return jasmine.createSpy("$anchorScroll");
        });
        $uiViewScrollProvider.useAnchorScroll();
      });

      let $injector = window.angular.bootstrap(
        document.getElementById("dummy"),
        ["defaultModule"],
      );

      $injector.invoke((_$uiViewScroll_, _$anchorScroll_) => {
        $anchorScroll = _$anchorScroll_;
        $uiViewScroll = _$uiViewScroll_;
      });
      elem = [{ scrollIntoView: jasmine.createSpy("scrollIntoView") }];
    });

    it("should call $anchorScroll", () => {
      $uiViewScroll();
      expect($anchorScroll).toHaveBeenCalled();
    });
  });
});
