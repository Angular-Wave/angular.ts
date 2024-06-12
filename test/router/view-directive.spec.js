// function animateFlush($animate) {
//   if ($animate && $animate.flush) {
//     $animate.flush(); // 1.4
//   } else if ($animate && $animate.triggerCallbacks) {
//     $animate.triggerCallbacks(); // 1.2-1.3
//   }
// }

import { dealoc, jqLite } from "../../src/jqLite";
import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";
import { wait } from "../test-utils";

describe("uiView", () => {
  let $stateProvider,
    scope,
    $compile,
    elem,
    log,
    app,
    $injector,
    $state,
    $q,
    $timeout,
    $uiViewScroll;

  const aState = {
      name: "a",
      template: "aState template",
    },
    bState = {
      name: "b",
      template: "bState template",
    },
    cState = {
      name: "c",
      views: {
        cview: {
          template: "cState cview template",
        },
      },
    },
    dState = {
      name: "d",
      views: {
        dview1: {
          template: "dState dview1 template",
        },
        dview2: {
          template: "dState dview2 template",
        },
      },
    },
    eState = {
      name: "e",
      template: '<div ui-view="eview" class="eview"></div>',
    },
    fState = {
      name: "e.f",
      views: {
        eview: {
          template: "fState eview template",
        },
      },
    },
    gState = {
      name: "g",
      template: '<div ui-view="inner"><span>{{content}}</span></div>',
    },
    hState = {
      name: "g.h",
      views: {
        inner: {
          template: "hState inner template",
        },
      },
    },
    iState = {
      name: "i",
      template:
        "<div ui-view>" +
        '<ul><li ng-repeat="item in items">{{item}}</li></ul>' +
        "</div>",
    },
    jState = {
      name: "j",
      template: "jState",
    },
    kState = {
      name: "k",
      controller: function () {
        this.someProperty = "value";
      },
      template: "{{vm.someProperty}}",
      controllerAs: "vm",
    },
    lState = {
      name: "l",
      views: {
        view1: {
          template: "view1",
        },
        view2: {
          template: "view2",
        },
        view3: {
          template: "view3",
        },
      },
    },
    mState = {
      name: "m",
      template: "mState",
      controller: function ($scope, $element) {
        $scope.elementId = $element.attr("id");
      },
    },
    nState = {
      name: "n",
      template: "nState",
      controller: function ($scope, $element) {
        const data = $element.data("$uiViewAnim");
        $scope.$on("$destroy", () => {
          log += "destroy;";
        });
        data.$animEnter.then(() => {
          log += "animEnter;";
        });
        data.$animLeave.then(() => {
          log += "animLeave;";
        });
      },
    };

  beforeEach(() => {
    dealoc(document.getElementById("dummy"));
    window.angular = new Angular();
    publishExternalAPI();
    log = "";
    app = window.angular
      .module("defaultModule", ["ui.router"])
      .config(($provide, _$stateProvider_) => {
        $provide.decorator("$uiViewScroll", () => {
          return jasmine.createSpy("$uiViewScroll");
        });

        _$stateProvider_
          .state(aState)
          .state(bState)
          .state(cState)
          .state(dState)
          .state(eState)
          .state(fState)
          .state(gState)
          .state(hState)
          .state(iState)
          .state(jState)
          .state(kState)
          .state(lState)
          .state(mState)
          .state(nState);

        $stateProvider = _$stateProvider_;
      });

    $injector = window.angular.bootstrap(document.getElementById("dummy"), [
      "defaultModule",
    ]);

    $injector.invoke(
      (_$state_, _$q_, _$timeout_, $rootScope, _$compile_, _$uiViewScroll_) => {
        scope = $rootScope.$new();
        $compile = _$compile_;
        $state = _$state_;
        $q = _$q_;
        $timeout = _$timeout_;
        elem = jqLite("<div>");
        $uiViewScroll = _$uiViewScroll_;
      },
    );
  });

  describe("linking ui-directive", () => {
    it("anonymous ui-view should be replaced with the template of the current $state", async () => {
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));

      expect(elem.find("ui-view").text()).toBe("");

      $state.transitionTo(aState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(aState.template);
    });

    it("named ui-view should be replaced with the template of the current $state", async () => {
      elem.append(
        $compile('<div><ui-view name="cview"></ui-view></div>')(scope),
      );

      $state.transitionTo(cState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(cState.views.cview.template);
    });

    it("ui-view should be updated after transition to another state", async () => {
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));
      expect(elem.find("ui-view").text()).toBe("");

      $state.transitionTo(aState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(aState.template);

      $state.transitionTo(bState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(bState.template);
    });

    it("should handle NOT nested ui-views", async () => {
      elem.append(
        $compile(
          '<div><ui-view name="dview1" class="dview1"></ui-view><ui-view name="dview2" class="dview2"></ui-view></div>',
        )(scope),
      );
      expect(elem.find("ui-view").eq(0).text()).toBe("");
      expect(elem.find("ui-view").eq(1).text()).toBe("");

      $state.transitionTo(dState);
      await wait(10);

      expect(elem.find("ui-view").eq(0).text()).toBe(
        dState.views.dview1.template,
      );
      expect(elem.find("ui-view").eq(1).text()).toBe(
        dState.views.dview2.template,
      );
    });

    it("should handle nested ui-views (testing two levels deep)", async () => {
      $compile(elem.append("<div><ui-view></ui-view></div>"))(scope);
      expect(elem.find("ui-view").text()).toBe("");

      $state.transitionTo(fState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(fState.views.eview.template);
    });
  });

  describe("handling initial view", () => {
    it("initial view should be compiled if the view is empty", async () => {
      const content = "inner content";
      scope.content = content;
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));

      $state.transitionTo(gState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(content);
    });

    it("initial view should be put back after removal of the view", async () => {
      const content = "inner content";
      scope.content = content;
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));

      $state.go(hState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(hState.views.inner.template);

      // going to the parent state which makes the inner view empty
      $state.go(gState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(content);
    });

    // related to issue #435
    it("initial view should be transcluded once to prevent breaking other directives", async () => {
      scope.items = ["I", "am", "a", "list", "of", "items"];

      elem.append($compile("<div><ui-view></ui-view></div>")(scope));

      // transition to state that has an initial view
      $state.transitionTo(iState);
      await wait(10);

      // verify if ng-repeat has been compiled
      expect(elem.find("li").length).toBe(scope.items.length);

      // transition to another state that replace the initial content
      $state.transitionTo(jState);
      await wait(10);

      expect(elem.find("ui-view").text()).toBe(jState.template);

      // transition back to the state with empty subview and the initial view
      $state.transitionTo(iState);
      await wait(10);

      // verify if the initial view is correct
      expect(elem.find("li").length).toBe(scope.items.length);

      // change scope properties
      scope.$apply(() => {
        scope.items.push(".", "Working?");
      });

      // verify if the initial view has been updated
      expect(elem.find("li").length).toBe(scope.items.length);
    });
  });

  describe("autoscroll attribute", () => {
    it("should NOT autoscroll when unspecified", async () => {
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));

      $state.transitionTo(aState);
      await wait(10);
      expect($uiViewScroll).not.toHaveBeenCalled();
    });

    it("should autoscroll when expression is missing", async () => {
      elem.append($compile("<div><ui-view autoscroll></ui-view></div>")(scope));
      await $state.transitionTo(aState);
      await wait(20);

      // animateFlush($animate);

      expect($uiViewScroll).toHaveBeenCalledWith(elem.find("ui-view"));
    });

    it("should autoscroll based on expression", async () => {
      scope.doScroll = false;

      elem.append(
        $compile('<div><ui-view autoscroll="doScroll"></ui-view></div>')(scope),
      );

      $state.transitionTo(aState);
      await wait(10);

      expect($uiViewScroll).not.toHaveBeenCalled();

      scope.doScroll = true;
      $state.transitionTo(bState);
      await wait(100);

      let target,
        index = -1,
        uiViews = elem.find("ui-view");

      while (index++ < uiViews.length) {
        const uiView = jqLite(uiViews[index]);
        if (uiView.text() === bState.template) target = uiView;
      }

      expect($uiViewScroll).toHaveBeenCalledWith(target);
    });
  });

  it("should instantiate a controller with controllerAs", async () => {
    elem.append($compile("<div><ui-view></ui-view></div>")(scope));
    await $state.transitionTo(kState);
    expect(elem.text()).toBe("value");
  });

  it("should instantiate a controller with both $scope and $element injections", async () => {
    elem.append(
      $compile('<div><ui-view id="mState">{{elementId}}</ui-view></div>')(
        scope,
      ),
    );
    $state.transitionTo(mState);
    await wait(10);

    expect(elem.text()).toBe("mState");
  });

  describe("(resolved data)", () => {
    let _scope;
    function controller($scope) {
      _scope = $scope;
    }

    const _state = {
      name: "resolve",
      resolve: {
        user: function () {
          return $timeout(() => {
            return "joeschmoe";
          }, 100);
        },
      },
    };

    it("should provide the resolved data on the $scope", async () => {
      const state = Object.assign(_state, {
        template: "{{$resolve.user}}",
        controller: controller,
      });

      $stateProvider.state(state);
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));

      await $state.transitionTo("resolve");
      await wait(10);

      expect(elem.text()).toBe("joeschmoe");
      expect(_scope.$resolve).toBeDefined();
      expect(_scope.$resolve.user).toBe("joeschmoe");
    });

    // Test for #2626
    it("should provide the resolved data on the $scope even if there is no controller", async () => {
      const state = angular.extend({}, _state, {
        template: "{{$resolve.user}}",
      });
      $stateProvider.state(state);
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));
      expect(elem.text()).toBe("");

      await $state.transitionTo("resolve");
      await wait(10);

      expect(elem.text()).toBe("joeschmoe");
    });

    it("should put the resolved data on the resolveAs variable", async () => {
      const state = angular.extend({}, _state, {
        template: "{{$$$resolve.user}}",
        resolveAs: "$$$resolve",
        controller: controller,
      });
      $stateProvider.state(state);
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));

      await $state.transitionTo("resolve");
      await wait(10);

      expect(elem.text()).toBe("joeschmoe");
      expect(_scope.$$$resolve).toBeDefined();
      expect(_scope.$$$resolve.user).toBe("joeschmoe");
    });

    it("should put the resolved data on the controllerAs", async () => {
      const state = angular.extend({}, _state, {
        template: "{{$ctrl.$resolve.user}}",
        controllerAs: "$ctrl",
        controller: controller,
      });
      $stateProvider.state(state);
      elem.append($compile("<div><ui-view></ui-view></div>")(scope));

      await $state.transitionTo("resolve");
      await wait(10);

      expect(elem.text()).toBe("joeschmoe");
      expect(_scope.$resolve).toBeDefined();
      expect(_scope.$ctrl).toBeDefined();
      expect(_scope.$ctrl.$resolve).toBeDefined();
      expect(_scope.$ctrl.$resolve.user).toBe("joeschmoe");
    });

    it("should not allow both view-level resolveAs and state-level resolveAs on the same state", async () => {
      const views = {
        $default: {
          controller: controller,
          template: "{{$$$resolve.user}}",
          resolveAs: "$$$resolve",
        },
      };
      const state = angular.extend({}, _state, {
        resolveAs: "foo",
        views: views,
      });
      expect(() => $stateProvider.state(state)).toThrowError(/resolveAs/);
    });
  });

  it("should call the existing $onInit after instantiating a controller", async () => {
    const $onInit = jasmine.createSpy();
    $stateProvider.state({
      name: "onInit",
      controller: function () {
        this.$onInit = $onInit;
      },
      template: "hi",
      controllerAs: "vm",
    });
    elem.append($compile("<div><ui-view></ui-view></div>")(scope));
    await $state.transitionTo("onInit");
    await wait(10);

    expect($onInit).toHaveBeenCalled();
  });

  // TargetNode not found error
  xit("should default the template to a <ui-view>", async () => {
    $stateProvider.state({ name: "abstract", abstract: true });
    $stateProvider.state({ name: "abstract.foo", template: "hello" });
    elem.append($compile("<div><ui-view></ui-view></div>")(scope));
    $state.transitionTo("abstract.foo");
    await wait(10);

    expect(elem.text()).toBe("hello");
  });

  describe("play nicely with other directives", () => {
    // related to issue #857
    it("should work with ngIf", async () => {
      scope.someBoolean = false;
      elem.append(
        $compile('<div ng-if="someBoolean"><ui-view></ui-view></div>')(scope),
      );

      $state.transitionTo(aState);
      await wait(10);

      // Verify there is no ui-view in the DOM
      expect(elem.find("ui-view").length).toBe(0);

      // Turn on the div that holds the ui-view
      scope.someBoolean = true;
      scope.$digest();

      // Verify that the ui-view is there and it has the correct content
      expect(elem.find("ui-view").text()).toBe(aState.template);

      // Turn off the ui-view
      scope.someBoolean = false;
      scope.$digest();

      // Verify there is no ui-view in the DOM
      expect(elem.find("ui-view").length).toBe(0);

      // Turn on the div that holds the ui-view once again
      scope.someBoolean = true;
      scope.$digest();

      // Verify that the ui-view is there and it has the correct content
      expect(elem.find("ui-view").text()).toBe(aState.template);
    });

    it("should work with ngClass", async () => {
      const classes = (elem) => Array.prototype.slice.call(elem[0].classList);

      scope.showClass = false;
      elem.append(
        $compile(
          "<div><ui-view ng-class=\"{'someClass': showClass}\"></ui-view></div>",
        )(scope),
      );

      expect(classes(elem.find("ui-view"))).not.toContain("someClass");

      scope.showClass = true;
      scope.$digest();

      expect(classes(elem.find("ui-view"))).toContain("someClass");

      scope.showClass = false;
      scope.$digest();

      expect(classes(elem.find("ui-view"))).not.toContain("someClass");
    });

    describe("working with ngRepeat", () => {
      it("should have correct number of uiViews", async () => {
        elem.append(
          $compile(
            '<div><ui-view ng-repeat="view in views" name="{{view}}"></ui-view></div>',
          )(scope),
        );

        // Should be no ui-views in DOM
        expect(elem.find("ui-view").length).toBe(0);

        // Lets add 3
        scope.views = ["view1", "view2", "view3"];
        scope.$digest();

        // Should be 3 ui-views in the DOM
        expect(elem.find("ui-view").length).toBe(scope.views.length);

        // Lets add one more - yay two-way binding
        scope.views.push("view4");
        scope.$digest();

        // Should have 4 ui-views
        expect(elem.find("ui-view").length).toBe(scope.views.length);

        // Lets remove 2 ui-views from the DOM
        scope.views.pop();
        scope.views.pop();
        scope.$digest();

        // Should have 2 ui-views
        expect(elem.find("ui-view").length).toBe(scope.views.length);
      });

      it("should populate each view with content", async () => {
        elem.append(
          $compile(
            '<div><ui-view ng-repeat="view in views" name="{{view}}">defaultcontent</ui-view></div>',
          )(scope),
        );

        $state.transitionTo(lState);
        await wait(10);

        expect(elem.find("ui-view").length).toBe(0);

        scope.views = ["view1", "view2"];

        scope.$digest();

        let uiViews = elem.find("ui-view");

        expect(uiViews.eq(0).text()).toBe(lState.views.view1.template);
        expect(uiViews.eq(1).text()).toBe(lState.views.view2.template);
        expect(uiViews.eq(2).length).toBe(0);

        scope.views.push("view3");
        scope.$digest();

        uiViews = elem.find("ui-view");

        expect(uiViews.eq(0).text()).toBe(lState.views.view1.template);
        expect(uiViews.eq(1).text()).toBe(lState.views.view2.template);
        expect(uiViews.eq(2).text()).toBe(lState.views.view3.template);
      });

      it("should interpolate ui-view names", async () => {
        elem.append(
          $compile(
            '<div ng-repeat="view in views">' +
              '<ui-view name="view{{$index + 1}}">hallo</ui-view>' +
              "</div>",
          )(scope),
        );

        $state.transitionTo(lState);
        await wait(10);

        expect(elem.find("ui-view").length).toBe(0);

        scope.views = ["view1", "view2"];

        scope.$digest();

        let uiViews = elem.find("ui-view");

        expect(uiViews.eq(0).text()).toBe(lState.views.view1.template);
        expect(uiViews.eq(1).text()).toBe(lState.views.view2.template);
        expect(uiViews.eq(2).length).toBe(0);

        scope.views.push("view3");
        scope.$digest();

        uiViews = elem.find("ui-view");

        expect(uiViews.eq(0).text()).toBe(lState.views.view1.template);
        expect(uiViews.eq(1).text()).toBe(lState.views.view2.template);
        expect(uiViews.eq(2).text()).toBe(lState.views.view3.template);
      });
    });
  });

  // describe("AngularJS Animations", () => {
  //   it("should do transition animations", async () => {
  //     let content = "Initial Content",
  //       animation;
  //     elem.append(
  //       $compile("<div><ui-view>" + content + "</ui-view></div>")(scope),
  //     );

  //     // Enter Animation
  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("enter");
  //     expect(animation.element.text() + "-1").toBe(content + "-1");

  //     $state.transitionTo(aState);
  //     await wait(10);

  //     // Enter Animation
  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("enter");
  //     expect(animation.element.text() + "-2").toBe(aState.template + "-2");
  //     // Leave Animation
  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("leave");
  //     expect(animation.element.text() + "-3").toBe(content + "-3");

  //     $state.transitionTo(bState);
  //     await wait(10);

  //     // Enter Animation
  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("enter");
  //     expect(animation.element.text() + "-4").toBe(bState.template + "-4");
  //     // Leave Animation
  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("leave");
  //     expect(animation.element.text() + "-5").toBe(aState.template + "-5");

  //     // No more animations
  //     expect($animate.queue.length).toBe(0);
  //   });

  //   it("should do ngClass animations", async () => {
  //     scope.classOn = false;
  //     let content = "Initial Content",
  //       className = "yay",
  //       animation;
  //     elem.append(
  //       $compile(
  //         "<div><ui-view ng-class=\"{'" +
  //           className +
  //           "': classOn}\">" +
  //           content +
  //           "</ui-view></div>",
  //       )(scope),
  //     );
  //     // Don't care about enter class
  //     $animate.queue.shift();

  //     scope.classOn = true;
  //     scope.$digest();

  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("addClass");
  //     expect(animation.element.text()).toBe(content);

  //     scope.classOn = false;
  //     scope.$digest();

  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("removeClass");
  //     expect(animation.element.text()).toBe(content);

  //     // No more animations
  //     expect($animate.queue.length).toBe(0);
  //   });

  //   it("should do ngIf animations", async () => {
  //     scope.shouldShow = false;
  //     let content = "Initial Content",
  //       animation;
  //     elem.append(
  //       $compile(
  //         '<div><ui-view ng-if="shouldShow">' + content + "</ui-view></div>",
  //       )(scope),
  //     );

  //     // No animations yet
  //     expect($animate.queue.length).toBe(0);

  //     scope.shouldShow = true;
  //     scope.$digest();

  //     // $ViewDirective enter animation - Basically it's just the <!-- uiView --> comment
  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("enter");
  //     expect(animation.element.text()).toBe("");

  //     // $ViewDirectiveFill enter animation - The second uiView directive that files in the content
  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("enter");
  //     expect(animation.element.text()).toBe(content);

  //     scope.shouldShow = false;
  //     scope.$digest();

  //     // uiView leave animation
  //     animation = $animate.queue.shift();
  //     expect(animation.event).toBe("leave");
  //     expect(animation.element.text()).toBe(content);

  //     // No more animations
  //     expect($animate.queue.length).toBe(0);
  //   });

  //   it("should expose animation promises to controllers", async () => {
  //     $transitions.onStart({}, function ($transition$) {
  //       log += "start:" + $transition$.to().name + ";";
  //     });
  //     $transitions.onFinish({}, function ($transition$) {
  //       log += "finish:" + $transition$.to().name + ";";
  //     });
  //     $transitions.onSuccess({}, function ($transition$) {
  //       log += "success:" + $transition$.to().name + ";";
  //     });

  //     const content = "Initial Content";
  //     elem.append(
  //       $compile("<div><ui-view>" + content + "</ui-view></div>")(scope),
  //     );
  //     $state.transitionTo("n");
  //     await wait(10);

  //     expect($state.current.name).toBe("n");
  //     expect(log).toBe("start:n;finish:n;success:n;");

  //     // animateFlush($animate);
  //     await wait(10);
  //     expect(log).toBe("start:n;finish:n;success:n;animEnter;");

  //     $state.transitionTo("a");
  //     await wait(10);
  //     expect($state.current.name).toBe("a");
  //     expect(log).toBe(
  //       "start:n;finish:n;success:n;animEnter;start:a;finish:a;destroy;success:a;",
  //     );

  //     // animateFlush($animate);
  //     await wait(10);
  //     expect(log).toBe(
  //       "start:n;finish:n;success:n;animEnter;start:a;finish:a;destroy;success:a;animLeave;",
  //     );
  //   });
  // });
});

