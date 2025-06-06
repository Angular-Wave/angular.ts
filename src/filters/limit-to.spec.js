import { Angular } from "../loader.js";
import { createInjector } from "../core/di/injector.js";
import { createElementFromHTML } from "../shared/dom.js";

describe("Filter: limitTo", () => {
  let items;
  let str;
  let number;
  let arrayLike;
  let limitTo;

  beforeEach(() => {
    window.angular = new Angular();
    window.angular.module("myModule", ["ng"]);
    const injector = createInjector(["myModule"]);
    const $filter = injector.get("$filter");

    items = ["a", "b", "c", "d", "e", "f", "g", "h"];
    str = "tuvwxyz";
    number = 100.045;
    arrayLike = {
      0: "a",
      1: "b",
      2: "c",
      3: "d",
      4: "e",
      5: "f",
      6: "g",
      7: "h",
      get length() {
        return Object.keys(this).length - 1;
      },
    };
    limitTo = $filter("limitTo");
  });

  it("should return the first X items when X is positive", () => {
    expect(limitTo(items, 3)).toEqual(["a", "b", "c"]);
    expect(limitTo(items, "3")).toEqual(["a", "b", "c"]);
    expect(limitTo(str, 3)).toEqual("tuv");
    expect(limitTo(str, "3")).toEqual("tuv");
    expect(limitTo(number, 3)).toEqual("100");
    expect(limitTo(number, "3")).toEqual("100");
    expect(limitTo(arrayLike, 3)).toEqual(["a", "b", "c"]);
    expect(limitTo(arrayLike, "3")).toEqual(["a", "b", "c"]);
  });

  it("should return the first X items beginning from index Y when X and Y are positive", () => {
    expect(limitTo(items, 3, "3")).toEqual(["d", "e", "f"]);
    expect(limitTo(items, "3", 3)).toEqual(["d", "e", "f"]);
    expect(limitTo(str, 3, 3)).toEqual("wxy");
    expect(limitTo(str, "3", "3")).toEqual("wxy");
    expect(limitTo(arrayLike, 3, 3)).toEqual(["d", "e", "f"]);
    expect(limitTo(arrayLike, "3", "3")).toEqual(["d", "e", "f"]);
  });

  it("should return the first X items beginning from index Y when X is positive and Y is negative", () => {
    expect(limitTo(items, 3, "-3")).toEqual(["f", "g", "h"]);
    expect(limitTo(items, "3", -3)).toEqual(["f", "g", "h"]);
    expect(limitTo(str, 3, -3)).toEqual("xyz");
    expect(limitTo(str, "3", "-3")).toEqual("xyz");
    expect(limitTo(arrayLike, 3, "-3")).toEqual(["f", "g", "h"]);
    expect(limitTo(arrayLike, "3", -3)).toEqual(["f", "g", "h"]);
  });

  it("should return the last X items when X is negative", () => {
    expect(limitTo(items, -3)).toEqual(["f", "g", "h"]);
    expect(limitTo(items, "-3")).toEqual(["f", "g", "h"]);
    expect(limitTo(str, -3)).toEqual("xyz");
    expect(limitTo(str, "-3")).toEqual("xyz");
    expect(limitTo(number, -3)).toEqual("045");
    expect(limitTo(number, "-3")).toEqual("045");
    expect(limitTo(arrayLike, -3)).toEqual(["f", "g", "h"]);
    expect(limitTo(arrayLike, "-3")).toEqual(["f", "g", "h"]);
  });

  it("should return the last X items until index Y when X and Y are negative", () => {
    expect(limitTo(items, -3, "-3")).toEqual(["c", "d", "e"]);
    expect(limitTo(items, "-3", -3)).toEqual(["c", "d", "e"]);
    expect(limitTo(str, -3, -3)).toEqual("uvw");
    expect(limitTo(str, "-3", "-3")).toEqual("uvw");
    expect(limitTo(arrayLike, -3, "-3")).toEqual(["c", "d", "e"]);
    expect(limitTo(arrayLike, "-3", -3)).toEqual(["c", "d", "e"]);
  });

  it("should return the last X items until index Y when X is negative and Y is positive", () => {
    expect(limitTo(items, -3, "4")).toEqual(["b", "c", "d"]);
    expect(limitTo(items, "-3", 4)).toEqual(["b", "c", "d"]);
    expect(limitTo(str, -3, 4)).toEqual("uvw");
    expect(limitTo(str, "-3", "4")).toEqual("uvw");
    expect(limitTo(arrayLike, -3, "4")).toEqual(["b", "c", "d"]);
    expect(limitTo(arrayLike, "-3", 4)).toEqual(["b", "c", "d"]);
  });

  it("should return an empty array when X = 0", () => {
    expect(limitTo(items, 0)).toEqual([]);
    expect(limitTo(items, "0")).toEqual([]);
    expect(limitTo(arrayLike, 0)).toEqual([]);
    expect(limitTo(arrayLike, "0")).toEqual([]);
  });

  it("should return entire array when X cannot be parsed", () => {
    expect(limitTo(items, "bogus")).toBe(items);
    expect(limitTo(items, "null")).toBe(items);
    expect(limitTo(items, "undefined")).toBe(items);
    expect(limitTo(items, null)).toBe(items);
    expect(limitTo(items, undefined)).toBe(items);
    expect(limitTo(arrayLike, "bogus")).toBe(arrayLike);
    expect(limitTo(arrayLike, "null")).toBe(arrayLike);
    expect(limitTo(arrayLike, "undefined")).toBe(arrayLike);
    expect(limitTo(arrayLike, null)).toBe(arrayLike);
    expect(limitTo(arrayLike, undefined)).toBe(arrayLike);
  });

  it("should return an empty string when X = 0", () => {
    expect(limitTo(str, 0)).toEqual("");
    expect(limitTo(str, "0")).toEqual("");
  });

  it("should return entire string when X cannot be parsed", () => {
    expect(limitTo(str, "bogus")).toEqual(str);
    expect(limitTo(str, "null")).toEqual(str);
    expect(limitTo(str, "undefined")).toEqual(str);
    expect(limitTo(str, null)).toEqual(str);
    expect(limitTo(str, undefined)).toEqual(str);
  });

  it("should take 0 as beginning index value when Y cannot be parsed", () => {
    expect(limitTo(items, 3, "bogus")).toEqual(limitTo(items, 3, 0));
    expect(limitTo(items, -3, "null")).toEqual(limitTo(items, -3));
    expect(limitTo(items, "3", "undefined")).toEqual(limitTo(items, "3", 0));
    expect(limitTo(items, "-3", null)).toEqual(limitTo(items, "-3"));
    expect(limitTo(items, 3, undefined)).toEqual(limitTo(items, 3, 0));
    expect(limitTo(str, 3, "bogus")).toEqual(limitTo(str, 3));
    expect(limitTo(str, -3, "null")).toEqual(limitTo(str, -3, 0));
    expect(limitTo(str, "3", "undefined")).toEqual(limitTo(str, "3"));
    expect(limitTo(str, "-3", null)).toEqual(limitTo(str, "-3", 0));
    expect(limitTo(str, 3, undefined)).toEqual(limitTo(str, 3));
    expect(limitTo(arrayLike, 3, "bogus")).toEqual(limitTo(arrayLike, 3, 0));
    expect(limitTo(arrayLike, -3, "null")).toEqual(limitTo(arrayLike, -3));
    expect(limitTo(arrayLike, "3", "undefined")).toEqual(
      limitTo(arrayLike, "3", 0),
    );
    expect(limitTo(arrayLike, "-3", null)).toEqual(limitTo(arrayLike, "-3"));
    expect(limitTo(arrayLike, 3, undefined)).toEqual(limitTo(arrayLike, 3, 0));
  });

  it("should return input if not array-like or Number", () => {
    expect(limitTo(null, 1)).toEqual(null);
    expect(limitTo(undefined, 1)).toEqual(undefined);
    expect(limitTo({}, 1)).toEqual({});
  });

  it("should return a copy of input array if X is exceeds array length", () => {
    expect(limitTo(items, 9)).toEqual(items);
    expect(limitTo(items, "9")).toEqual(items);
    expect(limitTo(items, -9)).toEqual(items);
    expect(limitTo(items, "-9")).toEqual(items);
    expect(limitTo(arrayLike, 9)).toEqual(items);
    expect(limitTo(arrayLike, "9")).toEqual(items);
    expect(limitTo(arrayLike, -9)).toEqual(items);
    expect(limitTo(arrayLike, "-9")).toEqual(items);

    expect(limitTo(items, 9)).not.toBe(items);
    expect(limitTo(arrayLike, 9)).not.toBe(arrayLike);
  });

  it("should return the entire string if X exceeds input length", () => {
    expect(limitTo(str, 9)).toEqual(str);
    expect(limitTo(str, "9")).toEqual(str);
    expect(limitTo(str, -9)).toEqual(str);
    expect(limitTo(str, "-9")).toEqual(str);
    expect(limitTo(number, 9)).toEqual(number.toString());
    expect(limitTo(number, "-9")).toEqual(number.toString());
  });

  it("should return entire input array when limited by Infinity", () => {
    expect(limitTo(items, Infinity)).toEqual(items);
    expect(limitTo(items, "Infinity")).toEqual(items);
    expect(limitTo(items, -Infinity)).toEqual(items);
    expect(limitTo(items, "-Infinity")).toEqual(items);
    expect(limitTo(arrayLike, Infinity)).toEqual(items);
    expect(limitTo(arrayLike, "Infinity")).toEqual(items);
    expect(limitTo(arrayLike, -Infinity)).toEqual(items);
    expect(limitTo(arrayLike, "-Infinity")).toEqual(items);
  });

  it("should return the entire string when limited by Infinity", () => {
    expect(limitTo(str, Infinity)).toEqual(str);
    expect(limitTo(str, "Infinity")).toEqual(str);
    expect(limitTo(str, -Infinity)).toEqual(str);
    expect(limitTo(str, "-Infinity")).toEqual(str);
  });

  it("should return an empty array if Y exceeds input length", () => {
    expect(limitTo(items, "3", 12)).toEqual([]);
    expect(limitTo(items, -3, "12")).toEqual([]);
    expect(limitTo(arrayLike, "3", 12)).toEqual([]);
    expect(limitTo(arrayLike, -3, "12")).toEqual([]);
  });

  it("should return an empty string if Y exceeds input length", () => {
    expect(limitTo(str, "3", 12)).toEqual("");
    expect(limitTo(str, -3, "12")).toEqual("");
  });

  it("should start at 0 if Y is negative and exceeds input length", () => {
    expect(limitTo(items, 4, "-12")).toEqual(["a", "b", "c", "d"]);
    expect(limitTo(items, "-4", -12)).toEqual(["e", "f", "g", "h"]);
    expect(limitTo(str, 4, "-12")).toEqual("tuvw");
    expect(limitTo(str, "-4", -12)).toEqual("wxyz");
    expect(limitTo(arrayLike, 4, "-12")).toEqual(["a", "b", "c", "d"]);
    expect(limitTo(arrayLike, "-4", -12)).toEqual(["e", "f", "g", "h"]);
  });

  it("should return the entire string beginning from Y if X is positive and X+Y exceeds input length", () => {
    expect(limitTo(items, 7, 3)).toEqual(["d", "e", "f", "g", "h"]);
    expect(limitTo(items, 7, -3)).toEqual(["f", "g", "h"]);
    expect(limitTo(str, 6, 3)).toEqual("wxyz");
    expect(limitTo(str, 6, -3)).toEqual("xyz");
    expect(limitTo(arrayLike, 7, 3)).toEqual(["d", "e", "f", "g", "h"]);
    expect(limitTo(arrayLike, 7, -3)).toEqual(["f", "g", "h"]);
  });

  it("should return the entire string until index Y if X is negative and X+Y exceeds input length", () => {
    expect(limitTo(items, -7, 3)).toEqual(["a", "b", "c"]);
    expect(limitTo(items, -7, -3)).toEqual(["a", "b", "c", "d", "e"]);
    expect(limitTo(str, -6, 3)).toEqual("tuv");
    expect(limitTo(str, -6, -3)).toEqual("tuvw");
    expect(limitTo(arrayLike, -7, 3)).toEqual(["a", "b", "c"]);
    expect(limitTo(arrayLike, -7, -3)).toEqual(["a", "b", "c", "d", "e"]);
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

    expect(limitTo(argsObj, 2).length).toBe(2);
    expect(limitTo("abc", 1).length).toBe(1);
    expect(limitTo(nodeList, 2).length).toBe(2);
  });
});
