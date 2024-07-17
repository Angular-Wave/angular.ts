import {
  csp,
  forEach,
  isDefined,
  isFunction,
  minErr,
} from "../../shared/utils";
import { getValueOf, PURITY_RELATIVE } from "./shared";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

export const $parseMinErr = minErr("$parse");

/// ////////////////////////////////

/**
 * @typedef {function(string|function(import('../scope/scope').Scope):any, function(any, Scope, any):any=, boolean=): import('../../types').CompiledExpression} ParseService
 */

/**
 * @ngdoc service
 * @name $parse
 * @kind function
 *
 * @description
 *
 * Converts AngularJS {@link guide/expression expression} into a function.
 *
 * ```js
 *   let getter = $parse('user.name');
 *   let setter = getter.assign;
 *   let context = {user:{name:'AngularJS'}};
 *   let locals = {user:{name:'local'}};
 *
 *   expect(getter(context)).toEqual('AngularJS');
 *   setter(context, 'newValue');
 *   expect(context.user.name).toEqual('newValue');
 *   expect(getter(context, locals)).toEqual('local');
 * ```
 *
 *
 * @param {string} expression String expression to compile.
 * @returns {function(context, locals)} a function which represents the compiled expression:
 *
 *    * `context` – `{object}` – an object against which any expressions embedded in the strings
 *      are evaluated against (typically a scope object).
 *    * `locals` – `{object=}` – local variables context object, useful for overriding values in
 *      `context`.
 *
 *    The returned function also has the following properties:
 *      * `literal` – `{boolean}` – whether the expression's top-level node is a JavaScript
 *        literal.
 *      * `constant` – `{boolean}` – whether the expression is made entirely of JavaScript
 *        constant literals.
 *      * `assign` – `{?function(context, value)}` – if the expression is assignable, this will be
 *        set to a function to change its value on the given context.
 *
 */

export const literals = {
  true: true,
  false: false,
  null: null,
  undefined,
};

/**
 * @ngdoc provider
 * @name $parseProvider
 *
 *
 * @description
 * `$parseProvider` can be used for configuring the default behavior of the {@link ng.$parse $parse}
 *  service.
 */