describe("UiView", () => {
  let $stateProvider,
    scope,
    $compile,
    elem,
    log,
    app,
    $injector,
    $state,
    $q,
    $timeout,
    $rootScope,
    $uiViewScroll;

  beforeEach(() => {
    dealoc(document.getElementById("dummy"));
    window.angular = new Angular();
    publishExternalAPI();
    log = "";
    app = window.angular
      .module("defaultModule", ["ui.router"])
      .config((_$stateProvider_) => {
        $stateProvider = _$stateProvider_;
        $stateProvider
          .state({ name: "main", abstract: true, views: { main: {} } })
          .state({
            name: "main.home",
            views: { content: { template: "HOME" } },
          })
          .state({ name: "test", views: { nest: { template: "TEST" } } });
      });

    $injector = window.angular.bootstrap(document.getElementById("dummy"), [
      "defaultModule",
    ]);

    $injector.invoke(
      (
        _$state_,
        _$q_,
        _$timeout_,
        _$rootScope_,
        _$compile_,
        _$uiViewScroll_,
      ) => {
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $compile = _$compile_;
        $state = _$state_;
        $q = _$q_;
        $timeout = _$timeout_;
        elem = jqLite("<div>");
        $uiViewScroll = _$uiViewScroll_;
      },
    );
  });

  // TODO targetNode not found
  xit("shouldn't puke on weird nested view setups", async () => {
    $compile('<div ui-view="main"><div ui-view="content"></div></div>')(
      $rootScope,
    );

    await $state.go("main.home");
    await wait(10);

    expect($state.current.name).toBe("main.home");
  });

  // Test for https://github.com/angular-ui/ui-router/issues/3355
  it("should target weird nested view setups using the view's simple name", async () => {
    const tpl = `
      <div>
        <div ui-view="main">
          MAIN-DEFAULT-
          <div ui-view="content">
            <div ui-view="nest"></div>
          </div>
        </div>
      </div>
    `;
    const el = $compile(tpl)($rootScope);

    $state.go("test");
    await wait(10);

    expect($state.current.name).toBe("test");
    expect(el.text().replace(/\s*/g, "")).toBe("MAIN-DEFAULT-TEST");
  });
});

