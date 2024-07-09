import { defaults, filter, map, mapObj, pick } from "../../src/shared/common";
import { is, eq, not, pattern, val } from "../../src/shared/hof";
import { isInjectable } from "../../src/shared/predicates";
import { Queue } from "../../src/router/common/queue";

describe("common", function () {
  describe("filter", function () {
    it("should filter arrays", function () {
      const input = [1, 2, 3, 4, 5];
      const filtered = filter(input, function (int) {
        return int > 2;
      });
      expect(filtered.length).toBe(3);
      expect(filtered).toEqual([3, 4, 5]);
    });

    it("should properly compact arrays", function () {
      expect(
        filter([0, 1, 0, 2, 0, 3, 4], function (v) {
          return !!v;
        }),
      ).toEqual([1, 2, 3, 4]);
    });

    it("should filter objects", function () {
      const input = { foo: 1, bar: 2, baz: 3, qux: 4 };
      const filtered = filter(input, function (value, _key) {
        return value > 2;
      });
      expect(Object.keys(filtered).length).toBe(2);
      expect(filtered).toEqual({ baz: 3, qux: 4 });
    });
  });

  describe("defaults", function () {
    it("should do left-associative object merge", function () {
      const options = { param1: "new val" };
      const result = defaults(options, {
        param1: "default val",
        param2: "default val 2",
      });
      expect(result).toEqual({ param1: "new val", param2: "default val 2" });
    });

    it("should whitelist keys present in default values", function () {
      const options = { param1: 1, param2: 2, param3: 3 };
      const result = defaults(options, {
        param1: 0,
        param2: 0,
      });
      expect(result).toEqual({ param1: 1, param2: 2 });
    });

    it("should return an object when passed an empty value", function () {
      const vals = { param1: 0, param2: 0 };
      expect(defaults(null, vals)).toEqual(vals);
      expect(defaults(undefined, vals)).toEqual(vals);
    });
  });

  describe("not", function () {
    it("should allow double-negatives", function () {
      function T() {
        return true;
      }
      function F() {
        return false;
      }
      function empty() {
        return "";
      }

      expect(not(not(T))()).toBe(true);
      expect(not(not(F))()).toBe(false);
      expect(not(not(empty))()).toBe(false);
    });
  });

  describe("val", function () {
    it("should return identity", function () {
      const f = function () {},
        foo = {};
      expect(val(f)()).toBe(f);
      expect(val(foo)()).toBe(foo);
      expect(val(true)()).toBe(true);
      expect(val(false)()).toBe(false);
      expect(val(null)()).toBe(null);
    });
  });

  describe("pattern", function () {
    it("should return the result of a paired function when a condition function returns true", function () {
      const typeChecker = pattern([
        [is(Number), val("number!")],
        [is(String), val("string!")],
        [is(Boolean), val("boolean!")],
        [eq(null), val("null!")],
      ]);

      expect(typeChecker(1)).toBe("number!");
      expect(typeChecker("foo!")).toBe("string!");
      expect(typeChecker(true)).toBe("boolean!");
      expect(typeChecker(false)).toBe("boolean!");
      expect(typeChecker(null)).toBe("null!");
      expect(typeChecker(undefined)).toBe(undefined);
    });
  });

  describe("isInjectable", function () {
    it("should accept functions", function () {
      function fn() {}
      expect(isInjectable(fn)).toBeTruthy();
    });

    it("should accept functions with parameters", function () {
      function fn(_foo, _bar) {}
      expect(isInjectable(fn)).toBeTruthy();
    });

    it("should accept ng1 annotated functions", function () {
      fn["$inject"] = ["foo", "bar"];
      function fn(_foo, _bar) {}
      expect(isInjectable(fn)).toBeTruthy();
    });

    it("should accept ng1 array notation", function () {
      const fn = ["foo", "bar", function (_foo, _bar) {}];
      expect(isInjectable(fn)).toBeTruthy();
    });
  });

  describe("pick", () => {
    it("should pick inherited properties", () => {
      const parent = { foo: "foo", bar: "bar" };
      const child = Object.create(parent);
      expect(pick(child, ["foo"])).toEqual({ foo: "foo" });
    });

    it("should not pick missing properties", () => {
      const obj = { foo: "foo", bar: "bar" };
      expect(pick(obj, ["baz"])).toEqual({});
    });
  });

  describe("map", () => {
    it("should map arrays", () => {
      const src = [1, 2, 3, 4];
      const dest = map(src, (x) => x * 2);

      expect(src).toEqual([1, 2, 3, 4]);
      expect(dest).toEqual([2, 4, 6, 8]);
    });

    it("should map arrays in place when target === src", () => {
      const src = [1, 2, 3, 4];
      const dest = map(src, (x) => x * 2, src);

      expect(src).toEqual([2, 4, 6, 8]);
      expect(dest).toEqual([2, 4, 6, 8]);
    });
  });

  describe("mapObj", () => {
    it("should map objects", () => {
      const src = { foo: 1, bar: 2, baz: 3 };
      const dest = mapObj(src, (x) => x * 2);

      expect(src).toEqual({ foo: 1, bar: 2, baz: 3 });
      expect(dest).toEqual({ foo: 2, bar: 4, baz: 6 });
    });

    it("should map objects in place when target === src", () => {
      const src = { foo: 1, bar: 2, baz: 3 };
      const dest = mapObj(src, (x) => x * 2, src);

      expect(src).toEqual({ foo: 2, bar: 4, baz: 6 });
      expect(dest).toEqual({ foo: 2, bar: 4, baz: 6 });
    });
  });

  describe("Queue", () => {
    it("peekTail() should show the last enqueued item", () => {
      const q = new Queue();
      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      expect(q.size()).toBe(3);
      expect(q.peekTail()).toBe(3);
    });

    it("peekHead() should show the first enqueued item", () => {
      const q = new Queue();
      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      expect(q.size()).toBe(3);
      expect(q.peekHead()).toBe(1);
    });

    it("should support a limit (max number of items)", () => {
      const q = new Queue([], 2);
      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      expect(q.size()).toBe(2);
      expect(q.peekHead()).toBe(2);
      expect(q.peekTail()).toBe(3);
    });

    it("clear() should remove all items", () => {
      const q = new Queue([], 2);
      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      expect(q.size()).toBe(2);

      q.clear();
      expect(q.size()).toBe(0);
    });

    it("enqueue() should evict from the head when max length is reached", () => {
      const q = new Queue([], 3);
      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      expect(q.size()).toBe(3);

      q.enqueue(4);
      expect(q.size()).toBe(3);

      const a = q.dequeue();
      const b = q.dequeue();
      const c = q.dequeue();

      expect(q.size()).toBe(0);
      expect([a, b, c]).toEqual([2, 3, 4]);
    });

    it("onEvict() handlers should be called when an item is evicted", () => {
      const log = [];
      const q = new Queue([], 2);

      q.onEvict((item) => log.push(item));

      q.enqueue(1);
      expect(q.size()).toBe(1);
      expect(log).toEqual([]);

      q.enqueue(2);
      expect(q.size()).toBe(2);
      expect(log).toEqual([]);

      q.enqueue(3);
      expect(q.size()).toBe(2);
      expect(log).toEqual([1]);

      q.enqueue(4);
      expect(q.size()).toBe(2);
      expect(log).toEqual([1, 2]);
    });

    it("onEvict() should support multiple handlers", () => {
      const log = [];
      const log2 = [];
      const q = new Queue([], 2);

      q.onEvict((item) => log.push(item));
      q.onEvict((item) => log2.push(item));

      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      expect(q.size()).toBe(2);
      expect(log).toEqual([1]);
      expect(log2).toEqual([1]);

      q.enqueue(4);
      expect(q.size()).toBe(2);
      expect(log).toEqual([1, 2]);
      expect(log2).toEqual([1, 2]);
    });
  });
});
