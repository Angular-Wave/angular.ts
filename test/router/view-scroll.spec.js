import { dealoc, jqLite } from "../../src/jqLite";
import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";
import { wait } from "../test-utils";

describe("ngView", () => {
  describe("scrollIntoView", () => {
    let elem, $anchorScroll, $ngViewScroll, $timeout;

    beforeEach(() => {
      dealoc(document.getElementById("dummy"));
      window.angular = new Angular();
      publishExternalAPI();
      window.angular.module("defaultModule", ["ng.router"]);
      let $injector = window.angular.bootstrap(
        document.getElementById("dummy"),
        ["defaultModule"],
      );

      $injector.invoke((_$ngViewScroll_, _$timeout_, _$anchorScroll_) => {
        $anchorScroll = _$anchorScroll_;
        $ngViewScroll = _$ngViewScroll_;
        $timeout = _$timeout_;
      });
      elem = [{ scrollIntoView: jasmine.createSpy("scrollIntoView") }];
    });

    it("should scroll element into view after timeout", async () => {
      $ngViewScroll(elem);
      expect(elem[0].scrollIntoView).not.toHaveBeenCalled();

      await wait(100);
      expect(elem[0].scrollIntoView).toHaveBeenCalled();
    });

    it("should return the promise from the timeout", async () => {
      const promise = $ngViewScroll(elem);

      await wait(100);
      expect(elem[0].scrollIntoView).toHaveBeenCalled();
      expect(promise).toBeDefined();
    });
  });

  describe("useAnchorScroll", () => {
    let elem, $anchorScroll, $ngViewScroll;

    beforeEach(() => {
      dealoc(document.getElementById("dummy"));
      window.angular = new Angular();
      publishExternalAPI();
      let module = window.angular.module("defaultModule", ["ng.router"]);
      module.config(($provide, $ngViewScrollProvider) => {
        $provide.decorator("$anchorScroll", function ($delegate) {
          return jasmine.createSpy("$anchorScroll");
        });
        $ngViewScrollProvider.useAnchorScroll();
      });

      let $injector = window.angular.bootstrap(
        document.getElementById("dummy"),
        ["defaultModule"],
      );

      $injector.invoke((_$ngViewScroll_, _$anchorScroll_) => {
        $anchorScroll = _$anchorScroll_;
        $ngViewScroll = _$ngViewScroll_;
      });
      elem = [{ scrollIntoView: jasmine.createSpy("scrollIntoView") }];
    });

    it("should call $anchorScroll", () => {
      $ngViewScroll();
      expect($anchorScroll).toHaveBeenCalled();
    });
  });
});
