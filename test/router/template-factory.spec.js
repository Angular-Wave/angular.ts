describe("templateFactory", function () {
  beforeEach(module("ui.router"));

  it("exists", inject(function ($templateFactory) {
    expect($templateFactory).toBeDefined();
  }));

  if (angular.version.minor >= 3) {
    // Post 1.2, there is a $templateRequest and a $sce service
    describe("should follow $sce policy and", function () {
      it("accepts relative URLs", inject(function (
        $templateFactory,
        $httpBackend,
        $sce,
      ) {
        $httpBackend.expectGET("views/view.html").respond(200, "template!");
        $templateFactory.fromUrl("views/view.html");
        $httpBackend.flush();
      }));

      it("rejects untrusted URLs", inject(function (
        $templateFactory,
        $httpBackend,
        $sce,
      ) {
        let error = "No error thrown";
        try {
          $templateFactory.fromUrl("http://evil.com/views/view.html");
        } catch (e) {
          error = e.message;
        }
        expect(error).toMatch(/sce:insecurl/);
      }));

      it("accepts explicitly trusted URLs", inject(function (
        $templateFactory,
        $httpBackend,
        $sce,
      ) {
        $httpBackend
          .expectGET("http://evil.com/views/view.html")
          .respond(200, "template!");
        $templateFactory.fromUrl(
          $sce.trustAsResourceUrl("http://evil.com/views/view.html"),
        );
        $httpBackend.flush();
      }));
    });
  }

  describe("templateFactory with forced use of $http service", function () {
    beforeEach(function () {
      angular
        .module("forceHttpInTemplateFactory", [])
        .config(function ($templateFactoryProvider) {
          $templateFactoryProvider.useHttpService(true);
        });
      module("ui.router");
      module("forceHttpInTemplateFactory");
    });

    it("does not restrict URL loading", inject(function (
      $templateFactory,
      $httpBackend,
    ) {
      $httpBackend
        .expectGET("http://evil.com/views/view.html")
        .respond(200, "template!");
      $templateFactory.fromUrl("http://evil.com/views/view.html");
      $httpBackend.flush();

      $httpBackend.expectGET("data:text/html,foo").respond(200, "template!");
      $templateFactory.fromUrl("data:text/html,foo");
      $httpBackend.flush();
    }));
  });

  describe("component template builder", () => {
    let router, el, rootScope;
    const cmp = { template: "hi" };

    beforeEach(() => {
      const mod = angular.module("foo", []);
      mod.component("myComponent", cmp);
      mod.component("dataComponent", cmp);
      mod.component("xComponent", cmp);
    });
    beforeEach(module("foo"));

    beforeEach(inject(($uiRouter, $compile, $rootScope) => {
      router = $uiRouter;
      rootScope = $rootScope;
      el = $compile(angular.element("<div><ui-view></ui-view></div>"))(
        $rootScope.$new(),
      );
    }));

    it("should not prefix the components dom element with anything", () => {
      router.stateRegistry.register({ name: "cmp", component: "myComponent" });
      router.stateService.go("cmp");
      rootScope.$digest();
      expect(el.html()).toMatch(/\<my-component/);
    });

    it("should prefix the components dom element with x- for components named dataFoo", () => {
      router.stateRegistry.register({
        name: "cmp",
        component: "dataComponent",
      });
      router.stateService.go("cmp");
      rootScope.$digest();
      expect(el.html()).toMatch(/\<x-data-component/);
    });

    it("should prefix the components dom element with x- for components named xFoo", () => {
      router.stateRegistry.register({ name: "cmp", component: "xComponent" });
      router.stateService.go("cmp");
      rootScope.$digest();
      expect(el.html()).toMatch(/\<x-x-component/);
    });
  });
});
