import { isDefined } from "../../shared/utils";
import { ASTType } from "./ast-type";

export const PURITY_ABSOLUTE = 1;
export const PURITY_RELATIVE = 2;

export class ASTInterpreter {
  /**
   * @param {function(any):any} $filter
   */
  constructor($filter) {
    this.$filter = $filter;
  }

  /**
   * Compiles the AST into a function.
   * @param {import("./ast").ASTNode} ast - The AST to compile.
   * @returns {import("./parse").CompiledExpression}
   */
  compile(ast) {
    findConstantAndWatchExpressions(ast, this.$filter);
    let assignable;
    let assign;
    if ((assignable = assignableAST(ast))) {
      assign = this.recurse(assignable);
    }
    const toWatch = getInputs(ast.body);
    let inputs;
    if (toWatch) {
      inputs = [];
      for (const [key, watch] of Object.entries(toWatch)) {
        const input = this.recurse(watch);
        input.isPure = watch.isPure;
        watch.input = input;
        inputs.push(input);
        watch.watchId = key;
      }
    }
    const expressions = [];
    ast.body.forEach((expression) => {
      expressions.push(this.recurse(expression.expression));
    });

    /** @type {import("./parse").CompiledExpression} */
    const fn =
      ast.body.length === 0
        ? () => {}
        : ast.body.length === 1
          ? expressions[0]
          : function (scope, locals) {
              let lastValue;
              expressions.forEach((exp) => {
                lastValue = exp(scope, locals);
              });
              return lastValue;
            };
    if (assign) {
      fn.assign = (scope, value, locals) => assign(scope, locals, value);
    }
    if (inputs) {
      fn.inputs = inputs;
    }
    return fn;
  }

  /**
   * Recurses the AST nodes.
   * @param {import("./ast").ASTNode} ast - The AST node.
   * @param {Object} [context] - The context.
   * @param {boolean|number} [create] - The create flag.
   * @returns {function} The recursive function.
   */
  recurse(ast, context, create) {
    let left;
    let right;
    const self = this;
    let args;
    if (ast.input) {
      return this.inputs(ast.input, ast.watchId);
    }
    switch (ast.type) {
      case ASTType.Literal:
        return this.value(ast.value, context);
      case ASTType.UnaryExpression:
        right = this.recurse(ast.argument);
        return this[`unary${ast.operator}`](right, context);
      case ASTType.BinaryExpression:
        left = this.recurse(ast.left);
        right = this.recurse(ast.right);
        return this[`binary${ast.operator}`](left, right, context);
      case ASTType.LogicalExpression:
        left = this.recurse(ast.left);
        right = this.recurse(ast.right);
        return this[`binary${ast.operator}`](left, right, context);
      case ASTType.ConditionalExpression:
        return this["ternary?:"](
          this.recurse(ast.test),
          this.recurse(ast.alternate),
          this.recurse(ast.consequent),
          context,
        );
      case ASTType.Identifier:
        return self.identifier(ast.name, context, create);
      case ASTType.MemberExpression:
        left = this.recurse(ast.object, false, !!create);
        if (!ast.computed) {
          right = ast.property.name;
        }
        if (ast.computed) right = this.recurse(ast.property);
        return ast.computed
          ? this.computedMember(left, right, context, create)
          : this.nonComputedMember(left, right, context, create);
      case ASTType.CallExpression:
        args = [];
        ast.arguments.forEach((expr) => {
          args.push(self.recurse(expr));
        });
        if (ast.filter) right = this.$filter(ast.callee.name);
        if (!ast.filter) right = this.recurse(ast.callee, true);
        return ast.filter
          ? function (scope, locals, assign, inputs) {
              const values = [];
              for (let i = 0; i < args.length; ++i) {
                values.push(args[i](scope, locals, assign, inputs));
              }
              const value = right.apply(undefined, values, inputs);
              return context
                ? { context: undefined, name: undefined, value }
                : value;
            }
          : function (scope, locals, assign, inputs) {
              const rhs = right(scope, locals, assign, inputs);
              let value;
              if (rhs.value != null) {
                const values = [];
                for (let i = 0; i < args.length; ++i) {
                  values.push(args[i](scope, locals, assign, inputs));
                }
                value = rhs.value.apply(rhs.context, values);
              }
              return context ? { value } : value;
            };
      case ASTType.AssignmentExpression:
        left = this.recurse(ast.left, true, 1);
        right = this.recurse(ast.right);
        return function (scope, locals, assign, inputs) {
          const lhs = left(scope, locals, assign, inputs);
          const rhs = right(scope, locals, assign, inputs);
          lhs.context[lhs.name] = rhs;
          return context ? { value: rhs } : rhs;
        };
      case ASTType.ArrayExpression:
        args = [];
        ast.elements.forEach((expr) => {
          args.push(self.recurse(expr));
        });
        return function (scope, locals, assign, inputs) {
          const value = [];
          for (let i = 0; i < args.length; ++i) {
            value.push(args[i](scope, locals, assign, inputs));
          }
          return context ? { value } : value;
        };
      case ASTType.ObjectExpression:
        args = [];
        ast.properties.forEach((property) => {
          if (property.computed) {
            args.push({
              key: self.recurse(property.key),
              computed: true,
              value: self.recurse(property.value),
            });
          } else {
            args.push({
              key:
                property.key.type === ASTType.Identifier
                  ? property.key.name
                  : `${property.key.value}`,
              computed: false,
              value: self.recurse(property.value),
            });
          }
        });
        return function (scope, locals, assign, inputs) {
          const value = {};
          for (let i = 0; i < args.length; ++i) {
            if (args[i].computed) {
              value[args[i].key(scope, locals, assign, inputs)] = args[i].value(
                scope,
                locals,
                assign,
                inputs,
              );
            } else {
              value[args[i].key] = args[i].value(scope, locals, assign, inputs);
            }
          }
          return context ? { value } : value;
        };
      case ASTType.ThisExpression:
        return function (scope) {
          return context ? { value: scope } : scope;
        };
      case ASTType.LocalsExpression:
        return function (scope, locals) {
          return context ? { value: locals } : locals;
        };
      case ASTType.NGValueParameter:
        return function (scope, locals, assign) {
          return context ? { value: assign } : assign;
        };
    }
  }

