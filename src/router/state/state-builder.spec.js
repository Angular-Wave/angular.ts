import { StateBuilder } from "./state-builder.js";

// TODO refactor this to url service as it is using the provider right now
xdescribe("StateBuilder", function () {
  const parent = { name: "" };
  let builder,
    matcher,
    urlMatcherFactoryProvider = {
      compile: function () {},
      isMatcher: function () {},
    };

  beforeEach(function () {
    matcher = new StateBuilder({});
    builder = new StateBuilder(matcher, urlMatcherFactoryProvider);
    builder.builder("views", ng1ViewsBuilder);
  });

  xit("should use the state object to build a default view, when no `views` property is found", function () {
    const config = {
      url: "/foo",
      templateUrl: "/foo.html",
      controller: "FooController",
      parent: parent,
    };
    const built = builder.builder("views")(config);

    expect(built.$default).not.toEqual(config);
    expect(built.$default).toEqual(
      expect.objectContaining({
        templateUrl: "/foo.html",
        controller: "FooController",
        resolveAs: "$resolve",
      }),
    );
  });

  xit("It should use the views object to build views, when defined", function () {
    const config = { a: { foo: "bar", controller: "FooController" } };
    const builtViews = builder.builder("views")({
      parent: parent,
      views: config,
    });
    expect(builtViews.a.foo).toEqual(config.a.foo);
    expect(builtViews.a.controller).toEqual(config.a.controller);
  });

  xit("should not allow a view config with both component and template keys", function () {
    const config = {
      name: "foo",
      url: "/foo",
      template: "<h1>hey</h1>",
      controller: "FooController",
      parent: parent,
    };
    expect(() => builder.builder("views")(config)).not.toThrow();
    expect(() =>
      builder.builder("views")(
        Object.assign({ component: "fooComponent" }, config),
      ),
    ).toThrow();
    expect(() =>
      builder.builder("views")(
        Object.assign({ componentProvider: () => "fooComponent" }, config),
      ),
    ).toThrow();
    expect(() =>
      builder.builder("views")(Object.assign({ bindings: {} }, config)),
    ).toThrow();
  });

  xit("should replace a resolve: string value with a function that injects the service of the same name", function () {
    const config = { resolve: { foo: "bar" } };
    expect(builder.builder("resolvables")).toBeDefined();
    const built = builder.builder("resolvables")(config);
    expect(built[0].deps).toEqual(["bar"]);
  });
});