export function $ParseProvider() {
  const cache = Object.create(null);
  const literals = {
    true: true,
    false: false,
    null: null,
    undefined: undefined,
  };
  var identStart, identContinue;

  /**
   * @ngdoc method
   * @name $parseProvider#addLiteral
   * @description
   *
   * Configure $parse service to add literal values that will be present as literal at expressions.
   *
   * @param {string} literalName Token for the literal value. The literal name value must be a valid literal name.
   * @param {*} literalValue Value for this literal. All literal values must be primitives or `undefined`.
   *
   **/
  this.addLiteral = function (literalName, literalValue) {
    literals[literalName] = literalValue;
  };

  /**
   * @ngdoc method
   * @name $parseProvider#setIdentifierFns
   *
   * @description
   *
   * Allows defining the set of characters that are allowed in AngularJS expressions. The function
   * `identifierStart` will get called to know if a given character is a valid character to be the
   * first character for an identifier. The function `identifierContinue` will get called to know if
   * a given character is a valid character to be a follow-up identifier character. The functions
   * `identifierStart` and `identifierContinue` will receive as arguments the single character to be
   * identifier and the character code point. These arguments will be `string` and `numeric`. Keep in
   * mind that the `string` parameter can be two characters long depending on the character
   * representation. It is expected for the function to return `true` or `false`, whether that
   * character is allowed or not.
   *
   * Since this function will be called extensively, keep the implementation of these functions fast,
   * as the performance of these functions have a direct impact on the expressions parsing speed.
   *
   * @param {function=} identifierStart The function that will decide whether the given character is
   *   a valid identifier start character.
   * @param {function=} identifierContinue The function that will decide whether the given character is
   *   a valid identifier continue character.
   */
  this.setIdentifierFns = function (identifierStart, identifierContinue) {
    identStart = identifierStart;
    identContinue = identifierContinue;
    return this;
  };

  this.$get = [
    "$filter",
    function ($filter) {
      var noUnsafeEval = csp().noUnsafeEval;
      var $parseOptions = {
        csp: noUnsafeEval,
        literals: structuredClone(literals),
        isIdentifierStart: isFunction(identStart) && identStart,
        isIdentifierContinue: isFunction(identContinue) && identContinue,
      };
      $parse.$$getAst = $$getAst;
      return $parse;

      function $parse(exp, interceptorFn) {
        var parsedExpression, cacheKey;

        switch (typeof exp) {
          case "string":
            exp = exp.trim();
            cacheKey = exp;

            parsedExpression = cache[cacheKey];

            if (!parsedExpression) {
              var lexer = new Lexer($parseOptions);
              var parser = new Parser(lexer, $filter, $parseOptions);
              parsedExpression = parser.parse(exp);

              cache[cacheKey] = addWatchDelegate(parsedExpression);
            }
            return addInterceptor(parsedExpression, interceptorFn);

          case "function":
            return addInterceptor(exp, interceptorFn);

          default:
            return addInterceptor(() => {}, interceptorFn);
        }
      }

      function $$getAst(exp) {
        var lexer = new Lexer($parseOptions);
        var parser = new Parser(lexer, $filter, $parseOptions);
        return parser.getAst(exp).ast;
      }

      function expressionInputDirtyCheck(
        newValue,
        oldValueOfValue,
        compareObjectIdentity,
      ) {
        if (newValue == null || oldValueOfValue == null) {
          // null/undefined
          return newValue === oldValueOfValue;
        }

        if (typeof newValue === "object") {
          // attempt to convert the value to a primitive type
          // TODO(docs): add a note to docs that by implementing valueOf even objects and arrays can
          //             be cheaply dirty-checked
          newValue = getValueOf(newValue);

          if (typeof newValue === "object" && !compareObjectIdentity) {
            // objects/arrays are not supported - deep-watching them would be too expensive
            return false;
          }

          // fall-through to the primitive equality check
        }

        //Primitive or NaN

        return (
          newValue === oldValueOfValue ||
          (newValue !== newValue && oldValueOfValue !== oldValueOfValue)
        );
      }

      function inputsWatchDelegate(
        scope,
        listener,
        objectEquality,
        parsedExpression,
      ) {
        var inputExpressions = parsedExpression.inputs;
        var lastResult;

        if (inputExpressions.length === 1) {
          var oldInputValueOf = expressionInputDirtyCheck; // init to something unique so that equals check fails
          inputExpressions = inputExpressions[0];
          return scope.$watch(
            function expressionInputWatch(scope) {
              var newInputValue = inputExpressions(scope);
              if (
                !expressionInputDirtyCheck(
                  newInputValue,
                  oldInputValueOf,
                  inputExpressions.isPure,
                )
              ) {
                lastResult = parsedExpression(scope, undefined, undefined, [
                  newInputValue,
                ]);
                oldInputValueOf = newInputValue && getValueOf(newInputValue);
              }
              return lastResult;
            },
            listener,
            objectEquality,
          );
        }

        var oldInputValueOfValues = [];
        var oldInputValues = [];
        for (var i = 0, ii = inputExpressions.length; i < ii; i++) {
          oldInputValueOfValues[i] = expressionInputDirtyCheck; // init to something unique so that equals check fails
          oldInputValues[i] = null;
        }

        return scope.$watch(
          function expressionInputsWatch(scope) {
            var changed = false;

            for (var i = 0, ii = inputExpressions.length; i < ii; i++) {
              var newInputValue = inputExpressions[i](scope);
              if (
                changed ||
                (changed = !expressionInputDirtyCheck(
                  newInputValue,
                  oldInputValueOfValues[i],
                  inputExpressions[i].isPure,
                ))
              ) {
                oldInputValues[i] = newInputValue;
                oldInputValueOfValues[i] =
                  newInputValue && getValueOf(newInputValue);
              }
            }

            if (changed) {
              lastResult = parsedExpression(
                scope,
                undefined,
                undefined,
                oldInputValues,
              );
            }

            return lastResult;
          },
          listener,
          objectEquality,
        );
      }

      function oneTimeWatchDelegate(
        scope,
        listener,
        objectEquality,
        parsedExpression,
      ) {
        var isDone = parsedExpression.literal ? isAllDefined : isDefined;
        var unwatch, lastValue;

        var exp = parsedExpression.$$intercepted || parsedExpression;
        var post = parsedExpression.$$interceptor || ((x) => x);

        var useInputs = parsedExpression.inputs && !exp.inputs;

        // Propagate the literal/inputs/constant attributes
        // ... but not oneTime since we are handling it
        oneTimeWatch.literal = parsedExpression.literal;
        oneTimeWatch.constant = parsedExpression.constant;
        oneTimeWatch.inputs = parsedExpression.inputs;

        // Allow other delegates to run on this wrapped expression
        addWatchDelegate(oneTimeWatch);

        unwatch = scope.$watch(oneTimeWatch, listener, objectEquality);

        return unwatch;

        function unwatchIfDone() {
          if (isDone(lastValue)) {
            unwatch();
          }
        }

        function oneTimeWatch(scope, locals, assign, inputs) {
          lastValue =
            useInputs && inputs
              ? inputs[0]
              : exp(scope, locals, assign, inputs);
          if (isDone(lastValue)) {
            scope.$$postDigest(unwatchIfDone);
          }
          return post(lastValue);
        }
      }

      function isAllDefined(value) {
        var allDefined = true;
        forEach(value, function (val) {
          if (!isDefined(val)) allDefined = false;
        });
        return allDefined;
      }

      function constantWatchDelegate(
        scope,
        listener,
        objectEquality,
        parsedExpression,
      ) {
        var unwatch = scope.$watch(
          function constantWatch(scope) {
            unwatch();
            return parsedExpression(scope);
          },
          listener,
          objectEquality,
        );
        return unwatch;
      }

      function addWatchDelegate(parsedExpression) {
        if (parsedExpression.constant) {
          parsedExpression.$$watchDelegate = constantWatchDelegate;
        } else if (parsedExpression.oneTime) {
          parsedExpression.$$watchDelegate = oneTimeWatchDelegate;
        } else if (parsedExpression.inputs) {
          parsedExpression.$$watchDelegate = inputsWatchDelegate;
        }

        return parsedExpression;
      }

      function chainInterceptors(first, second) {
        function chainedInterceptor(value) {
          return second(first(value));
        }
        chainedInterceptor.$stateful = first.$stateful || second.$stateful;
        chainedInterceptor.$$pure = first.$$pure && second.$$pure;

        return chainedInterceptor;
      }

      function addInterceptor(parsedExpression, interceptorFn) {
        if (!interceptorFn) return parsedExpression;

        // Extract any existing interceptors out of the parsedExpression
        // to ensure the original parsedExpression is always the $$intercepted
        if (parsedExpression.$$interceptor) {
          interceptorFn = chainInterceptors(
            parsedExpression.$$interceptor,
            interceptorFn,
          );
          parsedExpression = parsedExpression.$$intercepted;
        }

        var useInputs = false;

        var fn = function interceptedExpression(scope, locals, assign, inputs) {
          var value =
            useInputs && inputs
              ? inputs[0]
              : parsedExpression(scope, locals, assign, inputs);
          return interceptorFn(value);
        };

        // Maintain references to the interceptor/intercepted
        fn.$$intercepted = parsedExpression;
        fn.$$interceptor = interceptorFn;

        // Propagate the literal/oneTime/constant attributes
        fn.literal = parsedExpression.literal;
        fn.oneTime = parsedExpression.oneTime;
        fn.constant = parsedExpression.constant;

        // Treat the interceptor like filters.
        // If it is not $stateful then only watch its inputs.
        // If the expression itself has no inputs then use the full expression as an input.
        if (!interceptorFn.$stateful) {
          useInputs = !parsedExpression.inputs;
          fn.inputs = parsedExpression.inputs
            ? parsedExpression.inputs
            : [parsedExpression];

          if (!interceptorFn.$$pure) {
            fn.inputs = fn.inputs.map(function (e) {
              // Remove the isPure flag of inputs when it is not absolute because they are now wrapped in a
              // non-pure interceptor function.
              if (e.isPure === PURITY_RELATIVE) {
                return function depurifier(s) {
                  return e(s);
                };
              }
              return e;
            });
          }
        }

        return addWatchDelegate(fn);
      }
    },
  ];
}