describe("uiView transclusion", () => {
  let scope, $compile, elem, $injector, $rootScope, $state;

  beforeEach(() => {
    dealoc(document.getElementById("dummy"));
    window.angular = new Angular();
    publishExternalAPI();
    window.angular
      .module("defaultModule", ["ui.router"])
      .directive("scopeObserver", () => {
        return {
          restrict: "E",
          link: function (scope) {
            scope.$emit("directiveCreated");
            scope.$on("$destroy", () => {
              scope.$emit("directiveDestroyed");
            });
          },
        };
      })
      .config(function ($stateProvider) {
        $stateProvider
          .state({
            name: "a",
            template: "<ui-view><scope-observer></scope-observer></ui-view>",
          })
          .state({ name: "a.b", template: "anything" });
      });
    $injector = window.angular.bootstrap(document.getElementById("dummy"), [
      "defaultModule",
    ]);

    $injector.invoke(
      (
        _$state_,
        _$q_,
        _$timeout_,
        _$rootScope_,
        _$compile_,
        _$uiViewScroll_,
      ) => {
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $compile = _$compile_;
        $state = _$state_;
        elem = jqLite("<div>");
      },
    );
  });

  it("should not link the initial view and leave its scope undestroyed when a subview is activated", async () => {
    let aliveCount = 0;
    scope.$on("directiveCreated", () => {
      aliveCount++;
    });
    scope.$on("directiveDestroyed", () => {
      aliveCount--;
    });
    elem.append($compile("<div><ui-view></ui-view></div>")(scope));
    $state.transitionTo("a.b");
    await wait(10);
    expect(aliveCount).toBe(0);
  });
});