  /**
   * Unary plus operation.
   * @param {function} argument - The argument function.
   * @param {Object} [context] - The context.
   * @returns {function} The unary plus function.
   */
  "unary+"(argument, context) {
    return function (scope, locals, assign, inputs) {
      let arg = argument(scope, locals, assign, inputs);
      if (isDefined(arg)) {
        arg = +arg;
      } else {
        arg = 0;
      }
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Unary minus operation.
   * @param {function} argument - The argument function.
   * @param {Object} [context] - The context.
   * @returns {function} The unary minus function.
   */
  "unary-"(argument, context) {
    return function (scope, locals, assign, inputs) {
      let arg = argument(scope, locals, assign, inputs);
      if (isDefined(arg)) {
        arg = -arg;
      } else {
        arg = -0;
      }
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Unary negation operation.
   * @param {function} argument - The argument function.
   * @param {Object} [context] - The context.
   * @returns {function} The unary negation function.
   */
  "unary!"(argument, context) {
    return function (scope, locals, assign, inputs) {
      const arg = !argument(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary plus operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary plus function.
   */
  "binary+"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      const rhs = right(scope, locals, assign, inputs);
      const arg = plusFn(lhs, rhs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary minus operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary minus function.
   */
  "binary-"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      const rhs = right(scope, locals, assign, inputs);
      const arg = (isDefined(lhs) ? lhs : 0) - (isDefined(rhs) ? rhs : 0);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary multiplication operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary multiplication function.
   */
  "binary*"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) *
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  "binary/"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) /
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary division operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary division function.
   */
  "binary%"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) %
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary strict equality operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary strict equality function.
   */
  "binary==="(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ===
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary strict inequality operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary strict inequality function.
   */
  "binary!=="(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) !==
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary equality operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary equality function.
   */
  "binary=="(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ==
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary inequality operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary inequality function.
   */
  "binary!="(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) !=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary less-than operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary less-than function.
   */
  "binary<"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) <
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary greater-than operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary greater-than function.
   */
  "binary>"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) >
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary less-than-or-equal-to operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary less-than-or-equal-to function.
   */
  "binary<="(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) <=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary greater-than-or-equal-to operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary greater-than-or-equal-to function.
   */
  "binary>="(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) >=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }
  /**
   * Binary logical AND operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary logical AND function.
   */
  "binary&&"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) &&
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Binary logical OR operation.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @returns {function} The binary logical OR function.
   */
  "binary||"(left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ||
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Ternary conditional operation.
   * @param {function} test - The test function.
   * @param {function} alternate - The alternate function.
   * @param {function} consequent - The consequent function.
   * @param {Object} [context] - The context.
   * @returns {function} The ternary conditional function.
   */
  "ternary?:"(test, alternate, consequent, context) {
    return function (scope, locals, assign, inputs) {
      const arg = test(scope, locals, assign, inputs)
        ? alternate(scope, locals, assign, inputs)
        : consequent(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  }

  /**
   * Returns the value of a literal.
   * @param {*} value - The literal value.
   * @param {Object} [context] - The context.
   * @returns {function} The function returning the literal value.
   */
  value(value, context) {
    return function () {
      return context ? { context: undefined, name: undefined, value } : value;
    };
  }

  /**
   * Returns the value of an identifier.
   * @param {string} name - The identifier name.
   * @param {Object} [context] - The context.
   * @param {boolean} [create] - Whether to create the identifier if it does not exist.
   * @returns {function} The function returning the identifier value.
   */
  identifier(name, context, create) {
    return function (scope, locals) {
      const base = locals && name in locals ? locals : scope;
      if (create && create !== 1 && base && base[name] == null) {
        base[name] = {};
      }
      const value = base ? base[name] : undefined;
      if (context) {
        return { context: base, name, value };
      }
      return value;
    };
  }

  /**
   * Returns the value of a computed member expression.
   * @param {function} left - The left operand function.
   * @param {function} right - The right operand function.
   * @param {Object} [context] - The context.
   * @param {boolean} [create] - Whether to create the member if it does not exist.
   * @returns {function} The function returning the computed member value.
   */
  computedMember(left, right, context, create) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      let rhs;
      let value;
      if (lhs != null) {
        rhs = right(scope, locals, assign, inputs);
        rhs = getStringValue(rhs);
        if (create && create !== 1) {
          if (lhs && !lhs[rhs]) {
            lhs[rhs] = {};
          }
        }
        value = lhs[rhs];
      }
      if (context) {
        return { context: lhs, name: rhs, value };
      }
      return value;
    };
  }

  /**
   * Returns the value of a non-computed member expression.
   * @param {function} left - The left operand function.
   * @param {string} right - The right operand function.
   * @param {Object} [context] - The context.
   * @param {boolean} [create] - Whether to create the member if it does not exist.
   * @returns {function} The function returning the non-computed member value.
   */
  nonComputedMember(left, right, context, create) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      if (create && create !== 1) {
        if (lhs && lhs[right] == null) {
          lhs[right] = {};
        }
      }
      const value = lhs != null ? lhs[right] : undefined;
      if (context) {
        return { context: lhs, name: right, value };
      }
      return value;
    };
  }

  /**
   * Returns the value of an input expression.
   * @param {function} input - The input function.
   * @param {number} watchId - The watch identifier.
   * @returns {function} The function returning the input value.
   */
  inputs(input, watchId) {
    return function (scope, value, locals, inputs) {
      if (inputs) return inputs[watchId];
      return input(scope, value, locals);
    };
  }
}

/**
 * Decorates AST with constant, toWatch, and isPure properties
 * @param {import("./ast").ASTNode} ast
 * @param {function(any):any} $filter
 * @param {boolean} [parentIsPure]
 */
function findConstantAndWatchExpressions(ast, $filter, parentIsPure) {
  let allConstants;
  let argsToWatch;
  let isStatelessFilter;

  const astIsPure = (ast.isPure = isPure(ast, parentIsPure));

  switch (ast.type) {
    case ASTType.Program:
      allConstants = true;
      /** @type {[import("./ast").ASTNode]} */ (ast.body).forEach((expr) => {
        findConstantAndWatchExpressions(expr.expression, $filter, astIsPure);
        allConstants = allConstants && expr.expression.constant;
      });
      ast.constant = allConstants;
      break;
    case ASTType.Literal:
      ast.constant = true;
      ast.toWatch = [];
      break;
    case ASTType.UnaryExpression:
      findConstantAndWatchExpressions(ast.argument, $filter, astIsPure);
      ast.constant = ast.argument.constant;
      ast.toWatch = ast.argument.toWatch;
      break;
    case ASTType.BinaryExpression:
      findConstantAndWatchExpressions(ast.left, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.right, $filter, astIsPure);
      ast.constant = ast.left.constant && ast.right.constant;
      ast.toWatch = ast.left.toWatch.concat(ast.right.toWatch);
      break;
    case ASTType.LogicalExpression:
      findConstantAndWatchExpressions(ast.left, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.right, $filter, astIsPure);
      ast.constant = ast.left.constant && ast.right.constant;
      ast.toWatch = ast.constant ? [] : [ast];
      break;
    case ASTType.ConditionalExpression:
      findConstantAndWatchExpressions(ast.test, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.alternate, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.consequent, $filter, astIsPure);
      ast.constant =
        ast.test.constant && ast.alternate.constant && ast.consequent.constant;
      ast.toWatch = ast.constant ? [] : [ast];
      break;
    case ASTType.Identifier:
      ast.constant = false;
      ast.toWatch = [ast];
      break;
    case ASTType.MemberExpression:
      findConstantAndWatchExpressions(ast.object, $filter, astIsPure);
      if (ast.computed) {
        findConstantAndWatchExpressions(ast.property, $filter, astIsPure);
      }
      ast.constant =
        ast.object.constant && (!ast.computed || ast.property.constant);
      ast.toWatch = ast.constant ? [] : [ast];
      break;
    case ASTType.CallExpression:
      isStatelessFilter = ast.filter
        ? isStateless($filter, ast.callee.name)
        : false;
      allConstants = isStatelessFilter;
      argsToWatch = [];
      ast.arguments.forEach((expr) => {
        findConstantAndWatchExpressions(expr, $filter, astIsPure);
        allConstants = allConstants && expr.constant;
        argsToWatch.push.apply(argsToWatch, expr.toWatch);
      });
      ast.constant = allConstants;
      ast.toWatch = isStatelessFilter ? argsToWatch : [ast];
      break;
    case ASTType.AssignmentExpression:
      findConstantAndWatchExpressions(ast.left, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.right, $filter, astIsPure);
      ast.constant = ast.left.constant && ast.right.constant;
      ast.toWatch = [ast];
      break;
    case ASTType.ArrayExpression:
      allConstants = true;
      argsToWatch = [];
      ast.elements.forEach((expr) => {
        findConstantAndWatchExpressions(expr, $filter, astIsPure);
        allConstants = allConstants && expr.constant;
        argsToWatch.push.apply(argsToWatch, expr.toWatch);
      });
      ast.constant = allConstants;
      ast.toWatch = argsToWatch;
      break;
    case ASTType.ObjectExpression:
      allConstants = true;
      argsToWatch = [];
      ast.properties.forEach((property) => {
        findConstantAndWatchExpressions(property.value, $filter, astIsPure);
        allConstants = allConstants && property.value.constant;
        argsToWatch.push.apply(argsToWatch, property.value.toWatch);
        if (property.computed) {
          // `{[key]: value}` implicitly does `key.toString()` which may be non-pure
          findConstantAndWatchExpressions(property.key, $filter, false);
          allConstants = allConstants && property.key.constant;
          argsToWatch.push.apply(argsToWatch, property.key.toWatch);
        }
      });
      ast.constant = allConstants;
      ast.toWatch = argsToWatch;
      break;
    case ASTType.ThisExpression:
      ast.constant = false;
      ast.toWatch = [];
      break;
    case ASTType.LocalsExpression:
      ast.constant = false;
      ast.toWatch = [];
      break;
  }
}

/**
 * Converts a single expression AST node into an assignment expression if the expression is assignable.
 *
 * @param {import("./ast").ASTNode} ast
 * @returns {import("./ast").ASTNode}
 */
function assignableAST(ast) {
  if (ast.body.length === 1 && isAssignable(ast.body[0].expression)) {
    return {
      type: ASTType.AssignmentExpression,
      left: ast.body[0].expression,
      right: { type: ASTType.NGValueParameter },
      operator: "=",
    };
  }
}

function plusFn(l, r) {
  if (typeof l === "undefined") return r;
  if (typeof r === "undefined") return l;
  return l + r;
}

function getInputs(body) {
  if (body.length !== 1) return;
  const lastExpression = body[0].expression;
  const candidate = lastExpression.toWatch;
  if (candidate.length !== 1) return candidate;
  return candidate[0] !== lastExpression ? candidate : undefined;
}

// Detect nodes which could depend on non-shallow state of objects
function isPure(node, parentIsPure) {
  switch (node.type) {
    // Computed members might invoke a stateful toString()
    case ASTType.MemberExpression:
      if (node.computed) {
        return false;
      }
      break;

    // Unary always convert to primative
    case ASTType.UnaryExpression:
      return PURITY_ABSOLUTE;

    // The binary + operator can invoke a stateful toString().
    case ASTType.BinaryExpression:
      return node.operator !== "+" ? PURITY_ABSOLUTE : false;

    // Functions / filters probably read state from within objects
    case ASTType.CallExpression:
      return false;
  }

  return undefined === parentIsPure ? PURITY_RELATIVE : parentIsPure;
}

function isStateless($filter, filterName) {
  const fn = $filter(filterName);
  return !fn.$stateful;
}

/**
 * Converts parameter to  strings property name for use  as keys in an object.
 * Any non-string object, including a number, is typecasted into a string via the toString method.
 * {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Property_accessors#Property_names}
 *
 * @param {!any} name
 * @returns {string}
 */
function getStringValue(name) {
  return `${name}`;
}

/**
 * @param {import("./ast").ASTNode} ast
 * @returns {boolean}
 */
export function isAssignable(ast) {
  return (
    ast.type === ASTType.Identifier || ast.type === ASTType.MemberExpression
  );
}