function constantWatchDelegate(
  scope,
  listener,
  objectEquality,
  parsedExpression,
) {
  const unwatch = scope.$watch(
    ($scope) => {
      unwatch();
      return parsedExpression($scope);
    },
    listener,
    objectEquality,
  );
  return unwatch;
}

function addWatchDelegate(parsedExpression) {
  if (parsedExpression.constant) {
    parsedExpression.$$watchDelegate = constantWatchDelegate;
  } else if (parsedExpression.oneTime) {
    parsedExpression.$$watchDelegate = oneTimeWatchDelegate;
  } else if (parsedExpression.inputs) {
    parsedExpression.$$watchDelegate = inputsWatchDelegate;
  }

  return parsedExpression;
}

export function inputsWatchDelegate(
  scope,
  listener,
  objectEquality,
  parsedExpression,
) {
  let inputExpressions = parsedExpression.inputs;
  let lastResult;

  if (inputExpressions.length === 1) {
    let oldInputValueOf = expressionInputDirtyCheck; // init to something unique so that equals check fails

    inputExpressions = inputExpressions[0];
    return scope.$watch(
      ($scope) => {
        const newInputValue = inputExpressions($scope);
        if (
          !expressionInputDirtyCheck(
            newInputValue,
            oldInputValueOf,
            inputExpressions.isPure,
          )
        ) {
          lastResult = parsedExpression($scope, undefined, undefined, [
            newInputValue,
          ]);
          oldInputValueOf = newInputValue && getValueOf(newInputValue);
        }
        return lastResult;
      },
      listener,
      objectEquality,
    );
  }

  const oldInputValueOfValues = [];
  const oldInputValues = [];
  for (let i = 0, ii = inputExpressions.length; i < ii; i++) {
    oldInputValueOfValues[i] = expressionInputDirtyCheck; // init to something unique so that equals check fails
    oldInputValues[i] = null;
  }

  return scope.$watch(
    (scope) => {
      let changed = false;

      for (let i = 0, ii = inputExpressions.length; i < ii; i++) {
        const newInputValue = inputExpressions[i](scope);
        if (
          changed ||
          (changed = !expressionInputDirtyCheck(
            newInputValue,
            oldInputValueOfValues[i],
            inputExpressions[i].isPure,
          ))
        ) {
          oldInputValues[i] = newInputValue;
          oldInputValueOfValues[i] = newInputValue && getValueOf(newInputValue);
        }
      }

      if (changed) {
        lastResult = parsedExpression(
          scope,
          undefined,
          undefined,
          oldInputValues,
        );
      }

      return lastResult;
    },
    listener,
    objectEquality,
  );
}