// fdescribe("uiView controllers or onEnter handlers", () => {
//   let el, template, scope, document, count;

//   beforeEach(module("ui.router"));

//   beforeEach(
//     module(function ($stateProvider) {
//       count = 0;
//       $stateProvider
//         .state("aside", {
//           url: "/aside",
//           template: '<div class="aside"></div>',
//         })
//         .state("A", {
//           url: "/A",
//           template: '<div class="A" ui-view="fwd"></div>',
//         })
//         .state("A.fwd", {
//           url: "/fwd",
//           views: {
//             fwd: {
//               template: '<div class="fwd" ui-view>',
//               controller: function ($state) {
//                 if (count++ < 20 && $state.current.name == "A.fwd")
//                   $state.go(".nest");
//               },
//             },
//           },
//         })
//         .state("A.fwd.nest", {
//           url: "/nest",
//           template: '<div class="nest"></div>',
//         });
//     }),
//   );

//   beforeEach(inject(function ($document) {
//     document = $document[0];
//   });

//   it("should not go into an infinite loop when controller uses $state.go", inject(function (
//     $rootScope,
//     $q,
//     $compile,
//     $state,
//   ) {
//     el = jqLite("<div><ui-view></ui-view></div>");
//     template = $compile(el)($rootScope);
//     $rootScope.$digest();

//     $state.transitionTo("aside");
//     await wait(10);
//     expect(template[0].querySelector(".aside")).toBeDefined();
//     expect(template[0].querySelector(".fwd")).toBeNull();

//     $state.transitionTo("A");
//     await wait(10);
//     expect(template[0].querySelector(".A")).not.toBeNull();
//     expect(template[0].querySelector(".fwd")).toBeNull();

