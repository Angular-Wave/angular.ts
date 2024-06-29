import { PubSub } from "../../src/core/pubsub";

describe("PubSub", function () {
  let pubsub;
  let asyncPubsub;

  beforeEach(function () {
    pubsub = new PubSub();
    asyncPubsub = new PubSub(true);
  });

  afterEach(function () {
    asyncPubsub.dispose();
    pubsub.dispose();
  });

  it("should create a PubSub instance", function () {
    expect(pubsub).not.toBeNull();
    expect(pubsub instanceof PubSub).toBe(true);
  });

  it("should dispose of the PubSub instance", function () {
    expect(pubsub.isDisposed()).toBe(false);
    pubsub.dispose();
    expect(pubsub.isDisposed()).toBe(true);
  });

  it("should subscribe and unsubscribe correctly", function () {
    function foo1() {}
    function bar1() {}
    function foo2() {}
    function bar2() {}

    expect(pubsub.getCount("foo")).toBe(0);
    expect(pubsub.getCount("bar")).toBe(0);

    pubsub.subscribe("foo", foo1);
    expect(pubsub.getCount("foo")).toBe(1);
    expect(pubsub.getCount("bar")).toBe(0);

    pubsub.subscribe("bar", bar1);
    expect(pubsub.getCount("foo")).toBe(1);
    expect(pubsub.getCount("bar")).toBe(1);

    pubsub.subscribe("foo", foo2);
    expect(pubsub.getCount("foo")).toBe(2);
    expect(pubsub.getCount("bar")).toBe(1);

    pubsub.subscribe("bar", bar2);
    expect(pubsub.getCount("foo")).toBe(2);
    expect(pubsub.getCount("bar")).toBe(2);

    expect(pubsub.unsubscribe("foo", foo1)).toBe(true);
    expect(pubsub.getCount("foo")).toBe(1);
    expect(pubsub.getCount("bar")).toBe(2);

    expect(pubsub.unsubscribe("foo", foo2)).toBe(true);
    expect(pubsub.getCount("foo")).toBe(0);
    expect(pubsub.getCount("bar")).toBe(2);

    expect(pubsub.unsubscribe("bar", bar1)).toBe(true);
    expect(pubsub.getCount("foo")).toBe(0);
    expect(pubsub.getCount("bar")).toBe(1);

    expect(pubsub.unsubscribe("bar", bar2)).toBe(true);
    expect(pubsub.getCount("foo")).toBe(0);
    expect(pubsub.getCount("bar")).toBe(0);

    expect(pubsub.unsubscribe("baz", foo1)).toBe(false);
    expect(pubsub.unsubscribe("foo", () => {})).toBe(false);
  });

  it("should subscribe and unsubscribe with context correctly", function () {
    function foo() {}
    function bar() {}

    const contextA = {};
    const contextB = {};

    expect(pubsub.getCount("X")).toBe(0);

    pubsub.subscribe("X", foo, contextA);
    expect(pubsub.getCount("X")).toBe(1);

    pubsub.subscribe("X", bar);
    expect(pubsub.getCount("X")).toBe(2);

    pubsub.subscribe("X", bar, contextB);
    expect(pubsub.getCount("X")).toBe(3);

    expect(pubsub.unsubscribe("X", foo, contextB)).toBe(false);

    expect(pubsub.unsubscribe("X", foo, contextA)).toBe(true);
    expect(pubsub.getCount("X")).toBe(2);

    expect(pubsub.unsubscribe("X", bar)).toBe(true);
    expect(pubsub.getCount("X")).toBe(1);

    expect(pubsub.unsubscribe("X", bar, contextB)).toBe(true);
    expect(pubsub.getCount("X")).toBe(0);
  });

  it("should subscribe once correctly", function () {
    let called;
    let context;

    called = false;
    pubsub.subscribeOnce("someTopic", () => {
      called = true;
    });
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(called).toBe(false);

    pubsub.publish("someTopic");
    expect(pubsub.getCount("someTopic")).toBe(0);
    expect(called).toBe(true);

    context = { called: false };
    pubsub.subscribeOnce(
      "someTopic",
      function () {
        this.called = true;
      },
      context,
    );
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(context.called).toBe(false);

    pubsub.publish("someTopic");
    expect(pubsub.getCount("someTopic")).toBe(0);
    expect(context.called).toBe(true);

    context = { called: false, value: 0 };
    pubsub.subscribeOnce(
      "someTopic",
      function (value) {
        this.called = true;
        this.value = value;
      },
      context,
    );
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(context.called).toBe(false);
    expect(context.value).toBe(0);

    pubsub.publish("someTopic", 17);
    expect(pubsub.getCount("someTopic")).toBe(0);
    expect(context.called).toBe(true);
    expect(context.value).toBe(17);
  });

  it("should async subscribe once correctly", function (done) {
    let callCount = 0;
    asyncPubsub.subscribeOnce("someTopic", () => {
      callCount++;
    });
    expect(asyncPubsub.getCount("someTopic")).toBe(1);

    asyncPubsub.publish("someTopic");
    asyncPubsub.publish("someTopic");

    setTimeout(() => {
      expect(asyncPubsub.getCount("someTopic")).toBe(0);
      expect(callCount).toBe(1);
      done();
    }, 0);
  });

  it("should async subscribe once with context correctly", function (done) {
    const context = { callCount: 0 };
    asyncPubsub.subscribeOnce(
      "someTopic",
      function () {
        this.callCount++;
      },
      context,
    );
    expect(asyncPubsub.getCount("someTopic")).toBe(1);

    asyncPubsub.publish("someTopic");
    asyncPubsub.publish("someTopic");

    setTimeout(() => {
      expect(asyncPubsub.getCount("someTopic")).toBe(0);
      expect(context.callCount).toBe(1);
      done();
    }, 0);
  });

  it("should async subscribe once with context and value correctly", function (done) {
    const context = { callCount: 0, value: 0 };
    asyncPubsub.subscribeOnce(
      "someTopic",
      function (value) {
        this.callCount++;
        this.value = value;
      },
      context,
    );
    expect(asyncPubsub.getCount("someTopic")).toBe(1);

    asyncPubsub.publish("someTopic", 17);
    asyncPubsub.publish("someTopic", 42);

    setTimeout(() => {
      expect(asyncPubsub.getCount("someTopic")).toBe(0);
      expect(context.callCount).toBe(1);
      expect(context.value).toBe(17);
      done();
    }, 0);
  });

  it("should subscribe once with bound function correctly", function () {
    const context = { called: false, value: 0 };

    function subscriber(value) {
      this.called = true;
      this.value = value;
    }

    pubsub.subscribeOnce("someTopic", subscriber.bind(context));
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(context.called).toBe(false);
    expect(context.value).toBe(0);

    pubsub.publish("someTopic", 17);
    expect(pubsub.getCount("someTopic")).toBe(0);
    expect(context.called).toBe(true);
    expect(context.value).toBe(17);
  });

  it("should subscribe once with partial function correctly", function () {
    let called = false;
    let value = 0;

    function subscriber(hasBeenCalled, newValue) {
      called = hasBeenCalled;
      value = newValue;
    }

    pubsub.subscribeOnce("someTopic", subscriber.bind(null, true));
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(called).toBe(false);
    expect(value).toBe(0);

    pubsub.publish("someTopic", 17);
    expect(pubsub.getCount("someTopic")).toBe(0);
    expect(called).toBe(true);
    expect(value).toBe(17);
  });

  it("should handle self resubscribe correctly", function () {
    let value = null;

    function resubscribe(iteration, newValue) {
      pubsub.subscribeOnce("someTopic", resubscribe.bind(null, iteration + 1));
      value = `${newValue}:${iteration}`;
    }

    pubsub.subscribeOnce("someTopic", resubscribe.bind(null, 0));
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(value).toBeNull();

    pubsub.publish("someTopic", "foo");
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(value).toBe("foo:0");

    pubsub.publish("someTopic", "bar");
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(value).toBe("bar:1");

    pubsub.publish("someTopic", "baz");
    expect(pubsub.getCount("someTopic")).toBe(1);
    expect(value).toBe("baz:2");
  });

  it("should handle async self resubscribe correctly", function (done) {
    let value = null;

    function resubscribe(iteration, newValue) {
      asyncPubsub.subscribeOnce(
        "someTopic",
        resubscribe.bind(null, iteration + 1),
      );
      value = `${newValue}:${iteration}`;
    }

    asyncPubsub.subscribeOnce("someTopic", resubscribe.bind(null, 0));
    expect(asyncPubsub.getCount("someTopic")).toBe(1);
    expect(value).toBeNull();

    asyncPubsub.publish("someTopic", "foo");

    setTimeout(() => {
      expect(asyncPubsub.getCount("someTopic")).toBe(1);
      expect(value).toBe("foo:0");

      asyncPubsub.publish("someTopic", "bar");

      setTimeout(() => {
        expect(asyncPubsub.getCount("someTopic")).toBe(1);
        expect(value).toBe("bar:1");

        asyncPubsub.publish("someTopic", "baz");

        setTimeout(() => {
          expect(asyncPubsub.getCount("someTopic")).toBe(1);
          expect(value).toBe("baz:2");
          done();
        }, 0);
      }, 0);
    }, 0);
  });
});
