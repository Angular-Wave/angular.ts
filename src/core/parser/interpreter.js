import {
  assignableAST,
  findConstantAndWatchExpressions,
  getInputs,
  getStringValue,
  plusFn,
} from "./shared";
import { forEach, isDefined } from "../../shared/utils";
import { ASTType } from "./ast";

export function ASTInterpreter($filter) {
  this.$filter = $filter;
}

ASTInterpreter.prototype = {
  compile(ast) {
    const self = this;
    findConstantAndWatchExpressions(ast, self.$filter);
    let assignable;
    let assign;
    if ((assignable = assignableAST(ast))) {
      assign = this.recurse(assignable);
    }
    const toWatch = getInputs(ast.body);
    let inputs;
    if (toWatch) {
      inputs = [];
      forEach(toWatch, (watch, key) => {
        const input = self.recurse(watch);
        input.isPure = watch.isPure;
        watch.input = input;
        inputs.push(input);
        watch.watchId = key;
      });
    }
    const expressions = [];
    forEach(ast.body, (expression) => {
      expressions.push(self.recurse(expression.expression));
    });
    const fn =
      ast.body.length === 0
        ? () => {}
        : ast.body.length === 1
          ? expressions[0]
          : function (scope, locals) {
              let lastValue;
              forEach(expressions, (exp) => {
                lastValue = exp(scope, locals);
              });
              return lastValue;
            };
    if (assign) {
      fn.assign = function (scope, value, locals) {
        return assign(scope, locals, value);
      };
    }
    if (inputs) {
      fn.inputs = inputs;
    }
    return fn;
  },

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
        forEach(ast.arguments, (expr) => {
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
        forEach(ast.elements, (expr) => {
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
        forEach(ast.properties, (property) => {
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
  },

  "unary+": function (argument, context) {
    return function (scope, locals, assign, inputs) {
      let arg = argument(scope, locals, assign, inputs);
      if (isDefined(arg)) {
        arg = +arg;
      } else {
        arg = 0;
      }
      return context ? { value: arg } : arg;
    };
  },

  "unary-": function (argument, context) {
    return function (scope, locals, assign, inputs) {
      let arg = argument(scope, locals, assign, inputs);
      if (isDefined(arg)) {
        arg = -arg;
      } else {
        arg = -0;
      }
      return context ? { value: arg } : arg;
    };
  },
  "unary!": function (argument, context) {
    return function (scope, locals, assign, inputs) {
      const arg = !argument(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary+": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      const rhs = right(scope, locals, assign, inputs);
      const arg = plusFn(lhs, rhs);
      return context ? { value: arg } : arg;
    };
  },
  "binary-": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      const rhs = right(scope, locals, assign, inputs);
      const arg = (isDefined(lhs) ? lhs : 0) - (isDefined(rhs) ? rhs : 0);
      return context ? { value: arg } : arg;
    };
  },
  "binary*": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) *
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary/": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) /
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary%": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) %
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary===": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ===
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary!==": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) !==
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary==": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ==
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary!=": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) !=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary<": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) <
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary>": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) >
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary<=": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) <=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary>=": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) >=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary&&": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) &&
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary||": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ||
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "ternary?:": function (test, alternate, consequent, context) {
    return function (scope, locals, assign, inputs) {
      const arg = test(scope, locals, assign, inputs)
        ? alternate(scope, locals, assign, inputs)
        : consequent(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  value(value, context) {
    return function () {
      return context ? { context: undefined, name: undefined, value } : value;
    };
  },
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
  },
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
  },
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
  },
  inputs(input, watchId) {
    return function (scope, value, locals, inputs) {
      if (inputs) return inputs[watchId];
      return input(scope, value, locals);
    };
  },
};
