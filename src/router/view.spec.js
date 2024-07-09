import { dealoc, jqLite } from "../../jqLite";
import { Angular } from "../../loader";
import { publishExternalAPI } from "../../public";
import { curry } from "../../shared/hof";
import { StateMatcher } from "../../router/state/state-matcher";
import { StateBuilder } from "../../router/state/state-builder";
import { StateObject } from "../../router/state/state-object";
import { ViewService } from "../../router/view/view";
import {
  ng1ViewsBuilder,
  getNg1ViewConfigFactory,
} from "../../router/state/views";
import { PathNode } from "../../router/path/path-node";
import { PathUtils } from "../../router/path/path-utils";
import { tail } from "../../shared/common";
import { wait } from "../test-utils";

describe("view", () => {
  let scope,
    $compile,
    $injector,
    elem,
    $controllerProvider,
    $urlServiceProvider,
    $view,
    $q;
  let root, states;

  beforeEach(() => {
    dealoc(document.getElementById("dummy"));
    window.angular = new Angular();
    publishExternalAPI();

    window.angular
      .module("defaultModule", ["ng.router"])
      .config(
        function (_$provide_, _$controllerProvider_, _$urlServiceProvider_) {
          _$provide_.factory("foo", () => {
            return "Foo";
          });
          $controllerProvider = _$controllerProvider_;
          $urlServiceProvider = _$urlServiceProvider_;
        },
      );
    $injector = window.angular.bootstrap(document.getElementById("dummy"), [
      "defaultModule",
    ]);

    $injector.invoke(($rootScope, _$compile_, _$injector_, _$view_, _$q_) => {
      scope = $rootScope.$new();
      $compile = _$compile_;
      $injector = _$injector_;
      elem = angular.element("<div>");

      states = {};
      const matcher = new StateMatcher(states);
      const stateBuilder = new StateBuilder(matcher, $urlServiceProvider);
      stateBuilder.builder("views", ng1ViewsBuilder);
      register = registerState(states, stateBuilder);
      root = register({ name: "" });
      $q = _$q_;
      $view = _$view_;
    });
  });

  let register;
  const registerState = curry(function (_states, stateBuilder, config) {
    const state = StateObject.create(config);
    const built = stateBuilder.build(state);
    return (_states[built.name] = built);
  });

  describe("controller handling", () => {
    let state, path, ctrlExpression;
    beforeEach(() => {
      ctrlExpression = null;
      const stateDeclaration = {
        name: "foo",
        template: "test",
        controllerProvider: [
          "foo",
          function (/* $stateParams, */ foo) {
            // todo: reimplement localized $stateParams
            ctrlExpression =
              /* $stateParams.type + */ foo + "Controller as foo";
            return ctrlExpression;
          },
        ],
      };

      state = register(stateDeclaration);
      const $view = new ViewService(null);
      $view._pluginapi._viewConfigFactory("ng1", getNg1ViewConfigFactory());

      const _states = [root, state];
      path = _states.map((_state) => new PathNode(_state));
      PathUtils.applyViewConfigs($view, path, _states);
    });

    it("uses the controllerProvider to get controller dynamically", async () => {
      $controllerProvider.register("AcmeFooController", () => {});
      elem.append($compile("<div><ng-view></ng-view></div>")(scope));

      const view = tail(path).views[0];
      view.load();
      await wait(100);
      expect(ctrlExpression).toEqual("FooController as foo");
    });
  });
});
