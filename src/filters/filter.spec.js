import { Angular } from "../loader.js";
import { createInjector } from "../core/di/injector.js";
import { isString, includes } from "../shared/utils.js";
import { createElementFromHTML } from "../shared/dom.js";

describe("Filter: filter", () => {
  let filter;

  beforeEach(() => {
    window.angular = new Angular();
    window.angular.module("myModule", ["ng"]);
    const injector = createInjector(["myModule"]);
    filter = injector.get("$filter")("filter");
  });

  it("should filter by string", () => {
    const items = ["MIsKO", { name: "shyam" }, ["adam"], 1234];
    expect(filter(items, "").length).toBe(4);
    expect(filter(items, undefined).length).toBe(4);

    expect(filter(items, "iSk").length).toBe(1);
    expect(filter(items, "isk")[0]).toBe("MIsKO");

    expect(filter(items, "yam").length).toBe(1);
    expect(filter(items, "yam")[0]).toEqual(items[1]);

    expect(filter(items, "da").length).toBe(1);
    expect(filter(items, "da")[0]).toEqual(items[2]);

    expect(filter(items, "34").length).toBe(1);
    expect(filter(items, "34")[0]).toBe(1234);

    expect(filter(items, "I don't exist").length).toBe(0);
  });

  it("should not read $ properties", () => {
    expect("".charAt(0)).toBe(""); // assumption

    const items = [{ $name: "misko" }];
    expect(filter(items, "misko").length).toBe(0);
  });

  it("should filter on specific property", () => {
    const items = [
      { ignore: "a", name: "a" },
      { ignore: "a", name: "abc" },
    ];
    expect(filter(items, {}).length).toBe(2);

    expect(filter(items, { name: "a" }).length).toBe(2);

    expect(filter(items, { name: "b" }).length).toBe(1);
    expect(filter(items, { name: "b" })[0].name).toBe("abc");
  });

  it("should ignore undefined properties of the expression object", () => {
    let items = [{ name: "a" }, { name: "abc" }];
    expect(filter(items, { name: undefined })).toEqual([
      { name: "a" },
      { name: "abc" },
    ]);

    items = [
      { first: "misko" },
      { deep: { first: "misko" } },
      { deep: { last: "hevery" } },
    ];
    expect(filter(items, { deep: { first: undefined } })).toEqual([
      { deep: { first: "misko" } },
      { deep: { last: "hevery" } },
    ]);
  });

  it("should take function as predicate", () => {
    const items = [{ name: "a" }, { name: "abc", done: true }];
    expect(filter(items, (i) => i.done).length).toBe(1);
  });

  it("should pass the index to a function predicate", () => {
    const items = [0, 1, 2, 3];

    const result = filter(items, (value, index) => index % 2 === 0);

    expect(result).toEqual([0, 2]);
  });

  it("should match primitive array values against top-level `$` property in object expression", () => {
    let items;
    let expr;

    items = ["something", "something else", "another thing"];
    expr = { $: "some" };
    expect(filter(items, expr).length).toBe(2);
    expect(filter(items, expr)).toEqual([items[0], items[1]]);

    items = [
      { val: "something" },
      { val: "something else" },
      { val: "another thing" },
    ];
    expr = { $: "some" };
    expect(filter(items, expr).length).toBe(2);
    expect(filter(items, expr)).toEqual([items[0], items[1]]);

    items = [123, 456, 789];
    expr = { $: 1 };
    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)).toEqual([items[0]]);

    items = [true, false, "true"];
    expr = { $: true, ignored: "false" };
    expect(filter(items, expr).length).toBe(2);
    expect(filter(items, expr)).toEqual([items[0], items[2]]);
  });

  it("should match items with array properties containing one or more matching items", () => {
    let items;
    let expr;

    items = [
      { tags: ["web", "html", "css", "js"] },
      { tags: ["hybrid", "html", "css", "js", "ios", "android"] },
      { tags: ["mobile", "ios", "android"] },
    ];
    expr = { tags: "html" };
    expect(filter(items, expr).length).toBe(2);
    expect(filter(items, expr)).toEqual([items[0], items[1]]);

    items = [
      { nums: [1, 345, 12] },
      { nums: [0, 46, 78] },
      { nums: [123, 4, 67] },
    ];
    expr = { nums: 12 };
    expect(filter(items, expr).length).toBe(2);
    expect(filter(items, expr)).toEqual([items[0], items[2]]);

    items = [
      { customers: [{ name: "John" }, { name: "Elena" }, { name: "Bill" }] },
      { customers: [{ name: "Sam" }, { name: "Klara" }, { name: "Bill" }] },
      { customers: [{ name: "Molli" }, { name: "Elena" }, { name: "Lora" }] },
    ];
    expr = { customers: { name: "Bill" } };
    expect(filter(items, expr).length).toBe(2);
    expect(filter(items, expr)).toEqual([items[0], items[1]]);
  });

  it("should take object as predicate", () => {
    const items = [
      { first: "misko", last: "hevery" },
      { first: "adam", last: "abrons" },
    ];

    expect(filter(items, { first: "", last: "" }).length).toBe(2);
    expect(filter(items, { first: "", last: "hevery" }).length).toBe(1);
    expect(filter(items, { first: "adam", last: "hevery" }).length).toBe(0);
    expect(filter(items, { first: "misko", last: "hevery" }).length).toBe(1);
    expect(filter(items, { first: "misko", last: "hevery" })[0]).toEqual(
      items[0],
    );
  });

  it("should support predicate object with dots in the name", () => {
    const items = [
      { "first.name": "misko", "last.name": "hevery" },
      { "first.name": "adam", "last.name": "abrons" },
    ];

    expect(filter(items, { "first.name": "", "last.name": "" }).length).toBe(2);
    expect(filter(items, { "first.name": "misko", "last.name": "" })).toEqual([
      items[0],
    ]);
  });

  it("should support deep predicate objects", () => {
    const items = [
      { person: { name: "John" } },
      { person: { name: "Rita" } },
      { person: { name: "Billy" } },
      { person: { name: "Joan" } },
    ];
    expect(filter(items, { person: { name: "Jo" } }).length).toBe(2);
    expect(filter(items, { person: { name: "Jo" } })).toEqual([
      { person: { name: "John" } },
      { person: { name: "Joan" } },
    ]);
  });

  it("should support deep expression objects with multiple properties", () => {
    const items = [
      { person: { name: "Annet", email: "annet@example.com" } },
      { person: { name: "Billy", email: "me@billy.com" } },
      { person: { name: "Joan", email: "joan@example.net" } },
      { person: { name: "John", email: "john@example.com" } },
      { person: { name: "Rita", email: "rita@example.com" } },
    ];
    const expr = { person: { name: "Jo", email: "!example.com" } };

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)).toEqual([items[2]]);
  });

  it('should match any properties for given "$" property', () => {
    const items = [
      { first: "tom", last: "hevery" },
      { first: "adam", last: "hevery", alias: "tom", done: false },
      { first: "john", last: "clark", middle: "tommy" },
    ];
    expect(filter(items, { $: "tom" }).length).toBe(3);
    expect(filter(items, { $: "a" }).length).toBe(2);
    expect(filter(items, { $: false }).length).toBe(1);
    expect(filter(items, { $: 10 }).length).toBe(0);
    expect(filter(items, { $: "hevery" })[0]).toEqual(items[0]);
  });

  it('should allow specifying the special "match-all" property', () => {
    const items = [{ foo: "baz" }, { bar: "baz" }, { "%": "no dollar" }];

    expect(filter(items, { $: "baz" }).length).toBe(2);
    expect(filter(items, { $: "baz" }, null, "%").length).toBe(0);

    expect(filter(items, { "%": "dollar" }).length).toBe(1);
    expect(filter(items, { $: "dollar" }).length).toBe(1);
    expect(filter(items, { $: "dollar" }, null, "%").length).toBe(0);

    expect(filter(items, { "%": "baz" }).length).toBe(0);
    expect(filter(items, { "%": "baz" }, null, "%").length).toBe(2);
  });

  it('should match any properties in the nested object for given deep "$" property', () => {
    const items = [
      { person: { name: "Annet", email: "annet@example.com" } },
      { person: { name: "Billy", email: "me@billy.com" } },
      { person: { name: "Joan", email: "joan@example.net" } },
      { person: { name: "John", email: "john@example.com" } },
      { person: { name: "Rita", email: "rita@example.com" } },
    ];
    const expr = { person: { $: "net" } };

    expect(filter(items, expr).length).toBe(2);
    expect(filter(items, expr)).toEqual([items[0], items[2]]);
  });

  it("should match named properties only against named properties on the same level", () => {
    const expr = { person: { name: "John" } };
    const items = [
      { person: "John" }, // No match (1 level higher)
      { person: { name: "John" } }, // Match (same level)
      { person: { name: { first: "John", last: "Doe" } } },
    ]; // No match (1 level deeper)

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)).toEqual([items[1]]);
  });

  it('should match any properties on same or deeper level for given "$" property', () => {
    const items = [
      { level1: "test", foo1: "bar1" },
      { level1: { level2: "test", foo2: "bar2" }, foo1: "bar1" },
      {
        level1: { level2: { level3: "test", foo3: "bar3" }, foo2: "bar2" },
        foo1: "bar1",
      },
    ];

    expect(filter(items, { $: "ES" }).length).toBe(3);
    expect(filter(items, { $: "ES" })).toEqual([items[0], items[1], items[2]]);

    expect(filter(items, { level1: { $: "ES" } }).length).toBe(2);
    expect(filter(items, { level1: { $: "ES" } })).toEqual([
      items[1],
      items[2],
    ]);

    expect(filter(items, { level1: { level2: { $: "ES" } } }).length).toBe(1);
    expect(filter(items, { level1: { level2: { $: "ES" } } })).toEqual([
      items[2],
    ]);
  });

  it('should respect the nesting level of "$"', () => {
    const items = [
      {
        supervisor: "me",
        person: { name: "Annet", email: "annet@example.com" },
      },
      { supervisor: "me", person: { name: "Billy", email: "me@billy.com" } },
      { supervisor: "me", person: { name: "Joan", email: "joan@example.net" } },
      { supervisor: "me", person: { name: "John", email: "john@example.com" } },
      { supervisor: "me", person: { name: "Rita", email: "rita@example.com" } },
    ];
    const expr = { $: { $: "me" } };

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)).toEqual([items[1]]);
  });

  it("should support boolean properties", () => {
    const items = [
      { name: "tom", current: true },
      { name: "demi", current: false },
      { name: "sofia" },
    ];

    expect(filter(items, { current: true }).length).toBe(1);
    expect(filter(items, { current: true })[0].name).toBe("tom");
    expect(filter(items, { current: false }).length).toBe(1);
    expect(filter(items, { current: false })[0].name).toBe("demi");
  });

  it("should support negation operator", () => {
    const items = ["misko", "adam"];

    expect(filter(items, "!isk").length).toBe(1);
    expect(filter(items, "!isk")[0]).toEqual(items[1]);
  });

  it("should ignore function properties in items", () => {
    // Own function properties
    let items = [
      { text: "hello", func: () => {} },
      { text: "goodbye" },
      { text: "kittens" },
      { text: "puppies" },
    ];
    const expr = { text: "hello" };

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)[0]).toBe(items[0]);
    expect(filter(items, expr, true).length).toBe(1);
    expect(filter(items, expr, true)[0]).toBe(items[0]);

    // Inherited function properties
    class Item {
      constructor(text) {
        this.text = text;
      }
      func() {}
    }

    items = [
      new Item("hello"),
      new Item("goodbye"),
      new Item("kittens"),
      new Item("puppies"),
    ];

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)[0]).toBe(items[0]);
    expect(filter(items, expr, true).length).toBe(1);
    expect(filter(items, expr, true)[0]).toBe(items[0]);
  });

  it("should ignore function properties in expression", () => {
    // Own function properties
    const items = [
      { text: "hello" },
      { text: "goodbye" },
      { text: "kittens" },
      { text: "puppies" },
    ];
    let expr = { text: "hello", func: () => {} };

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)[0]).toBe(items[0]);
    expect(filter(items, expr, true).length).toBe(1);
    expect(filter(items, expr, true)[0]).toBe(items[0]);

    // Inherited function properties
    class Expr {
      constructor(text) {
        this.text = text;
      }
      func() {}
    }

    expr = new Expr("hello");

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)[0]).toBe(items[0]);
    expect(filter(items, expr, true).length).toBe(1);
    expect(filter(items, expr, true)[0]).toBe(items[0]);
  });

  it("should consider inherited properties in items", () => {
    class Item {
      constructor(text) {
        this.text = text;
      }
    }
    Item.prototype.doubleL = "maybe";

    const items = [
      new Item("hello"),
      new Item("goodbye"),
      new Item("kittens"),
      new Item("puppies"),
    ];
    let expr = { text: "hello", doubleL: "perhaps" };

    expect(filter(items, expr).length).toBe(0);
    expect(filter(items, expr, true).length).toBe(0);

    expr = { text: "hello", doubleL: "maybe" };

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)[0]).toBe(items[0]);
    expect(filter(items, expr, true).length).toBe(1);
    expect(filter(items, expr, true)[0]).toBe(items[0]);
  });

  it("should consider inherited properties in expression", () => {
    class Expr {
      constructor(text) {
        this.text = text;
      }
    }
    Expr.prototype.doubleL = true;

    const items = [
      { text: "hello", doubleL: true },
      { text: "goodbye" },
      { text: "kittens" },
      { text: "puppies" },
    ];
    let expr = new Expr("e");

    expect(filter(items, expr).length).toBe(1);
    expect(filter(items, expr)[0]).toBe(items[0]);

    expr = new Expr("hello");

    expect(filter(items, expr, true).length).toBe(1);
    expect(filter(items, expr)[0]).toBe(items[0]);
  });

  it("should not be affected by `Object.prototype` when using a string expression", () => {
    Object.prototype.someProp = "oo";

    const items = [
      Object.create(null),
      Object.create(null),
      Object.create(null),
      Object.create(null),
    ];
    items[0].someProp = "hello";
    items[1].someProp = "goodbye";
    items[2].someProp = "kittens";
    items[3].someProp = "puppies";

    // Affected by `Object.prototype`
    expect(filter(items, {}).length).toBe(1);
    expect(filter(items, {})[0]).toBe(items[1]);

    expect(filter(items, { $: "ll" }).length).toBe(0);

    // Not affected by `Object.prototype`
    expect(filter(items, "ll").length).toBe(1);
    expect(filter(items, "ll")[0]).toBe(items[0]);

    delete Object.prototype.someProp;
  });

  it("should throw an error when is not used with an array", () => {
    let item = { not: "array" };
    expect(() => {
      filter(item, {});
    }).toThrowError(/notarray/);

    item = Object.create(null);
    expect(() => {
      filter(item, {});
    }).toThrowError(/notarray/);

    item = {
      toString: null,
      valueOf: null,
    };
    expect(() => {
      filter(item, {});
    }).toThrowError(/notarray/);
  });

  it("should not throw an error if used with an array like object", () => {
    function getArguments() {
      return arguments;
    }
    const argsObj = getArguments(
      { name: "Misko" },
      { name: "Igor" },
      { name: "Brad" },
    );

    const nodeList = createElementFromHTML(
      "<p><span>Misko</span><span>Igor</span><span>Brad</span></p>",
    ).childNodes;
    function nodeFilterPredicate(node) {
      return node.innerHTML.indexOf("I") !== -1;
    }

    expect(filter(argsObj, "i").length).toBe(2);
    expect(filter("abc", "b").length).toBe(1);
    expect(filter(nodeList, nodeFilterPredicate).length).toBe(1);
  });

  it("should return undefined when the array is undefined", () => {
    expect(filter(undefined, {})).toBeUndefined();
  });

  it("should return null when the value of the array is null", () => {
    const item = null;
    expect(filter(item, {})).toBe(null);
  });

  it("should not throw an error if property is null when comparing object", () => {
    const items = [
      { office: 1, people: { name: "john" } },
      { office: 2, people: { name: "jane" } },
      { office: 3, people: null },
    ];
    let f = {};
    expect(filter(items, f).length).toBe(3);

    f = { people: null };
    expect(filter(items, f).length).toBe(1);

    f = { people: {} };
    expect(filter(items, f).length).toBe(2);

    f = { people: { name: "" } };
    expect(filter(items, f).length).toBe(2);

    f = { people: { name: "john" } };
    expect(filter(items, f).length).toBe(1);

    f = { people: { name: "j" } };
    expect(filter(items, f).length).toBe(2);
  });

  it("should match `null` against `null` only", () => {
    const items = [
      { value: null },
      { value: undefined },
      { value: true },
      { value: false },
      { value: NaN },
      { value: 42 },
      { value: "null" },
      { value: "test" },
      { value: {} },
      { value: new Date() },
    ];
    let flt;

    flt = null;
    expect(filter(items, flt).length).toBe(1);
    expect(filter(items, flt)[0]).toBe(items[0]);

    flt = { value: null };
    expect(filter(items, flt).length).toBe(1);
    expect(filter(items, flt)[0]).toBe(items[0]);

    flt = { value: undefined };
    expect(filter(items, flt).length).toBe(items.length);

    flt = { value: NaN };
    expect(includes(filter(items, flt), items[0])).toBeFalsy();

    flt = { value: false };
    expect(includes(filter(items, flt), items[0])).toBeFalsy();

    flt = "";
    expect(includes(filter(items, flt), items[0])).toBeFalsy();

    flt = { value: "null" };
    expect(includes(filter(items, flt), items[0])).toBeFalsy();
  });

  describe("should support comparator", () => {
    it("not convert `null` or `undefined` to string in non-strict comparison", () => {
      const items = [{ value: null }, { value: undefined }];
      const flt = { value: "u" };

      expect(filter(items, flt).length).toBe(0);
    });

    it("not consider objects without a custom `toString` in non-strict comparison", () => {
      const items = [{ test: {} }];
      const expr = "[object";
      expect(filter(items, expr).length).toBe(0);
    });

    it("should consider objects with custom `toString()` in non-strict comparison", () => {
      let obj = new Date(1970, 1);
      let items = [{ test: obj }];
      expect(filter(items, "1970").length).toBe(1);
      expect(filter(items, 1970).length).toBe(1);

      obj = {
        toString() {
          return "custom";
        },
      };
      items = [{ test: obj }];
      expect(filter(items, "custom").length).toBe(1);
    });

    it("should cope with objects that have no `toString()` in non-strict comparison", () => {
      const obj = Object.create(null);
      const items = [{ test: obj }];
      expect(() => {
        filter(items, "foo");
      }).not.toThrow();
      expect(filter(items, "foo").length).toBe(0);
    });

    it("should cope with objects where `toString` is not a function in non-strict comparison", () => {
      const obj = {
        toString: "moo",
      };
      const items = [{ test: obj }];
      expect(() => {
        filter(items, "foo");
      }).not.toThrow();
      expect(filter(items, "foo").length).toBe(0);
    });

    it("as equality when true", () => {
      let items = ["misko", "adam", "adamson"];
      let expr = "adam";
      expect(filter(items, expr, true)).toEqual([items[1]]);
      expect(filter(items, expr, false)).toEqual([items[1], items[2]]);

      items = [
        { key: "value1", nonkey: 1 },
        { key: "value2", nonkey: 2 },
        { key: "value12", nonkey: 3 },
        { key: "value1", nonkey: 4 },
        { key: "Value1", nonkey: 5 },
      ];
      expr = { key: "value1" };
      expect(filter(items, expr, true)).toEqual([items[0], items[3]]);

      items = [
        { key: 1, nonkey: 1 },
        { key: 2, nonkey: 2 },
        { key: 12, nonkey: 3 },
        { key: 1, nonkey: 4 },
      ];
      expr = { key: 1 };
      expect(filter(items, expr, true)).toEqual([items[0], items[3]]);

      expr = 12;
      expect(filter(items, expr, true)).toEqual([items[2]]);
    });

    it("and use the function given to compare values", () => {
      const items = [
        { key: 1, nonkey: 1 },
        { key: 2, nonkey: 2 },
        { key: 12, nonkey: 3 },
        { key: 1, nonkey: 14 },
      ];
      let expr = { key: 10 };
      const comparator = function (obj, value) {
        return obj > value;
      };
      expect(filter(items, expr, comparator)).toEqual([items[2]]);

      expr = 10;
      expect(filter(items, expr, comparator)).toEqual([items[2], items[3]]);
    });

    it("and use it correctly with deep expression objects", () => {
      const items = [
        { id: 0, details: { email: "admin@example.com", role: "admin" } },
        { id: 1, details: { email: "user1@example.com", role: "user" } },
        { id: 2, details: { email: "user2@example.com", role: "user" } },
      ];
      let expr;
      let comp;

      expr = { details: { email: "user@example.com", role: "adm" } };
      expect(filter(items, expr)).toEqual([]);

      expr = { details: { email: "admin@example.com", role: "adm" } };
      expect(filter(items, expr)).toEqual([items[0]]);

      expr = { details: { email: "admin@example.com", role: "adm" } };
      expect(filter(items, expr, true)).toEqual([]);

      expr = { details: { email: "admin@example.com", role: "admin" } };
      expect(filter(items, expr, true)).toEqual([items[0]]);

      expr = { details: { email: "user", role: "us" } };
      expect(filter(items, expr)).toEqual([items[1], items[2]]);

      expr = { id: 0, details: { email: "user", role: "us" } };
      expect(filter(items, expr)).toEqual([]);

      expr = { id: 1, details: { email: "user", role: "us" } };
      expect(filter(items, expr)).toEqual([items[1]]);

      comp = function (actual, expected) {
        return (
          isString(actual) &&
          isString(expected) &&
          actual.indexOf(expected) === 0
        );
      };

      expr = { details: { email: "admin@example.com", role: "min" } };
      expect(filter(items, expr, comp)).toEqual([]);

      expr = { details: { email: "admin@example.com", role: "adm" } };
      expect(filter(items, expr, comp)).toEqual([items[0]]);
    });
  });
});