export function oneTimeWatchDelegate(
  scope,
  listener,
  objectEquality,
  parsedExpression,
) {
  const isDone = parsedExpression.literal ? isAllDefined : isDefined;

  let unwatch;
  let lastValue;

  const exp = parsedExpression.$$intercepted || parsedExpression;
  const post = parsedExpression.$$interceptor || ((x) => x);

  const useInputs = parsedExpression.inputs && !exp.inputs;

  // Propagate the literal/inputs/constant attributes
  // ... but not oneTime since we are handling it
  oneTimeWatch.literal = parsedExpression.literal;
  oneTimeWatch.constant = parsedExpression.constant;
  oneTimeWatch.inputs = parsedExpression.inputs;

  // Allow other delegates to run on this wrapped expression
  addWatchDelegate(oneTimeWatch);

  function unwatchIfDone() {
    if (isDone(lastValue)) {
      unwatch();
    }
  }

  function oneTimeWatch(scope, locals, assign, inputs) {
    lastValue =
      useInputs && inputs ? inputs[0] : exp(scope, locals, assign, inputs);
    if (isDone(lastValue)) {
      scope.$$postDigest(unwatchIfDone);
    }
    return post(lastValue);
  }

  unwatch = scope.$watch(oneTimeWatch, listener, objectEquality);

  return unwatch;
}

export function chainInterceptors(first, second) {
  function chainedInterceptor(value) {
    return second(first(value));
  }
  chainedInterceptor.$stateful = first.$stateful || second.$stateful;
  chainedInterceptor.$$pure = first.$$pure && second.$$pure;

  return chainedInterceptor;
}

export function expressionInputDirtyCheck(
  newValue,
  oldValueOfValue,
  compareObjectIdentity,
) {
  if (newValue == null || oldValueOfValue == null) {
    // null/undefined
    return newValue === oldValueOfValue;
  }

  if (typeof newValue === "object") {
    // attempt to convert the value to a primitive type
    // TODO(docs): add a note to docs that by implementing valueOf even objects and arrays can
    //             be cheaply dirty-checked
    newValue = getValueOf(newValue);

    if (typeof newValue === "object" && !compareObjectIdentity) {
      // objects/arrays are not supported - deep-watching them would be too expensive
      return false;
    }

    // fall-through to the primitive equality check
  }

  // Primitive or NaN

  return (
    newValue === oldValueOfValue ||
    (newValue !== newValue && oldValueOfValue !== oldValueOfValue)
  );
}

export function isAllDefined(value) {
  let allDefined = true;
  forEach(value, (val) => {
    if (!isDefined(val)) allDefined = false;
  });
  return allDefined;
}