//     $state.transitionTo("A.fwd");
//     await wait(10);
//     expect(template[0].querySelector(".A")).not.toBeNull();
//     expect(template[0].querySelector(".fwd")).not.toBeNull();
//     expect(template[0].querySelector(".nest")).not.toBeNull();
//     expect(count).toBe(1);
//   });
// });

// fdescribe("angular 1.5+ style .component()", () => {
//   let el, app, scope, log, svcs, $stateProvider;

//   beforeEach(() => {
//     app = angular.module("foo", []);

//     // ng 1.2 directive (manually bindToController)
//     app.directive("ng12Directive", () => {
//       return {
//         restrict: "E",
//         scope: { data: "=" },
//         templateUrl: "/comp_tpl.html",
//         controller: function ($scope) {
//           this.data = $scope.data;
//         },
//         controllerAs: "$ctrl",
//       };
//     });

//     // ng 1.3-1.4 directive with bindToController
//     app.directive("ng13Directive", () => {
//       return {
//         scope: { data: "=" },
//         templateUrl: "/comp_tpl.html",
//         controller: () => {
//           this.$onInit = () => {
//             log += "onInit;";
//           };
//         },
//         bindToController: true,
//         controllerAs: "$ctrl",
//       };
//     });

//     app.directive("ng12DynamicDirective", () => {
//       return {
//         restrict: "E",
//         template: "dynamic directive",
//       };
//     });

//     // ng 1.5+ component
//     if (angular.version.minor >= 5) {
//       app.component("ngComponent", {
//         bindings: { data: "<", data2: "<" },
//         templateUrl: "/comp_tpl.html",
//         controller: () => {
//           this.$onInit = () => {
//             log += "onInit;";
//           };
//         },
//       });

//       app.component("header", {
//         bindings: { status: "<" },
//         template: "#{{ $ctrl.status }}#",
//       });

//       app.component("bindingTypes", {
//         bindings: { oneway: "<oneway", twoway: "=", attribute: "@attr" },
//         template:
//           "-{{ $ctrl.oneway }},{{ $ctrl.twoway }},{{ $ctrl.attribute }}-",
//       });

//       app.component("optionalBindingTypes", {
//         bindings: { oneway: "<?oneway", twoway: "=?", attribute: "@?attr" },
//         template:
//           "-{{ $ctrl.oneway }},{{ $ctrl.twoway }},{{ $ctrl.attribute }}-",
//       });

//       app.component("eventComponent", {
//         bindings: { evt: "&" },
//         template: "eventCmp",
//       });

//       app.component("mydataComponent", {
//         bindings: { dataUser: "<" },
//         template: "-{{ $ctrl.dataUser }}-",
//       });

//       app.component("dataComponent", {
//         template: "DataComponent",
//       });

//       app.component("parentCallbackComponent", {
//         controller: function ($rootScope) {
//           this.handleEvent = function (foo, bar) {
//             $rootScope.log.push(foo);
//             $rootScope.log.push(bar);
//           };
//         },
//         template: `
//           <h1>parentCmp</h1>
//           <ui-view on-event="$ctrl.handleEvent(foo, bar)"></ui-view>
//           `,
//       });

//       app.component("childEventComponent", {
//         bindings: { onEvent: "&" },
//         template: `
//           <h1>childCmp</h1>
//           <button id="eventbtn" ng-click="$ctrl.onEvent({ foo: 123, bar: 456 })">Button</button>
//           `,
//       });

//       app.component("dynamicComponent", {
//         template: "dynamicComponent {{ $ctrl.param }}",
//         controller: () => {
//           this.uiOnParamsChanged = function (params) {
//             this.param = params.param;
//           };
//         },
//       });
//     }
//   });

//   beforeEach(module("ui.router", "foo"));
//   beforeEach(
//     module(function (_$stateProvider_) {
//       $stateProvider = _$stateProvider_;
//     }),
//   );

//   beforeEach(inject(function (
//     $rootScope,
//     _$httpBackend_,
//     _$compile_,
//     _$state_,
//     _$q_,
//   ) {
//     svcs = {
//       $httpBackend: _$httpBackend_,
//       $compile: _$compile_,
//       $state: _$state_,
//       $q: _$q_,
//     };
//     scope = $rootScope.$new();
//     log = "";
//     el = jqLite("<div><ui-view></ui-view></div>");
//     svcs.$compile(el)(scope);
//   });

//   describe("routing using component templates", () => {
//     beforeEach(() => {
//       $stateProvider.state("cmp_tpl", {
//         url: "/cmp_tpl",
//         templateUrl: "/state_tpl.html",
//         controller: () => {},
//         resolve: {
//           data: () => {
//             return "DATA!";
//           },
//         },
//       });
//     });

//     it("should work with directives which themselves have templateUrls", () => {
//       const $state = svcs.$state,
//         $httpBackend = svcs.$httpBackend,
//         $q = svcs.$q;

//       $httpBackend
//         .expectGET("/state_tpl.html")
//         .respond('x<ng12-directive data="$resolve.data"></ng12-directive>x');
//       $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");

//       $state.transitionTo("cmp_tpl");
//       await wait(10);

//       // Template has not yet been fetched
//       let directiveEl = el[0].querySelector("div ui-view ng12-directive");
//       expect(directiveEl).toBeNull();
//       expect($state.current.name).toBe("");

//       // Fetch templates
//       $httpBackend.flush();
//       directiveEl = el[0].querySelector("div ui-view ng12-directive");
//       expect(directiveEl).toBeDefined();
//       expect($state.current.name).toBe("cmp_tpl");

//       expect(
//         jqLite(directiveEl).data("$ng12DirectiveController"),
//       ).toBeDefined();
//       expect(el.text()).toBe("x-DATA!-x");
//     });

//     if (angular.version.minor >= 3) {
//       it("should work with ng 1.3+ bindToController directives", () => {
//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend
//           .expectGET("/state_tpl.html")
//           .respond('x<ng13-directive data="$resolve.data"></ng13-directive>x');
//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");

//         $state.transitionTo("cmp_tpl");
//         await wait(10);
//         $httpBackend.flush();

//         const directiveEl = el[0].querySelector("div ui-view ng13-directive");
//         expect(directiveEl).toBeDefined();
//         expect($state.current.name).toBe("cmp_tpl");

//         expect(
//           jqLite(directiveEl).data("$ng13DirectiveController"),
//         ).toBeDefined();
//         expect(el.text()).toBe("x-DATA!-x");
//       });
//     }

//     if (angular.version.minor >= 5) {
//       it("should work with ng 1.5+ .component()s", () => {
//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend
//           .expectGET("/state_tpl.html")
//           .respond('x<ng-component data="$resolve.data"></ng-component>x');
//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");

