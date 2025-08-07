import { isFunction, csp } from "../../shared/utils.js";
import { createInjector } from "../di/injector.js";
import { Angular } from "../../angular.js";
import { wait } from "../../shared/test-utils.js";

describe("parser", () => {
  let $rootScope;
  let $parse;
  let scope;
  let logs = [];

  beforeEach(() => {
    window.angular = new Angular();
    window.angular
      .module("myModule", ["ng"])
      .decorator("$exceptionHandler", function () {
        return (exception, cause) => {
          logs.push(exception);
          console.error(exception, cause);
        };
      });
    let injector = createInjector(["myModule"]);
    $parse = injector.get("$parse");
    $rootScope = injector.get("$rootScope");
  });

  let filterProvider;

  beforeEach(() => {
    createInjector([
      "ng",
      function ($filterProvider) {
        filterProvider = $filterProvider;
      },
    ]).invoke((_$rootScope_) => {
      $rootScope = _$rootScope_;
    });
  });

  [true, false].forEach((cspEnabled) => {
    describe(`csp: ${cspEnabled}`, () => {
      beforeEach(() => {
        createInjector([
          "ng",
          function ($filterProvider) {
            filterProvider = $filterProvider;
          },
        ]).invoke((_$rootScope_) => {
          scope = _$rootScope_;
        });
      });

      it("should parse expressions", () => {
        expect(scope.$eval("-1")).toEqual(-1);
        expect(scope.$eval("1 + 2.5")).toEqual(3.5);
        expect(scope.$eval("1 + -2.5")).toEqual(-1.5);
        expect(scope.$eval("1+2*3/4")).toEqual(1 + (2 * 3) / 4);
        expect(scope.$eval("0--1+1.5")).toEqual(0 - -1 + 1.5);
        expect(scope.$eval("-0--1++2*-3/-4")).toEqual(-0 - -1 + (+2 * -3) / -4);
        expect(scope.$eval("1/2*3")).toEqual((1 / 2) * 3);
      });

      it("should parse unary", () => {
        expect(scope.$eval("+1")).toEqual(+1);
        expect(scope.$eval("-1")).toEqual(-1);
        expect(scope.$eval("+'1'")).toEqual(+"1");
        expect(scope.$eval("-'1'")).toEqual(-"1");
        expect(scope.$eval("+undefined")).toEqual(0);

        // Note: don't change toEqual to toBe as toBe collapses 0 & -0.
        expect(scope.$eval("-undefined")).toEqual(-0);
        expect(scope.$eval("+null")).toEqual(+null);
        expect(scope.$eval("-null")).toEqual(-null);
        expect(scope.$eval("+false")).toEqual(+false);
        expect(scope.$eval("-false")).toEqual(-false);
        expect(scope.$eval("+true")).toEqual(+true);
        expect(scope.$eval("-true")).toEqual(-true);
      });

      it("should parse comparison", () => {
        expect(scope.$eval("false")).toBeFalsy();
        expect(scope.$eval("!true")).toBeFalsy();
        expect(scope.$eval("1==1")).toBeTruthy();
        expect(scope.$eval("1==true")).toBeTruthy();
        expect(scope.$eval("1!=true")).toBeFalsy();
        expect(scope.$eval("1===1")).toBeTruthy();
        expect(scope.$eval("1==='1'")).toBeFalsy();
        expect(scope.$eval("1===true")).toBeFalsy();
        expect(scope.$eval("'true'===true")).toBeFalsy();
        expect(scope.$eval("1!==2")).toBeTruthy();
        expect(scope.$eval("1!=='1'")).toBeTruthy();
        expect(scope.$eval("1!=2")).toBeTruthy();
        expect(scope.$eval("1<2")).toBeTruthy();
        expect(scope.$eval("1<=1")).toBeTruthy();
        expect(scope.$eval("1>2")).toEqual(1 > 2);
        expect(scope.$eval("2>=1")).toEqual(2 >= 1);
        expect(scope.$eval("true==2<3")).toEqual(2 < 3);
        expect(scope.$eval("true===2<3")).toEqual(2 < 3);

        expect(scope.$eval("true===3===3")).toEqual((true === 3) === 3);
        expect(scope.$eval("3===3===true")).toEqual(true);
        expect(scope.$eval("3 >= 3 > 2")).toEqual(3 >= 3 > 2);
      });

      it("should parse logical", () => {
        expect(scope.$eval("0&&2")).toEqual(0 && 2);
        expect(scope.$eval("0||2")).toEqual(0 || 2);
        expect(scope.$eval("0||1&&2")).toEqual(0 || (1 && 2));
        expect(scope.$eval("true&&a")).toEqual(undefined);
        expect(scope.$eval("true&&a()")).toEqual(undefined);
        expect(scope.$eval("true&&a()()")).toEqual(undefined);
        expect(scope.$eval("true&&a.b")).toEqual(undefined);
        expect(scope.$eval("true&&a.b.c")).toEqual(undefined);
        expect(scope.$eval("false||a")).toEqual(undefined);
        expect(scope.$eval("false||a()")).toEqual(undefined);
        expect(scope.$eval("false||a()()")).toEqual(undefined);
        expect(scope.$eval("false||a.b")).toEqual(undefined);
        expect(scope.$eval("false||a.b.c")).toEqual(undefined);
      });

      it("should parse ternary", () => {
        const returnTrue = (scope.returnTrue = function () {
          return true;
        });
        const returnFalse = (scope.returnFalse = function () {
          return false;
        });
        const returnString = (scope.returnString = function () {
          return "asd";
        });
        const returnInt = (scope.returnInt = function () {
          return 123;
        });
        const identity = (scope.identity = function (x) {
          return x;
        });

        // Simple.
        expect(scope.$eval("0?0:2")).toEqual(0 ? 0 : 2);
        expect(scope.$eval("1?0:2")).toEqual(1 ? 0 : 2);

        // Nested on the left.
        expect(scope.$eval("0?0?0:0:2")).toEqual(0 ? (0 ? 0 : 0) : 2);
        expect(scope.$eval("1?0?0:0:2")).toEqual(1 ? (0 ? 0 : 0) : 2);
        expect(scope.$eval("0?1?0:0:2")).toEqual(0 ? (1 ? 0 : 0) : 2);
        expect(scope.$eval("0?0?1:0:2")).toEqual(0 ? (0 ? 1 : 0) : 2);
        expect(scope.$eval("0?0?0:2:3")).toEqual(0 ? (0 ? 0 : 2) : 3);
        expect(scope.$eval("1?1?0:0:2")).toEqual(1 ? (1 ? 0 : 0) : 2);
        expect(scope.$eval("1?1?1:0:2")).toEqual(1 ? (1 ? 1 : 0) : 2);
        expect(scope.$eval("1?1?1:2:3")).toEqual(1 ? (1 ? 1 : 2) : 3);
        expect(scope.$eval("1?1?1:2:3")).toEqual(1 ? (1 ? 1 : 2) : 3);

        // Nested on the right.
        expect(scope.$eval("0?0:0?0:2")).toEqual(0 ? 0 : 0 ? 0 : 2);
        expect(scope.$eval("1?0:0?0:2")).toEqual(1 ? 0 : 0 ? 0 : 2);
        expect(scope.$eval("0?1:0?0:2")).toEqual(0 ? 1 : 0 ? 0 : 2);
        expect(scope.$eval("0?0:1?0:2")).toEqual(0 ? 0 : 1 ? 0 : 2);
        expect(scope.$eval("0?0:0?2:3")).toEqual(0 ? 0 : 0 ? 2 : 3);
        expect(scope.$eval("1?1:0?0:2")).toEqual(1 ? 1 : 0 ? 0 : 2);
        expect(scope.$eval("1?1:1?0:2")).toEqual(1 ? 1 : 1 ? 0 : 2);
        expect(scope.$eval("1?1:1?2:3")).toEqual(1 ? 1 : 1 ? 2 : 3);
        expect(scope.$eval("1?1:1?2:3")).toEqual(1 ? 1 : 1 ? 2 : 3);

        // Precedence with respect to logical operators.
        expect(scope.$eval("0&&1?0:1")).toEqual(0 && 1 ? 0 : 1);
        expect(scope.$eval("1||0?0:0")).toEqual(1 || 0 ? 0 : 0);

        expect(scope.$eval("0?0&&1:2")).toEqual(0 ? 0 && 1 : 2);
        expect(scope.$eval("0?1&&1:2")).toEqual(0 ? 1 && 1 : 2);
        expect(scope.$eval("0?0||0:1")).toEqual(0 ? 0 || 0 : 1);
        expect(scope.$eval("0?0||1:2")).toEqual(0 ? 0 || 1 : 2);

        expect(scope.$eval("1?0&&1:2")).toEqual(1 ? 0 && 1 : 2);
        expect(scope.$eval("1?1&&1:2")).toEqual(1 ? 1 && 1 : 2);
        expect(scope.$eval("1?0||0:1")).toEqual(1 ? 0 || 0 : 1);
        expect(scope.$eval("1?0||1:2")).toEqual(1 ? 0 || 1 : 2);

        expect(scope.$eval("0?1:0&&1")).toEqual(0 ? 1 : 0 && 1);
        expect(scope.$eval("0?2:1&&1")).toEqual(0 ? 2 : 1 && 1);
        expect(scope.$eval("0?1:0||0")).toEqual(0 ? 1 : 0 || 0);
        expect(scope.$eval("0?2:0||1")).toEqual(0 ? 2 : 0 || 1);

        expect(scope.$eval("1?1:0&&1")).toEqual(1 ? 1 : 0 && 1);
        expect(scope.$eval("1?2:1&&1")).toEqual(1 ? 2 : 1 && 1);
        expect(scope.$eval("1?1:0||0")).toEqual(1 ? 1 : 0 || 0);
        expect(scope.$eval("1?2:0||1")).toEqual(1 ? 2 : 0 || 1);

        // Function calls.
        expect(
          scope.$eval("returnTrue() ? returnString() : returnInt()"),
        ).toEqual(returnTrue() ? returnString() : returnInt());
        expect(
          scope.$eval("returnFalse() ? returnString() : returnInt()"),
        ).toEqual(returnFalse() ? returnString() : returnInt());
        expect(
          scope.$eval("returnTrue() ? returnString() : returnInt()"),
        ).toEqual(returnTrue() ? returnString() : returnInt());
        expect(
          scope.$eval("identity(returnFalse() ? returnString() : returnInt())"),
        ).toEqual(identity(returnFalse() ? returnString() : returnInt()));
      });

      it("should parse string", () => {
        expect(scope.$eval("'a' + 'b c'")).toEqual("ab c");
      });

      it("should parse filters", () => {
        filterProvider.register(
          "substring",
          () => (input, start, end) => input.substring(start, end),
        );

        expect(() => {
          scope.$eval("1|nonexistent");
        }).toThrowError();

        scope.offset = 3;
        expect(scope.$eval("'abcd'|substring:1:offset")).toEqual("bc");
      });

      it("should access scope", () => {
        scope.a = 123;
        scope.b = { c: 456 };
        expect(scope.$eval("a", scope)).toEqual(123);
        expect(scope.$eval("b.c", scope)).toEqual(456);
        expect(scope.$eval("x.y.z", scope)).not.toBeDefined();
      });

      it("should handle white-spaces around dots in paths", () => {
        scope.a = { b: 4 };
        expect(scope.$eval("a . b", scope)).toEqual(4);
        expect(scope.$eval("a. b", scope)).toEqual(4);
        expect(scope.$eval("a .b", scope)).toEqual(4);
        expect(scope.$eval("a    . \nb", scope)).toEqual(4);
      });

      it("should handle white-spaces around dots in method invocations", () => {
        scope.a = {
          b() {
            return this.c;
          },
          c: 4,
        };
        expect(scope.$eval("a . b ()", scope)).toEqual(4);
        expect(scope.$eval("a. b ()", scope)).toEqual(4);
        expect(scope.$eval("a .b ()", scope)).toEqual(4);
        expect(scope.$eval("a  \n  . \nb   \n ()", scope)).toEqual(4);
      });

      it("should throw syntax error exception for identifiers ending with a dot", () => {
        scope.a = { b: 4 };

        expect(() => {
          scope.$eval("a.", scope);
        }).toThrowError(/ueoe/);

        expect(() => {
          scope.$eval("a .", scope);
        }).toThrowError(/ueoe/);
      });

      it("should resolve deeply nested paths (important for CSP mode)", () => {
        scope.a = {
          b: {
            c: {
              d: {
                e: {
                  f: {
                    g: { h: { i: { j: { k: { l: { m: { n: "nooo!" } } } } } } },
                  },
                },
              },
            },
          },
        };
        expect(scope.$eval("a.b.c.d.e.f.g.h.i.j.k.l.m.n", scope)).toBe("nooo!");
      });

      [2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 42, 99].forEach((pathLength) => {
        it(`should resolve nested paths of length ${pathLength}`, () => {
          let i;
          // Create a nested object {x2: {x3: {x4: ... {x[n]: 42} ... }}}.
          let obj = 42;
          const locals = {};
          for (i = pathLength; i >= 2; i--) {
            const newObj = {};
            newObj[`x${i}`] = obj;
            obj = newObj;
          }
          // Assign to x1 and build path 'x1.x2.x3. ... .x[n]' to access the final value.
          scope.x1 = obj;
          let path = "x1";
          for (i = 2; i <= pathLength; i++) {
            path += `.x${i}`;
          }
          expect(scope.$eval(path)).toBe(42);
          locals[`x${pathLength}`] = "not 42";
          expect(scope.$eval(path, locals)).toBe(42);
        });
      });

      it("should be forgiving", () => {
        scope.a = { b: 23 };
        expect(scope.$eval("b")).toBeUndefined();
        expect(scope.$eval("a.x")).toBeUndefined();
        expect(scope.$eval("a.b.c.d")).toBeUndefined();
        scope.a = undefined;
        expect(scope.$eval("a - b")).toBe(0);
        expect(scope.$eval("a + b")).toBeUndefined();
        scope.a = 0;
        expect(scope.$eval("a - b")).toBe(0);
        expect(scope.$eval("a + b")).toBe(0);
        scope.a = undefined;
        scope.b = 0;
        expect(scope.$eval("a - b")).toBe(0);
        expect(scope.$eval("a + b")).toBe(0);
      });

      it("should support property names that collide with native object properties", () => {
        // regression
        scope.watch = 1;
        scope.toString = function toString() {
          return "custom toString";
        };

        expect(scope.$eval("watch", scope)).toBe(1);
        expect(scope.$eval("toString()", scope)).toBe("custom toString");
      });

      it("should not break if hasOwnProperty is referenced in an expression", () => {
        scope.obj = { value: 1 };
        // By evaluating an expression that calls hasOwnProperty, the getterFnCache
        // will store a property called hasOwnProperty.  This is effectively:
        // getterFnCache['hasOwnProperty'] = null
        scope.$eval('obj.hasOwnProperty("value")');
        // If we rely on this property then evaluating any expression will fail
        // because it is not able to find out if obj.value is there in the cache
        expect(scope.$eval("obj.value")).toBe(1);
      });

      it('should not break if the expression is "hasOwnProperty"', () => {
        scope.fooExp = "barVal";
        // By evaluating hasOwnProperty, the $parse cache will store a getter for
        // the scope's own hasOwnProperty function, which will mess up future cache look ups.
        // i.e. cache['hasOwnProperty'] = function(scope) { return scope.hasOwnProperty; }
        scope.$eval("hasOwnProperty");
        expect(scope.$eval("fooExp")).toBe("barVal");
      });

      it("should evaluate grouped expressions", () => {
        expect(scope.$eval("(1+2)*3")).toEqual((1 + 2) * 3);
      });

      it("should evaluate assignments", () => {
        expect(scope.$eval("a=12")).toEqual(12);
        expect(scope.a).toEqual(12);

        expect(scope.$eval("x.y.z=123;")).toEqual(123);
        expect(scope.x.y.z).toEqual(123);

        expect(scope.$eval("a=123; b=234")).toEqual(234);
        expect(scope.a).toEqual(123);
        expect(scope.b).toEqual(234);
      });

      it("should throw with invalid left-val in assignments", () => {
        expect(() => {
          scope.$eval("1 = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("{} = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("[] = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("true = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("(a=b) = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("(1<2) = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("(1+2) = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("!v = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("this = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("+v = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("(1?v1:v2) = 1");
        }).toThrowError(/lval/);
      });

      it("should evaluate assignments in ternary operator", () => {
        scope.$eval("a = 1 ? 2 : 3");
        expect(scope.a).toBe(2);

        scope.$eval("0 ? a = 2 : a = 3");
        expect(scope.a).toBe(3);

        scope.$eval("1 ? a = 2 : a = 3");
        expect(scope.a).toBe(2);
      });

      it("should evaluate function call without arguments", () => {
        scope.const = function (a, b) {
          return 123;
        };
        expect(scope.$eval("const()")).toEqual(123);
      });

      it("should evaluate function call with arguments", () => {
        scope.add = function (a, b) {
          return a + b;
        };
        expect(scope.$eval("add(1,2)")).toEqual(3);
      });

      it("should allow filter chains as arguments", () => {
        scope.concat = function (a, b) {
          return a + b;
        };
        scope.begin = 1;
        scope.limit = 2;
        expect(
          scope.$eval("concat('abcd'|limitTo:limit:begin,'abcd'|limitTo:2:1)"),
        ).toEqual("bcbc");
      });

      it("should evaluate function call from a return value", () => {
        scope.getter = function () {
          return function () {
            return 33;
          };
        };
        expect(scope.$eval("getter()()")).toBe(33);
      });

      it("should evaluate multiplication and division", () => {
        scope.taxRate = 8;
        scope.subTotal = 100;
        expect(scope.$eval("taxRate / 100 * subTotal")).toEqual(8);
        expect(scope.$eval("subTotal * taxRate / 100")).toEqual(8);
      });

      it("should evaluate array", () => {
        expect(scope.$eval("[]").length).toEqual(0);
        expect(scope.$eval("[1, 2]").length).toEqual(2);
        expect(scope.$eval("[1, 2]")[0]).toEqual(1);
        expect(scope.$eval("[1, 2]")[1]).toEqual(2);
        expect(scope.$eval("[1, 2,]")[1]).toEqual(2);
        expect(scope.$eval("[1, 2,]").length).toEqual(2);
      });

      it("should evaluate array access", () => {
        expect(scope.$eval("[1][0]")).toEqual(1);
        expect(scope.$eval("[[1]][0][0]")).toEqual(1);
        expect(scope.$eval("[].length")).toEqual(0);
        expect(scope.$eval("[1, 2].length")).toEqual(2);
      });

      it("should evaluate object", () => {
        expect(scope.$eval("{}")).toEqual({});
        expect(scope.$eval("{a:'b'}")).toEqual({ a: "b" });
        expect(scope.$eval("{'a':'b'}")).toEqual({ a: "b" });
        expect(scope.$eval("{\"a\":'b'}")).toEqual({ a: "b" });
        expect(scope.$eval("{a:'b',}")).toEqual({ a: "b" });
        expect(scope.$eval("{'a':'b',}")).toEqual({ a: "b" });
        expect(scope.$eval("{\"a\":'b',}")).toEqual({ a: "b" });
        expect(scope.$eval("{'0':1}")).toEqual({ 0: 1 });
        expect(scope.$eval("{0:1}")).toEqual({ 0: 1 });
        expect(scope.$eval("{1:1}")).toEqual({ 1: 1 });
        expect(scope.$eval("{null:1}")).toEqual({ null: 1 });
        expect(scope.$eval("{'null':1}")).toEqual({ null: 1 });
        expect(scope.$eval("{false:1}")).toEqual({ false: 1 });
        expect(scope.$eval("{'false':1}")).toEqual({ false: 1 });
        expect(scope.$eval("{'':1,}")).toEqual({ "": 1 });

        // ES6 object initializers.
        expect(scope.$eval("{x, y}", { x: "foo", y: "bar" })).toEqual({
          x: "foo",
          y: "bar",
        });
        expect(scope.$eval("{[x]: x}", { x: "foo" })).toEqual({ foo: "foo" });
        expect(scope.$eval('{[x + "z"]: x}', { x: "foo" })).toEqual({
          fooz: "foo",
        });
        expect(
          scope.$eval(
            "{x, 1: x, [x = x + 1]: x, 3: x + 1, [x = x + 2]: x, 5: x + 1}",
            { x: 1 },
          ),
        ).toEqual({ x: 1, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 });
      });

      it("should throw syntax error exception for non constant/identifier JSON keys", () => {
        expect(() => {
          scope.$eval("{[:0}");
        }).toThrowError(/syntax/);
        expect(() => {
          scope.$eval("{{:0}");
        }).toThrowError(/syntax/);
        expect(() => {
          scope.$eval("{?:0}");
        }).toThrowError(/syntax/);
        expect(() => {
          scope.$eval("{):0}");
        }).toThrowError(/syntax/);
      });

      it("should evaluate object access", () => {
        expect(scope.$eval("{false:'WC', true:'CC'}[false]")).toEqual("WC");
      });

      it("should evaluate JSON", () => {
        expect(scope.$eval("[{}]")).toEqual([{}]);
        expect(scope.$eval("[{a:[]}, {b:1}]")).toEqual([{ a: [] }, { b: 1 }]);
      });

      it("should evaluate multiple statements", () => {
        expect(scope.$eval("a=1;b=3;a+b")).toEqual(4);
        expect(scope.$eval(";;1;;")).toEqual(1);
      });

      it("should evaluate object methods in correct context (this)", () => {
        function C() {
          this.a = 123;
        }
        C.prototype.getA = function () {
          return this.a;
        };

        scope.obj = new C();
        expect(scope.$eval("obj.getA()")).toEqual(123);
        expect(scope.$eval("obj['getA']()")).toEqual(123);
      });

      it("should evaluate methods in correct context (this) in argument", () => {
        function C() {
          this.a = 123;
        }
        C.prototype.sum = function (value) {
          return this.a + value;
        };
        C.prototype.getA = function () {
          return this.a;
        };

        scope.obj = new C();
        expect(scope.$eval("obj.sum(obj.getA())")).toEqual(246);
        expect(scope.$eval("obj['sum'](obj.getA())")).toEqual(246);
      });

      it("should evaluate objects on scope context", () => {
        scope.a = "abc";
        expect(scope.$eval("{a:a}").a).toEqual("abc");
      });

      it("should evaluate field access on function call result", () => {
        scope.a = function () {
          return { name: "misko" };
        };
        expect(scope.$eval("a().name")).toEqual("misko");
      });

      it("should evaluate field access after array access", () => {
        scope.items = [{}, { name: "misko" }];
        expect(scope.$eval("items[1].name")).toEqual("misko");
      });

      it("should evaluate array assignment", () => {
        scope.items = [];

        expect(scope.$eval('items[1] = "abc"')).toEqual("abc");
        expect(scope.$eval("items[1]")).toEqual("abc");
        expect(scope.$eval('books[1] = "moby"')).toEqual("moby");
        expect(scope.$eval("books[1]")).toEqual("moby");
      });

      it("should evaluate grouped filters", () => {
        scope.name = "MISKO";
        expect(scope.$eval("n = (name|limitTo:2|limitTo:1)")).toEqual("M");
        expect(scope.$eval("n")).toEqual("M");
      });

      it("should evaluate remainder", () => {
        expect(scope.$eval("1%2")).toEqual(1);
      });

      it("should evaluate sum with undefined", () => {
        expect(scope.$eval("1+undefined")).toEqual(1);
        expect(scope.$eval("undefined+1")).toEqual(1);
      });

      it("should throw exception on non-closed bracket", () => {
        expect(() => {
          scope.$eval("[].count(");
        }).toThrowError(/ueoe/);
      });

      it("should evaluate double negation", () => {
        expect(scope.$eval("true")).toBeTruthy();
        expect(scope.$eval("!true")).toBeFalsy();
        expect(scope.$eval("!!true")).toBeTruthy();
        expect(scope.$eval('{true:"a", false:"b"}[!!true]')).toEqual("a");
      });

      it("should evaluate negation", () => {
        expect(scope.$eval("!false || true")).toEqual(true);
        expect(scope.$eval("!11 == 10")).toEqual(!11 == 10);
        expect(scope.$eval("12/6/2")).toEqual(12 / 6 / 2);
      });

      it("should evaluate exclamation mark", () => {
        expect(scope.$eval('suffix = "!"')).toEqual("!");
      });

      it("should evaluate minus", () => {
        expect(scope.$eval("{a:'-'}")).toEqual({ a: "-" });
      });

      it("should evaluate undefined", () => {
        expect(scope.$eval("undefined")).not.toBeDefined();
        expect(scope.$eval("a=undefined")).not.toBeDefined();
        expect(scope.a).not.toBeDefined();
      });

      it("should allow assignment after array dereference", () => {
        scope.obj = [{}];
        scope.$eval("obj[0].name=1");
        expect(scope.obj.name).toBeUndefined();
        expect(scope.obj[0].name).toEqual(1);
      });

      it("should short-circuit AND operator", () => {
        scope.run = function () {
          throw new Error("IT SHOULD NOT HAVE RUN");
        };
        expect(scope.$eval("false && run()")).toBe(false);
        expect(scope.$eval("false && true && run()")).toBe(false);
      });

      it("should short-circuit OR operator", () => {
        scope.run = function () {
          throw new Error("IT SHOULD NOT HAVE RUN");
        };
        expect(scope.$eval("true || run()")).toBe(true);
        expect(scope.$eval("true || false || run()")).toBe(true);
      });

      it("should throw TypeError on using a 'broken' object as a key to access a property", () => {
        scope.object = {};
        [
          { toString: 2 },
          { toString: null },
          {
            toString() {
              return {};
            },
          },
        ].forEach((brokenObject) => {
          scope.brokenObject = brokenObject;
          expect(() => {
            scope.$eval("object[brokenObject]");
          }).toThrow();
        });
      });

      it("should support method calls on primitive types", () => {
        scope.empty = "";
        scope.zero = 0;
        scope.bool = false;

        expect(scope.$eval("empty.substring(0)")).toBe("");
        expect(scope.$eval("zero.toString()")).toBe("0");
        expect(scope.$eval("bool.toString()")).toBe("false");
      });

      it("should evaluate expressions with line terminators", () => {
        scope.a = "a";
        scope.b = { c: "bc" };
        expect(
          scope.$eval('a + \n b.c + \r "\td" + \t \r\n\r "\r\n\n"'),
        ).toEqual("abc\td\r\n\n");
      });

      // https://github.com/angular/angular.js/issues/10968
      it("should evaluate arrays literals initializers left-to-right", () => {
        const s = {
          c() {
            return { b: 1 };
          },
        };
        expect($parse("e=1;[a=c(),d=a.b+1]")(s)).toEqual([{ b: 1 }, 2]);
      });

      it("should evaluate function arguments left-to-right", () => {
        const s = {
          c() {
            return { b: 1 };
          },
          i(x, y) {
            return [x, y];
          },
        };
        expect($parse("e=1;i(a=c(),d=a.b+1)")(s)).toEqual([{ b: 1 }, 2]);
      });

      it("should evaluate object properties expressions left-to-right", () => {
        const s = {
          c() {
            return { b: 1 };
          },
        };
        expect($parse("e=1;{x: a=c(), y: d=a.b+1}")(s)).toEqual({
          x: { b: 1 },
          y: 2,
        });
      });

      it("should call the function from the received instance and not from a new one", () => {
        let n = 0;
        scope.fn = function () {
          const c = n++;
          return {
            c,
            anotherFn() {
              return this.c === c;
            },
          };
        };
        expect(scope.$eval("fn().anotherFn()")).toBe(true);
      });

      it("should call the function once when it is part of the context", () => {
        let count = 0;
        scope.fn = function () {
          count++;
          return {
            anotherFn() {
              return "lucas";
            },
          };
        };
        expect(scope.$eval("fn().anotherFn()")).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is not part of the context", () => {
        let count = 0;
        scope.fn = function () {
          count++;
          return function () {
            return "lucas";
          };
        };
        expect(scope.$eval("fn()()")).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of the context on assignments", () => {
        let count = 0;
        const element = {};
        scope.fn = function () {
          count++;
          return element;
        };
        expect(scope.$eval('fn().name = "lucas"')).toBe("lucas");
        expect(element.name).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of the context on array lookups", () => {
        let count = 0;
        const element = [];
        scope.fn = function () {
          count++;
          return element;
        };
        expect(scope.$eval('fn()[0] = "lucas"')).toBe("lucas");
        expect(element[0]).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of the context on array lookup function", () => {
        let count = 0;
        const element = [
          {
            anotherFn() {
              return "lucas";
            },
          },
        ];
        scope.fn = function () {
          count++;
          return element;
        };
        expect(scope.$eval("fn()[0].anotherFn()")).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of the context on property lookup function", () => {
        let count = 0;
        const element = {
          name: {
            anotherFn() {
              return "lucas";
            },
          },
        };
        scope.fn = function () {
          count++;
          return element;
        };
        expect(scope.$eval("fn().name.anotherFn()")).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of a sub-expression", () => {
        let count = 0;
        scope.element = [{}];
        scope.fn = function () {
          count++;
          return 0;
        };
        expect(scope.$eval('element[fn()].name = "lucas"')).toBe("lucas");
        expect(scope.element.$target[0].name).toBe("lucas");
        expect(count).toBe(1);
      });
    });
  });

  describe("assignable", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]);
    });

    it("should expose assignment function", () => {
      const fn = $parse("a");
      expect(fn.assign).toBeTruthy();
      const scope = {};
      fn.assign(scope, 123);
      expect(scope).toEqual({ a: 123 });
    });

    it("should return the assigned value", () => {
      const fn = $parse("a");
      const scope = {};
      expect(fn.assign(scope, 123)).toBe(123);
      const someObject = {};
      expect(fn.assign(scope, someObject)).toBe(someObject);
    });

    it("should expose working assignment function for expressions ending with brackets", () => {
      const fn = $parse('a.b["c"]');
      expect(fn.assign).toBeTruthy();
      const scope = {};
      fn.assign(scope, 123);
      expect(scope.a.b.c).toEqual(123);
    });

    it("should expose working assignment function for expressions with brackets in the middle", () => {
      const fn = $parse('a["b"].c');
      expect(fn.assign).toBeTruthy();
      const scope = {};
      fn.assign(scope, 123);
      expect(scope.a.b.c).toEqual(123);
    });

    it("should create objects when finding a null", () => {
      const fn = $parse("foo.bar");
      const scope = { foo: null };
      fn.assign(scope, 123);
      expect(scope.foo.bar).toEqual(123);
    });

    it("should create objects when finding a null", () => {
      const fn = $parse('foo["bar"]');
      const scope = { foo: null };
      fn.assign(scope, 123);
      expect(scope.foo.bar).toEqual(123);
    });

    it("should create objects when finding a null", () => {
      const fn = $parse("foo.bar.baz");
      const scope = { foo: null };
      fn.assign(scope, 123);
      expect(scope.foo.bar.baz).toEqual(123);
    });
  });

  describe("watched $parse expressions", () => {
    beforeEach(() => {
      createInjector(["ng"]).invoke((_$rootScope_) => {
        scope = _$rootScope_;
      });
    });

    it("should respect short-circuiting AND if it could have side effects", async () => {
      let bCalled = 0;
      let called = false;
      scope.b = function () {
        bCalled++;
        return true;
      };

      scope.$watch("a && b()", () => {
        called = true;
      });
      await wait();
      expect(bCalled).toBe(0);
      expect(called).toBe(false);

      scope.a = true;
      await wait();
      expect(called).toBe(true);
      expect(bCalled).toBe(1);

      scope.a = false;
      scope.a = true;
      await wait();
      expect(bCalled).toBe(3);
    });

    it("should respect short-circuiting OR if it could have side effects", async () => {
      let bCalled = false;
      scope.b = function () {
        bCalled = true;
        return true;
      };

      scope.$watch("a || b()", () => {});
      await wait();
      expect(bCalled).toBe(false);

      scope.a = true;
      await wait();
      expect(bCalled).toBe(false);

      scope.a = false;
      await wait();
      expect(bCalled).toBe(true);
    });

    it("should respect the branching ternary operator if it could have side effects", async () => {
      let bCalled = false;
      scope.b = function () {
        bCalled = true;
      };

      scope.$watch("a ? b() : 1", () => {});
      await wait();
      expect(bCalled).toBe(false);

      scope.a = true;
      await wait();
      expect(bCalled).toBe(true);
    });
  });

  describe("filters", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    it("should be invoked when the input/arguments change", async () => {
      let filterCalled = false;
      filterProvider.register("foo", () => (input) => {
        filterCalled = true;
        return input;
      });

      scope.$watch("a | foo:b:1", () => {});
      await wait();
      expect(filterCalled).toBe(true);

      filterCalled = false;

      scope.a = 0;
      await wait();
      expect(filterCalled).toBe(true);

      filterCalled = false;

      scope.a++;
      await wait();
      expect(filterCalled).toBe(true);
    });

    it("should not be invoked unless the input/arguments change within literals", async () => {
      const filterCalls = [];
      filterProvider.register("foo", () => (input) => {
        filterCalls.push(input);
        return input;
      });

      scope.$watch("[(a | foo:b:1), undefined]", () => {});

      scope.a = 0;
      await wait();
      expect(filterCalls).toEqual([0, 0]);

      scope.a++;
      await wait();
      expect(filterCalls).toEqual([0, 0, 1]);
    });

    it("should be treated as constant when input are constant", async () => {
      let filterCalls = 0;
      filterProvider.register("foo", () => (input) => {
        filterCalls++;
        return input;
      });

      const parsed = $parse("{x: 1} | foo:1");
      expect(parsed.constant).toBe(true);

      let watcherCalls = 0;
      scope.$watch("{x: 1} | foo:1", (input) => {
        expect(input).toEqual({ x: 1 });
        watcherCalls++;
      });

      await wait();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);

      await wait();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);
    });

    it("should ignore changes within nested objects", async () => {
      const watchCalls = [];
      scope.$watch("[a]", (a) => {
        watchCalls.push(a[0]);
      });
      scope.a = 0;
      await wait();
      expect(watchCalls).toEqual([0, 0]);

      scope.a++;
      await wait();
      expect(watchCalls).toEqual([0, 0, 1]);

      scope.a = {};
      await wait();
      expect(watchCalls).toEqual([0, 0, 1, {}]);

      scope.a.foo = 42;
      await wait();
      expect(watchCalls).toEqual([0, 0, 1, { foo: 42 }]);
    });
  });

  describe("with non-primitive input", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    describe("that does NOT support valueOf()", () => {
      it("should always be reevaluated", async () => {
        let filterCalls = 0;
        filterProvider.register("foo", () => (input) => {
          filterCalls++;
          return input;
        });

        scope.obj = {};

        let watcherCalls = 0;
        scope.$watch("obj | foo", (input) => {
          watcherCalls++;
        });

        await wait();
        expect(filterCalls).toBe(1);
        expect(watcherCalls).toBe(1);
      });

      it("should always be reevaluated in literals", async () => {
        filterProvider.register("foo", () => (input) => input.b > 0);

        scope.$watch("[(a | foo)]", () => {});
        scope.$apply("a = {b: 1}");
        await wait();
        // Would be great if filter-output was checked for changes and this didn't throw...
        expect(async () => {
          scope.$apply("a = {b: 1}");
          await wait();
        }).not.toThrow();
      });

      it("should always be reevaluated when passed literals", () => {
        scope.$watch("[a] | filter", () => {});

        scope.$apply("a = 1");

        // Would be great if filter-output was checked for changes and this didn't throw...
        expect(async () => {
          scope.$apply("a = {}");
          await wait();
        }).not.toThrow();
      });
    });

    describe("that does support valueOf()", () => {
      it("should not be reevaluated", async () => {
        let filterCalls = 0;
        filterProvider.register("foo", () => (input) => {
          filterCalls++;
          expect(input instanceof Date).toBe(true);
          return input;
        });

        const date = (scope.date = new Date());

        let watcherCalls = 0;
        scope.$watch("date | foo:a", (input) => {
          watcherCalls++;
        });

        await wait();
        expect(filterCalls).toBe(2);
        expect(watcherCalls).toBe(2);
      });

      it("should not be reevaluated in literals", async () => {
        let filterCalls = 0;
        filterProvider.register("foo", () => (input) => {
          filterCalls++;
          return input;
        });

        let watcherCalls = 0;
        scope.$watch("[(date | foo)]", (input) => {
          watcherCalls++;
        });

        scope.date = new Date(1234567890123);

        await wait();

        expect(filterCalls).toBe(2);
        expect(watcherCalls).toBe(2);

        scope.date = new Date(1234567890124);

        await wait();
        expect(filterCalls).toBe(3);
        expect(watcherCalls).toBe(3);
      });

      it("should be reevaluated when valueOf() changes", async () => {
        let filterCalls = 0;
        filterProvider.register("foo", () => (input) => {
          filterCalls++;
          return input;
        });

        let watcherCalls = 0;

        scope.date = new Date();
        scope.$watch("date | foo:a", (input) => {
          watcherCalls++;
        });

        await wait();
        expect(filterCalls).toBe(2);
        expect(watcherCalls).toBe(2);

        scope.date = new Date();

        await wait();
        expect(filterCalls).toBe(3);
        expect(watcherCalls).toBe(3);
      });

      it("should be reevaluated in literals when valueOf() changes", async () => {
        let filterCalls = 0;
        filterProvider.register("foo", () => (input) => {
          filterCalls++;
          return input;
        });

        scope.date = new Date(1234567890123);

        let watcherCalls = 0;
        scope.$watch("[(date | foo)]", (input) => {
          watcherCalls++;
        });

        await wait();
        expect(filterCalls).toBe(1);
        expect(watcherCalls).toBe(1);

        scope.date = new Date(1234567890133);

        await wait();
        expect(filterCalls).toBe(2);
        expect(watcherCalls).toBe(2);
      });

      it("should not be reevaluated when the instance changes but valueOf() does not", async () => {
        let filterCalls = 0;
        filterProvider.register("foo", () => (input) => {
          filterCalls++;
          return input;
        });

        scope.date = new Date(1234567890123);

        let watcherCalls = 0;
        scope.$watch("[(date | foo)]", (input) => {
          watcherCalls++;
        });

        await wait();
        expect(watcherCalls).toBe(1);
        expect(filterCalls).toBe(1);

        scope.date = new Date(1234567890123);
        await wait();
        expect(watcherCalls).toBe(2);
        expect(filterCalls).toBe(2);
      });
    });

    it("should not be reevaluated when input is simplified via unary operators", async () => {
      let filterCalls = 0;
      filterProvider.register("foo", () => (input) => {
        filterCalls++;
        return input;
      });

      scope.obj = {};

      let watcherCalls = 0;
      scope.$watch("!obj | foo:!obj", (input) => {
        watcherCalls++;
      });

      await wait();
      expect(filterCalls).toBe(2);
      expect(watcherCalls).toBe(2);

      await wait();
      expect(filterCalls).toBe(2);
      expect(watcherCalls).toBe(2);
    });

    it("should not be reevaluated when input is simplified via non-plus/concat binary operators", async () => {
      let filterCalls = 0;
      filterProvider.register("foo", () => (input) => {
        filterCalls++;
        return input;
      });

      scope.obj = {};

      let watcherCalls = 0;
      scope.$watch("1 - obj | foo:(1 * obj)", (input) => {
        watcherCalls++;
      });

      await wait();
      expect(filterCalls).toBe(2);
      expect(watcherCalls).toBe(2);

      await wait();
      expect(filterCalls).toBe(2);
      expect(watcherCalls).toBe(2);
    });

    it("should be reevaluated when input is simplified via plus/concat", async () => {
      let filterCalls = 0;
      filterProvider.register("foo", () => (input) => {
        filterCalls++;
        return input;
      });

      scope.obj = {};

      let watcherCalls = 0;
      scope.$watch("1 + obj | foo", (input) => {
        watcherCalls++;
      });

      await wait();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);

      await wait();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);
    });
  });

  describe("with primitive input", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    it("should not be reevaluated when passed literals", async () => {
      let filterCalls = 0;
      filterProvider.register("foo", () => (input) => {
        filterCalls++;
        return input;
      });

      let watcherCalls = 0;
      scope.$watch("[a] | foo", (input) => {
        watcherCalls++;
      });

      scope.$apply("a = 1");
      await wait();
      expect(filterCalls).toBe(2);
      expect(watcherCalls).toBe(2);

      scope.$apply("a = 2");
      await wait();
      expect(filterCalls).toBe(3);
      expect(watcherCalls).toBe(3);
    });

    it("should not be reevaluated in literals", async () => {
      let filterCalls = 0;
      filterProvider.register("foo", () => (input) => {
        filterCalls++;
        return input;
      });

      scope.prim = 1234567890123;

      let watcherCalls = 0;
      scope.$watch("[(prim | foo)]", (input) => {
        watcherCalls++;
      });

      await wait();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);

      await wait();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);
    });
  });

  describe("literals", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    it("should mark an empty expressions as literal", () => {
      expect($parse("").literal).toBe(true);
      expect($parse("   ").literal).toBe(true);
    });

    it("should support watching", async () => {
      let lastVal = NaN;
      let callCount = 0;
      const listener = function (val) {
        callCount++;
        lastVal = val;
      };

      scope.$watch("{val: val}", listener);
      await wait();
      expect(callCount).toBe(1);

      scope.$apply("val = 1");
      await wait();
      expect(callCount).toBe(2);
      expect(lastVal).toEqual({ val: 1 });

      scope.$apply("val = []");
      await wait();
      expect(callCount).toBe(3);
      expect(lastVal).toEqual({ val: [] });

      scope.$apply("val = []");
      await wait();
      expect(callCount).toBe(4);
      expect(lastVal).toEqual({ val: [] });

      scope.$apply("val = {}");
      await wait();
      expect(callCount).toBe(5);
      expect(lastVal).toEqual({ val: {} });
    });

    it("should only watch the direct inputs", async () => {
      let lastVal = NaN;
      let callCount = 0;
      const listener = function (val) {
        callCount++;
        lastVal = val;
      };

      scope.$watch("{val: val}", listener);
      scope.$apply("val = 1");
      await wait();
      expect(callCount).toBe(2);
      expect(lastVal).toEqual({ val: 1 });

      scope.$apply("val = [2]");
      await wait();
      expect(callCount).toBe(3);
      expect(lastVal).toEqual({ val: [2] });

      scope.$apply("val.push(3)");
      await wait();
      expect(callCount).toBe(3);

      scope.$apply("val.length = 0");
      await wait();
      expect(callCount).toBe(3);
    });

    it("should only watch the direct inputs when nested", async () => {
      let callCount = 0;
      const listener = function (val) {
        callCount++;
      };

      scope.$watch("[{val: [val]}]", listener);
      scope.$apply("val = 1");
      await wait();
      expect(callCount).toBe(2);

      scope.$apply("val = [2]");
      await wait();
      expect(callCount).toBe(3);

      scope.$apply("val.push(3)");
      await wait();
      expect(callCount).toBe(3);

      scope.$apply("val.length = 0");
      await wait();
      expect(callCount).toBe(3);
    });
  });

  describe("with non-primative input", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    describe("that does NOT support valueOf()", () => {
      it("should not be reevaluated", async () => {
        const obj = (scope.obj = {});
        let watcherCalls = 0;
        scope.$watch("[obj]", (input) => {
          watcherCalls++;
        });

        await wait();
        expect(watcherCalls).toBe(1);

        await wait();
        expect(watcherCalls).toBe(1);
      });
    });

    describe("that does support valueOf()", () => {
      it("should not be reevaluated", async () => {
        const date = (scope.date = new Date());
        let watcherCalls = 0;
        scope.$watch("[date]", () => {
          watcherCalls++;
        });

        await wait();
        expect(watcherCalls).toBe(1);

        await wait();
        expect(watcherCalls).toBe(1);
      });

      it("should be reevaluated even when valueOf() changes", async () => {
        scope.date = new Date();
        let watcherCalls = 0;
        scope.$watch("[date]", () => {
          watcherCalls++;
        });

        await wait();
        expect(watcherCalls).toBe(1);

        scope.date = new Date();

        await wait();
        expect(watcherCalls).toBe(2);
      });

      xit("should be reevaluated when the instance changes but valueOf() does not", async () => {
        scope.date = new Date(1234567890123);
        let watcherCalls = 0;
        scope.$watch("[date]", (input) => {
          watcherCalls++;
        });

        await wait();
        expect(watcherCalls).toBe(1);

        scope.date = new Date(1234567890123);
        await wait();
        expect(watcherCalls).toBe(1);
      });

      xit("should be reevaluated when the instance does not change but valueOf() does", async () => {
        scope.date = new Date(1234567890123);
        let watcherCalls = 0;
        scope.$watch("[date]", () => {
          watcherCalls++;
        });

        await wait();
        expect(watcherCalls).toBe(1);

        scope.date.setTime(scope.date.getTime() + 1);
        await wait();
        expect(watcherCalls).toBe(2);
      });
    });

    xit("should invoke all statements in multi-statement expressions", async () => {
      let lastVal = NaN;
      const listener = function (val) {
        lastVal = val;
      };

      scope.setBarToOne = false;
      scope.bar = 0;
      scope.two = 2;
      scope.foo = function () {
        if (scope.setBarToOne) scope.bar = 1;
      };

      scope.$watch("foo(); bar + two", listener);

      await wait();
      expect(lastVal).toBe(2);

      scope.bar = 2;
      await wait();
      expect(lastVal).toBe(4);

      scope.setBarToOne = true;
      await wait();
      expect(lastVal).toBe(3);
    });

    xit("should watch the left side of assignments", async () => {
      let lastVal = NaN;
      const listener = function (val) {
        lastVal = val;
      };

      const objA = {};
      const objB = {};

      scope.$watch("curObj.value = input", () => {});

      scope.curObj = objA;
      scope.input = 1;
      await wait();
      expect(objA.value).toBe(scope.input);

      scope.curObj = objB;
      await wait();
      expect(objB.value).toBe(scope.input);

      scope.input = 2;
      await wait();
      expect(objB.value).toBe(scope.input);
    });

    it("should watch ES6 object computed property changes", async () => {
      let count = 0;
      let lastValue;

      scope.$watch("{[a]: true}", (val) => {
        count++;
        lastValue = val;
      });

      await wait();
      expect(count).toBe(1);
      expect(lastValue).toEqual({ undefined: true });

      await wait();
      expect(count).toBe(1);
      expect(lastValue).toEqual({ undefined: true });

      scope.a = true;
      await wait();
      expect(count).toBe(2);
      expect(lastValue).toEqual({ true: true });

      scope.a = "abc";
      await wait();
      expect(count).toBe(3);
      expect(lastValue).toEqual({ abc: true });

      scope.a = undefined;
      await wait();
      expect(count).toBe(4);
      expect(lastValue).toEqual({ undefined: true });
    });

    it("should not shallow-watch ES6 object computed properties in case of stateful toString", async () => {
      let count = 0;
      let lastValue;

      scope.$watch("{[a]: true}", (val) => {
        count++;
        lastValue = val;
      });

      scope.a = {
        toString() {
          return this.b;
        },
      };
      scope.a.b = 1;
      await wait();

      expect(lastValue).toEqual({ 1: true });
      scope.$apply("a.b = 2");
      await wait();
      expect(lastValue).toEqual({ 2: true });
    });

    describe("locals", () => {
      it("should expose local variables", () => {
        expect($parse("a")({ a: 0 }, { a: 1 })).toEqual(1);
        expect(
          $parse("add(a,b)")(
            {
              b: 1,
              add(a, b) {
                return a + b;
              },
            },
            { a: 2 },
          ),
        ).toEqual(3);
      });

      it("should expose traverse locals", () => {
        expect($parse("a.b")({ a: { b: 0 } }, { a: { b: 1 } })).toEqual(1);
        expect($parse("a.b")({ a: null }, { a: { b: 1 } })).toEqual(1);
        expect($parse("a.b")({ a: { b: 0 } }, { a: null })).toEqual(undefined);
        expect($parse("a.b.c")({ a: null }, { a: { b: { c: 1 } } })).toEqual(1);
      });

      it("should not use locals to resolve object properties", () => {
        expect($parse("a[0].b")({ a: [{ b: "scope" }] }, { b: "locals" })).toBe(
          "scope",
        );
        expect(
          $parse('a[0]["b"]')({ a: [{ b: "scope" }] }, { b: "locals" }),
        ).toBe("scope");
        expect(
          $parse("a[0][0].b")({ a: [[{ b: "scope" }]] }, { b: "locals" }),
        ).toBe("scope");
        expect(
          $parse("a[0].b.c")(
            { a: [{ b: { c: "scope" } }] },
            { b: { c: "locals" } },
          ),
        ).toBe("scope");
      });

      it("should assign directly to locals when the local property exists", () => {
        const s = {};
        const l = {};

        $parse("a = 1")(s, l);
        expect(s.a).toBe(1);
        expect(l.a).toBeUndefined();

        l.a = 2;
        $parse("a = 0")(s, l);
        expect(s.a).toBe(1);
        expect(l.a).toBe(0);

        $parse("toString = 1")(s, l);
        expect(isFunction(s.toString)).toBe(true);
        expect(l.toString).toBe(1);
      });

      it("should overwrite undefined / null scope properties when assigning", () => {
        let scope;

        scope = {};
        $parse("a.b = 1")(scope);
        $parse('c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: 1 }, c: { d: 2 } });

        scope = { a: {} };
        $parse("a.b.c = 1")(scope);
        $parse('a.c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: { c: 1 }, c: { d: 2 } } });

        scope = { a: undefined, c: undefined };
        $parse("a.b = 1")(scope);
        $parse('c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: 1 }, c: { d: 2 } });

        scope = { a: { b: undefined, c: undefined } };
        $parse("a.b.c = 1")(scope);
        $parse('a.c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: { c: 1 }, c: { d: 2 } } });

        scope = { a: null, c: null };
        $parse("a.b = 1")(scope);
        $parse('c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: 1 }, c: { d: 2 } });

        scope = { a: { b: null, c: null } };
        $parse("a.b.c = 1")(scope);
        $parse('a.c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: { c: 1 }, c: { d: 2 } } });
      });

      [0, false, "", NaN].forEach((falsyValue) => {
        it("should not overwrite $prop scope properties when assigning", () => {
          let scope;

          scope = { a: falsyValue, c: falsyValue };
          tryParseAndIgnoreException("a.b = 1");
          tryParseAndIgnoreException('c["d"] = 2');
          expect(scope).toEqual({ a: falsyValue, c: falsyValue });

          scope = { a: { b: falsyValue, c: falsyValue } };
          tryParseAndIgnoreException("a.b.c = 1");
          tryParseAndIgnoreException('a.c["d"] = 2');
          expect(scope).toEqual({ a: { b: falsyValue, c: falsyValue } });

          // Helpers
          //
          // Normally assigning property on a primitive should throw exception in strict mode
          // and silently fail in non-strict mode, IE seems to always have the non-strict-mode behavior,
          // so if we try to use 'expect(() => {$parse('a.b=1')({a:false});).toThrow()' for testing
          // the test will fail in case of IE because it will not throw exception, and if we just use
          // '$parse('a.b=1')({a:false})' the test will fail because it will throw exception in case of Chrome
          // so we use tryParseAndIgnoreException helper to catch the exception silently for all cases.
          //
          function tryParseAndIgnoreException(expression) {
            try {
              $parse(expression)(scope);
            } catch (error) {
              /* ignore exception */
            }
          }
        });
      });
    });

    describe("literal", () => {
      it("should mark scalar value expressions as literal", () => {
        expect($parse("0").literal).toBe(true);
        expect($parse('"hello"').literal).toBe(true);
        expect($parse("true").literal).toBe(true);
        expect($parse("false").literal).toBe(true);
        expect($parse("null").literal).toBe(true);
        expect($parse("undefined").literal).toBe(true);
      });

      it("should mark array expressions as literal", () => {
        expect($parse("[]").literal).toBe(true);
        expect($parse("[1, 2, 3]").literal).toBe(true);
        expect($parse("[1, identifier]").literal).toBe(true);
      });

      it("should mark object expressions as literal", () => {
        expect($parse("{}").literal).toBe(true);
        expect($parse("{x: 1}").literal).toBe(true);
        expect($parse("{foo: bar}").literal).toBe(true);
      });

      it("should not mark function calls or operator expressions as literal", () => {
        expect($parse("1 + 1").literal).toBe(false);
        expect($parse("call()").literal).toBe(false);
        expect($parse("[].length").literal).toBe(false);
      });
    });

    describe("constant", () => {
      it("should mark an empty expressions as constant", () => {
        expect($parse("").constant).toBe(true);
        expect($parse("   ").constant).toBe(true);
      });

      it("should mark scalar value expressions as constant", () => {
        expect($parse("12.3").constant).toBe(true);
        expect($parse('"string"').constant).toBe(true);
        expect($parse("true").constant).toBe(true);
        expect($parse("false").constant).toBe(true);
        expect($parse("null").constant).toBe(true);
        expect($parse("undefined").constant).toBe(true);
      });

      it("should mark arrays as constant if they only contain constant elements", () => {
        expect($parse("[]").constant).toBe(true);
        expect($parse("[1, 2, 3]").constant).toBe(true);
        expect($parse('["string", null]').constant).toBe(true);
        expect($parse("[[]]").constant).toBe(true);
        expect($parse("[1, [2, 3], {4: 5}]").constant).toBe(true);
      });

      it("should not mark arrays as constant if they contain any non-constant elements", () => {
        expect($parse("[foo]").constant).toBe(false);
        expect($parse("[x + 1]").constant).toBe(false);
        expect($parse("[bar[0]]").constant).toBe(false);
      });

      it("should mark complex expressions involving constant values as constant", () => {
        expect($parse("!true").constant).toBe(true);
        expect($parse("-42").constant).toBe(true);
        expect($parse("1 - 1").constant).toBe(true);
        expect($parse('"foo" + "bar"').constant).toBe(true);
        expect($parse("5 != null").constant).toBe(true);
        expect($parse("{standard: 4/3, wide: 16/9}").constant).toBe(true);
        expect($parse("{[standard]: 4/3, wide: 16/9}").constant).toBe(false);
        expect($parse('{["key"]: 1}').constant).toBe(true);
        expect($parse("[0].length").constant).toBe(true);
        expect($parse("[0][0]").constant).toBe(true);
        expect($parse("{x: 1}.x").constant).toBe(true);
        expect($parse('{x: 1}["x"]').constant).toBe(true);
      });

      it("should not mark any expression involving variables or function calls as constant", () => {
        expect($parse("true.toString()").constant).toBe(false);
        expect($parse("foo(1, 2, 3)").constant).toBe(false);
        expect($parse('"name" + id').constant).toBe(false);
      });
    });

    describe("null/undefined in expressions", () => {
      // simpleGetterFn1
      it("should return null for `a` where `a` is null", () => {
        $rootScope.a = null;
        expect($rootScope.$eval("a")).toBe(null);
      });

      it("should return undefined for `a` where `a` is undefined", () => {
        expect($rootScope.$eval("a")).toBeUndefined();
      });

      // simpleGetterFn2
      it("should return undefined for properties of `null` constant", () => {
        expect($rootScope.$eval("null.a")).toBeUndefined();
      });

      it("should return undefined for properties of `null` values", () => {
        $rootScope.a = null;
        expect($rootScope.$eval("a.b")).toBeUndefined();
      });

      it("should return null for `a.b` where `b` is null", () => {
        $rootScope.a = { b: null };
        expect($rootScope.$eval("a.b")).toBe(null);
      });

      // cspSafeGetter && pathKeys.length < 6 || pathKeys.length > 2
      it("should return null for `a.b.c.d.e` where `e` is null", () => {
        $rootScope.a = { b: { c: { d: { e: null } } } };
        expect($rootScope.$eval("a.b.c.d.e")).toBe(null);
      });

      it("should return undefined for `a.b.c.d.e` where `d` is null", () => {
        $rootScope.a = { b: { c: { d: null } } };
        expect($rootScope.$eval("a.b.c.d.e")).toBeUndefined();
      });

      // cspSafeGetter || pathKeys.length > 6
      it("should return null for `a.b.c.d.e.f.g` where `g` is null", () => {
        $rootScope.a = { b: { c: { d: { e: { f: { g: null } } } } } };
        expect($rootScope.$eval("a.b.c.d.e.f.g")).toBe(null);
      });

      it("should return undefined for `a.b.c.d.e.f.g` where `f` is null", () => {
        $rootScope.a = { b: { c: { d: { e: { f: null } } } } };
        expect($rootScope.$eval("a.b.c.d.e.f.g")).toBeUndefined();
      });

      it("should return undefined if the return value of a function invocation is undefined", () => {
        $rootScope.fn = function () {};
        expect($rootScope.$eval("fn()")).toBeUndefined();
      });

      it("should ignore undefined values when doing addition/concatenation", () => {
        $rootScope.fn = function () {};
        expect($rootScope.$eval('foo + "bar" + fn()')).toBe("bar");
      });

      it("should treat properties named null/undefined as normal properties", () => {
        expect(
          $rootScope.$eval("a.null.undefined.b", {
            a: { null: { undefined: { b: 1 } } },
          }),
        ).toBe(1);
      });

      it("should not allow overriding null/undefined keywords", () => {
        expect($rootScope.$eval("null.a", { null: { a: 42 } })).toBeUndefined();
      });

      it("should allow accessing null/undefined properties on `this`", () => {
        $rootScope.null = { a: 42 };
        expect($rootScope.$eval("this.null.a")).toBe(42);
      });

      it("should allow accessing $locals", () => {
        $rootScope.foo = "foo";
        $rootScope.bar = "bar";
        $rootScope.$locals = "foo";
        const locals = { foo: 42 };
        expect($rootScope.$eval("$locals")).toBeUndefined();
        expect($rootScope.$eval("$locals.foo")).toBeUndefined();
        expect($rootScope.$eval("this.$locals")).toBe("foo");
        expect(() => {
          $rootScope.$eval("$locals = {}");
        }).toThrow();
        expect(() => {
          $rootScope.$eval("$locals.bar = 23");
        }).toThrow();
        expect($rootScope.$eval("$locals", locals)).toBe(locals);
        expect($rootScope.$eval("$locals.foo", locals)).toBe(42);
        expect($rootScope.$eval("this.$locals", locals)).toBe("foo");
        expect(() => {
          $rootScope.$eval("$locals = {}", locals);
        }).toThrow();
        expect($rootScope.$eval("$locals.bar = 23", locals)).toEqual(23);
        expect(locals.bar).toBe(23);
      });
    });

    [true, false].forEach((cspEnabled) => {
      describe(`custom identifiers (csp: ${cspEnabled})`, () => {
        const isIdentifierStartRe = /[#a-z]/;
        const isIdentifierContinueRe = /[-a-z]/;
        let isIdentifierStartFn;
        let isIdentifierContinueFn;
        let scope;

        beforeEach(() => {
          createInjector([
            "ng",
            function ($parseProvider) {
              isIdentifierStartFn = jasmine
                .createSpy("isIdentifierStart")
                .and.callFake((ch, cp) => isIdentifierStartRe.test(ch));
              isIdentifierContinueFn = jasmine
                .createSpy("isIdentifierContinue")
                .and.callFake((ch, cp) => isIdentifierContinueRe.test(ch));

              $parseProvider.setIdentifierFns(
                isIdentifierStartFn,
                isIdentifierContinueFn,
              );
              csp().noUnsafeEval = cspEnabled;
            },
          ]).invoke((_$rootScope_) => {
            scope = _$rootScope_;
          });
        });

        it("should allow specifying a custom `isIdentifierStart/Continue` functions", () => {
          scope.x = {};

          scope["#foo"] = "foo";
          scope.x["#foo"] = "foo";
          expect(scope.$eval("#foo")).toBe("foo");
          expect(scope.$eval("x.#foo")).toBe("foo");

          scope["bar--"] = 42;
          scope.x["bar--"] = 42;
          expect(scope.$eval("bar--")).toBe(42);
          expect(scope.$eval("x.bar--")).toBe(42);
          expect(scope["bar--"]).toBe(42);
          expect(scope.x["bar--"]).toBe(42);

          scope["#-"] = "baz";
          scope.x["#-"] = "baz";
          expect(scope.$eval("#-")).toBe("baz");
          expect(scope.$eval("x.#-")).toBe("baz");

          expect(() => {
            scope.$eval("##");
          }).toThrow();
          expect(() => {
            scope.$eval("x.##");
          }).toThrow();

          expect(() => {
            scope.$eval("--");
          }).toThrow();
          expect(() => {
            scope.$eval("x.--");
          }).toThrow();
        });

        it("should pass the character and codepoint to the custom functions", () => {
          scope.$eval("#-");
          expect(isIdentifierStartFn).toHaveBeenCalledOnceWith(
            "#",
            "#".charCodeAt(0),
          );
          expect(isIdentifierContinueFn).toHaveBeenCalledOnceWith(
            "-",
            "-".charCodeAt(0),
          );

          isIdentifierStartFn.calls.reset();
          isIdentifierContinueFn.calls.reset();

          scope.$eval("#.foo.#-.bar-");
          expect(isIdentifierStartFn).toHaveBeenCalledTimes(7);
          expect(isIdentifierStartFn.calls.allArgs()).toEqual([
            ["#", "#".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["f", "f".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["#", "#".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["b", "b".charCodeAt(0)],
          ]);
          expect(isIdentifierContinueFn).toHaveBeenCalledTimes(9);
          expect(isIdentifierContinueFn.calls.allArgs()).toEqual([
            [".", ".".charCodeAt(0)],
            ["o", "o".charCodeAt(0)],
            ["o", "o".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["-", "-".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["a", "a".charCodeAt(0)],
            ["r", "r".charCodeAt(0)],
            ["-", "-".charCodeAt(0)],
          ]);
        });
      });
    });
  });
});