//         $state.transitionTo("cmp_tpl");
//         await wait(10);
//         $httpBackend.flush();

//         const directiveEl = el[0].querySelector("div ui-view ng-component");
//         expect(directiveEl).toBeDefined();
//         expect($state.current.name).toBe("cmp_tpl");

//         expect(
//           jqLite(directiveEl).data("$ngComponentController"),
//         ).toBeDefined();
//         expect(el.text()).toBe("x-DATA!-x");
//       });
//     }
//   });

//   describe("+ component: declaration", () => {
//     it("should disallow controller/template configuration", () => {
//       const stateDef = {
//         url: "/route2cmp",
//         component: "ng12Directive",
//         resolve: {
//           data: () => {
//             return "DATA!";
//           },
//         },
//       };

//       expect(() => {
//         $stateProvider.state(
//           "route2cmp",
//           extend({ template: "fail" }, stateDef),
//         );
//       }).toThrow();
//       expect(() => {
//         $stateProvider.state(
//           "route2cmp",
//           extend({ templateUrl: "fail.html" }, stateDef),
//         );
//       }).toThrow();
//       expect(() => {
//         $stateProvider.state(
//           "route2cmp",
//           extend({ templateProvider: () => {} }, stateDef),
//         );
//       }).toThrow();
//       expect(() => {
//         $stateProvider.state(
//           "route2cmp",
//           extend({ controllerAs: "fail" }, stateDef),
//         );
//       }).toThrow();
//       expect(() => {
//         $stateProvider.state(
//           "route2cmp",
//           extend({ controller: "FailCtrl" }, stateDef),
//         );
//       }).toThrow();
//       expect(() => {
//         $stateProvider.state(
//           "route2cmp",
//           extend({ controllerProvider: () => {} }, stateDef),
//         );
//       }).toThrow();

//       expect(() => {
//         $stateProvider.state("route2cmp", stateDef);
//       }).not.toThrow();
//     });

//     it("should work with angular 1.2+ directives", () => {
//       $stateProvider.state("route2cmp", {
//         url: "/route2cmp",
//         component: "ng12Directive",
//         resolve: {
//           data: () => {
//             return "DATA!";
//           },
//         },
//       });

//       const $state = svcs.$state,
//         $httpBackend = svcs.$httpBackend,
//         $q = svcs.$q;

//       $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//       $state.transitionTo("route2cmp");
//       await wait(10);
//       $httpBackend.flush();

//       const directiveEl = el[0].querySelector("div ui-view ng12-directive");
//       expect(directiveEl).toBeDefined();
//       expect($state.current.name).toBe("route2cmp");
//       expect(el.text()).toBe("-DATA!-");
//     });

//     if (angular.version.minor >= 3) {
//       it("should work with angular 1.3+ bindToComponent directives", () => {
//         $stateProvider.state("route2cmp", {
//           url: "/route2cmp",
//           component: "ng13Directive",
//           resolve: {
//             data: () => {
//               return "DATA!";
//             },
//           },
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//         $state.transitionTo("route2cmp");
//         await wait(10);
//         $httpBackend.flush();

//         const directiveEl = el[0].querySelector("div ui-view ng13-directive");
//         expect(directiveEl).toBeDefined();
//         expect($state.current.name).toBe("route2cmp");
//         expect(el.text()).toBe("-DATA!-");
//       });

//       it("should call $onInit() once", () => {
//         $stateProvider.state("route2cmp", {
//           url: "/route2cmp",
//           component: "ng13Directive",
//           resolve: {
//             data: () => {
//               return "DATA!";
//             },
//           },
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//         $state.transitionTo("route2cmp");
//         await wait(10);
//         $httpBackend.flush();

//         expect(log).toBe("onInit;");
//       });
//     }

//     if (angular.version.minor >= 5) {
//       it("should work with angular 1.5+ .component()s", () => {
//         $stateProvider.state("route2cmp", {
//           url: "/route2cmp",
//           component: "ngComponent",
//           resolve: {
//             data: () => {
//               return "DATA!";
//             },
//           },
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//         $state.transitionTo("route2cmp");
//         await wait(10);
//         $httpBackend.flush();

//         const directiveEl = el[0].querySelector("div ui-view ng-component");
//         expect(directiveEl).toBeDefined();
//         expect($state.current.name).toBe("route2cmp");
//         expect(el.text()).toBe("-DATA!-");
//       });

//       it("should only call $onInit() once", () => {
//         $stateProvider.state("route2cmp", {
//           component: "ngComponent",
//           resolve: {
//             data: () => {
//               return "DATA!";
//             },
//           },
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//         $state.transitionTo("route2cmp");
//         await wait(10);
//         $httpBackend.flush();

//         expect(log).toBe("onInit;");
//       });

//       it("should only call $onInit() once with componentProvider", () => {
//         $stateProvider.state("route2cmp", {
//           componentProvider: () => "ngComponent",
//           resolve: {
//             data: () => {
//               return "DATA!";
//             },
//           },
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//         $state.transitionTo("route2cmp");
//         await wait(10);
//         $httpBackend.flush();

//         expect(log).toBe("onInit;");
//       });

//       it('should supply resolve data to "<", "=", "@" bindings', () => {
//         $stateProvider.state("bindingtypes", {
//           component: "bindingTypes",
//           resolve: {
//             oneway: () => {
//               return "ONEWAY";
//             },
//             twoway: () => {
//               return "TWOWAY";
//             },
//             attribute: () => {
//               return "ATTRIBUTE";
//             },
//           },
//           bindings: { attr: "attribute" },
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $state.transitionTo("bindingtypes");
//         await wait(10);

//         expect(el.text()).toBe("-ONEWAY,TWOWAY,ATTRIBUTE-");
//       });

//       it('should supply resolve data to optional "<?", "=?", "@?" bindings', () => {
//         $stateProvider.state("optionalbindingtypes", {
//           component: "optionalBindingTypes",
//           resolve: {
//             oneway: () => {
//               return "ONEWAY";
//             },
//             twoway: () => {
//               return "TWOWAY";
//             },
//             attribute: () => {
//               return "ATTRIBUTE";
//             },
//           },
//           bindings: { attr: "attribute" },
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $state.transitionTo("optionalbindingtypes");
//         await wait(10);

//         expect(el.text()).toBe("-ONEWAY,TWOWAY,ATTRIBUTE-");
//       });

//       // Test for #3099
//       it('should not throw when routing to a component with output "&" binding', () => {
//         $stateProvider.state("nothrow", {
//           component: "eventComponent",
//         });

//         const $state = svcs.$state,
//           $q = svcs.$q;
//         $state.transitionTo("nothrow");
//         await wait(10);

//         expect(el.text()).toBe("eventCmp");
//       });

//       // Test for #3276
//       it('should route to a component that is prefixed with "data"', () => {
//         $stateProvider.state("data", {
//           component: "dataComponent",
//         });

//         const $state = svcs.$state,
//           $q = svcs.$q;
//         $state.transitionTo("data");
//         await wait(10);

//         expect(el.text()).toBe("DataComponent");
//       });

//       // Test for #3276
//       it('should bind a resolve that is prefixed with "data"', () => {
//         $stateProvider.state("data", {
//           component: "mydataComponent",
//           resolve: { dataUser: () => "user" },
//         });

//         const $state = svcs.$state,
//           $q = svcs.$q;
//         $state.transitionTo("data");
//         await wait(10);

//         expect(el.text()).toBe("-user-");
//       });

//       // Test for #3239
//       it("should pass any bindings (wired from a parent component template via the ui-view) through to the child", inject(function (
//         $rootScope,
//       ) {
//         const $state = svcs.$state,
//           $q = svcs.$q;

//         $stateProvider.state("parent", {
//           template:
//             '<ui-view oneway="data1w" twoway="data2w" attr="attrval"></ui-view>',
//           controller: function ($scope) {
//             $scope.data1w = "1w";
//             $scope.data2w = "2w";
//           },
//         });

//         $stateProvider.state("parent.child", {
//           component: "bindingTypes",
//         });

//         $state.transitionTo("parent.child");
//         await wait(10);
//         expect(el.text()).toEqual("-1w,2w,attrval-");
//       });

//       // Test for #3239
//       it("should prefer ui-view bindings over resolve data", inject(function (
//         $rootScope,
//       ) {
//         const $state = svcs.$state,
//           $q = svcs.$q;

//         $stateProvider.state("parent", {
//           template:
//             '<ui-view oneway="data1w" twoway="data2w" attr="attrval"></ui-view>',
//           resolve: {
//             oneway: () => "asfasfd",
//             twoway: () => "asfasfd",
//             attr: () => "asfasfd",
//           },
//           controller: function ($scope) {
//             $scope.data1w = "1w";
//             $scope.data2w = "2w";
//           },
//         });

//         $stateProvider.state("parent.child", {
//           component: "bindingTypes",
//         });

//         $state.transitionTo("parent.child");
//         await wait(10);
//         expect(el.text()).toEqual("-1w,2w,attrval-");
//       });

//       // Test for #3239
//       it("should prefer ui-view bindings over resolve data unless a bindings exists", inject(function (
//         $rootScope,
//       ) {
//         const $state = svcs.$state,
//           $q = svcs.$q;

//         $stateProvider.state("parent", {
//           template:
//             '<ui-view oneway="data1w" twoway="data2w" attr="attrval"></ui-view>',
//           resolve: {
//             oneway: () => "asfasfd",
//             twoway: () => "asfasfd",
//             attr: () => "asfasfd",
//           },
//           controller: function ($scope) {
//             $scope.data1w = "1w";
//             $scope.data2w = "2w";
//           },
//         });

//         $stateProvider.state("parent.child", {
//           component: "bindingTypes",
//           bindings: { oneway: "oneway" },
//         });

//         $state.transitionTo("parent.child");
//         await wait(10);
//         expect(el.text()).toEqual("-asfasfd,2w,attrval-");
//       });

//       // Test for #3239
//       it("should pass & bindings (wired from a parent component via the ui-view) through to the child", inject(function (
//         $rootScope,
//       ) {
//         const $state = svcs.$state,
//           $q = svcs.$q;
//         $rootScope.log = [];

//         $stateProvider.state("parent", {
//           component: "parentCallbackComponent",
//         });

//         $stateProvider.state("parent.child", {
//           component: "childEventComponent",
//         });

//         $state.transitionTo("parent.child");
//         await wait(10);
//         expect($rootScope.log).toEqual([]);
//         expect(
//           el
//             .text()
//             .split(/\s+/)
//             .filter((x) => x),
//         ).toEqual(["parentCmp", "childCmp", "Button"]);

//         // - Click button
//         // - ng-click handler calls $ctrl.onEvent({ foo: 123, bar: 456 })
//         // - on-event is bound to $ctrl.handleEvent(foo, bar) on parentCallbackComponent
//         // - handleEvent pushes param values to the log
//         el.find("button")[0].click();
//         expect($rootScope.log).toEqual([123, 456]);
//       });

//       // Test for #3111
//       it("should bind & bindings to a resolve that returns a function", inject(function (
//         $rootScope,
//       ) {
//         const $state = svcs.$state,
//           $q = svcs.$q,
//           log = [];

//         $stateProvider.state("resolve", {
//           component: "childEventComponent",
//           resolve: {
//             onEvent: () => (foo, bar) => {
//               log.push(foo);
//               log.push(bar);
//             },
//           },
//         });

//         $state.transitionTo("resolve");
//         await wait(10);
//         expect(log).toEqual([]);
//         el.find("button")[0].click();
//         expect(log).toEqual([123, 456]);
//       });

//       // Test for #3111
//       it("should bind & bindings to a resolve that returns an array-style function", inject(function (
//         $rootScope,
//       ) {
//         const $state = svcs.$state,
//           $q = svcs.$q,
//           log = [];

//         $stateProvider.state("resolve", {
//           component: "childEventComponent",
//           resolve: {
//             onEvent: () => [
//               "foo",
//               "bar",
//               (foo, bar) => {
//                 log.push(foo);
//                 log.push(bar);
//               },
//             ],
//           },
//         });

//         $state.transitionTo("resolve");
//         await wait(10);
//         expect(log).toEqual([]);
//         el.find("button")[0].click();
//         expect(log).toEqual([123, 456]);
//       });
//     }
//   });

//   if (angular.version.minor >= 5) {
//     describe("+ named views with component: declaration", () => {
//       let stateDef;
//       beforeEach(() => {
//         stateDef = {
//           url: "/route2cmp",
//           views: {
//             header: { component: "header" },
//             content: { component: "ngComponent" },
//           },
//           resolve: {
//             status: () => {
//               return "awesome";
//             },
//             data: () => {
//               return "DATA!";
//             },
//           },
//         };

//         el = jqLite(
//           '<div><div ui-view="header"></div><div ui-view="content"</div>',
//         );
//         svcs.$compile(el)(scope);
//       });

//       it("should disallow controller/template configuration in the view", () => {
//         expect(() => {
//           $stateProvider.state("route2cmp", stateDef);
//         }).not.toThrow();
//         expect(() => {
//           const state = extend({}, stateDef);
//           state.views.header.template = "fails";
//           $stateProvider.state("route2cmp", state);
//         }).toThrow();
//       });

//       it("should render components as views", () => {
//         $stateProvider.state("route2cmp", stateDef);
//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//         $state.transitionTo("route2cmp");
//         await wait(10);
//         $httpBackend.flush();

//         const header = el[0].querySelector("[ui-view=header]");
//         const content = el[0].querySelector("[ui-view=content]");

//         expect(header.textContent).toBe("#awesome#");
//         expect(content.textContent).toBe("-DATA!-");
//       });

//       it("should allow a component view declaration to use a string as a shorthand", () => {
//         stateDef = {
//           url: "/route2cmp",
//           views: { header: "header", content: "ngComponent" },
//           resolve: {
//             status: () => {
//               return "awesome";
//             },
//             data: () => {
//               return "DATA!";
//             },
//           },
//         };
//         $stateProvider.state("route2cmp", stateDef);
//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//         $state.transitionTo("route2cmp");
//         await wait(10);
//         $httpBackend.flush();

//         const header = el[0].querySelector("[ui-view=header]");
//         const content = el[0].querySelector("[ui-view=content]");

//         expect(header.textContent).toBe("#awesome#");
//         expect(content.textContent).toBe("-DATA!-");
//       });

//       // Test for https://github.com/angular-ui/ui-router/issues/3353
//       it("should allow different states to reuse view declaration", () => {
//         const views = {
//           header: { component: "header" },
//           content: { component: "ngComponent" },
//         };

//         const stateDef1 = { name: "def1", url: "/def1", views: views };
//         const stateDef2 = { name: "def2", url: "/def2", views: views };

//         $stateProvider.state(stateDef1);
//         $stateProvider.state(stateDef2);
//       });
//     });
//   }

//   describe("+ bindings: declaration", () => {
//     it("should provide the named component binding with data from the named resolve", () => {
//       $stateProvider.state("route2cmp", {
//         url: "/route2cmp",
//         component: "ng12Directive",
//         bindings: { data: "foo" },
//         resolve: {
//           foo: () => {
//             return "DATA!";
//           },
//         },
//       });

//       const $state = svcs.$state,
//         $httpBackend = svcs.$httpBackend,
//         $q = svcs.$q;

//       $httpBackend.expectGET("/comp_tpl.html").respond("-{{ $ctrl.data }}-");
//       $state.transitionTo("route2cmp");
//       await wait(10);
//       $httpBackend.flush();

//       const directiveEl = el[0].querySelector("div ui-view ng12-directive");
//       expect(directiveEl).toBeDefined();
//       expect($state.current.name).toBe("route2cmp");
//       expect(el.text()).toBe("-DATA!-");
//     });

//     if (angular.version.minor >= 5) {
//       it("should provide default bindings for any component bindings omitted in the state.bindings map", () => {
//         $stateProvider.state("route2cmp", {
//           url: "/route2cmp",
//           component: "ngComponent",
//           bindings: { data: "foo" },
//           resolve: {
//             foo: () => {
//               return "DATA!";
//             },
//             data2: () => {
//               return "DATA2!";
//             },
//           },
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $httpBackend
//           .expectGET("/comp_tpl.html")
//           .respond("-{{ $ctrl.data }}.{{ $ctrl.data2 }}-");
//         $state.transitionTo("route2cmp");
//         await wait(10);
//         $httpBackend.flush();

//         const directiveEl = el[0].querySelector("div ui-view ng-component");
//         expect(directiveEl).toBeDefined();
//         expect($state.current.name).toBe("route2cmp");
//         expect(el.text()).toBe("-DATA!.DATA2!-");
//       });
//     }
//   });

//   describe("componentProvider", () => {
//     it("should work with angular 1.2+ directives", () => {
//       $stateProvider.state("ng12-dynamic-directive", {
//         url: "/ng12dynamicDirective/:type",
//         componentProvider: [
//           "$stateParams",
//           function ($stateParams) {
//             return $stateParams.type;
//           },
//         ],
//       });

//       const $state = svcs.$state,
//         $q = svcs.$q;

//       $state.transitionTo("ng12-dynamic-directive", {
//         type: "ng12DynamicDirective",
//       });
//       await wait(10);

//       const directiveEl = el[0].querySelector(
//         "div ui-view ng12-dynamic-directive",
//       );
//       expect(directiveEl).toBeDefined();
//       expect($state.current.name).toBe("ng12-dynamic-directive");
//       expect(el.text()).toBe("dynamic directive");
//     });

//     if (angular.version.minor >= 5) {
//       it("should load correct component when using componentProvider", () => {
//         $stateProvider.state("dynamicComponent", {
//           url: "/dynamicComponent/:type",
//           componentProvider: [
//             "$stateParams",
//             function ($stateParams) {
//               return $stateParams.type;
//             },
//           ],
//         });

//         const $state = svcs.$state,
//           $httpBackend = svcs.$httpBackend,
//           $q = svcs.$q;

//         $state.transitionTo("dynamicComponent", { type: "dynamicComponent" });
//         await wait(10);

//         const directiveEl = el[0].querySelector(
//           "div ui-view dynamic-component",
//         );
//         expect(directiveEl).toBeDefined();
//         expect($state.current.name).toBe("dynamicComponent");
//         expect(el.text().trim()).toBe("dynamicComponent");
//       });
//     }
//   });

//   if (angular.version.minor >= 5) {
//     describe("uiOnParamsChanged()", () => {
//       let param;

//       beforeEach(inject(($rootScope, $compile) => {
//         param = null;

//         $stateProvider.state("dynamic", {
//           url: "/dynamic/:param",
//           component: "dynamicComponent",
//           params: { param: { dynamic: true } },
//         });

//         $stateProvider.state("dynamic2", {
//           url: "/dynamic2/:param",
//           componentProvider: () => "dynamicComponent",
//           params: { param: { dynamic: true } },
//         });
//       });

//       it("should not be called on the initial transition", () => {
//         const $state = svcs.$state,
//           $q = svcs.$q;
//         $state.go("dynamic", { param: "abc" });
//         await wait(10);
//         expect(el.text().trim()).toBe("dynamicComponent");
//       });

//       it("should be called when dynamic parameters change", () => {
//         const $state = svcs.$state,
//           $q = svcs.$q;
//         $state.go("dynamic", { param: "abc" });
//         await wait(10);
//         $state.go("dynamic", { param: "def" });
//         await wait(10);

//         expect(el.text().trim()).toBe("dynamicComponent def");
//       });

//       it("should work with componentProvider", () => {
//         const $state = svcs.$state,
//           $q = svcs.$q;
//         $state.go("dynamic2", { param: "abc" });
//         await wait(10);
//         $state.go("dynamic2", { param: "def" });
//         await wait(10);

//         expect(el.text().trim()).toBe("dynamicComponent def");
//       });
//     });
//   }
// });
