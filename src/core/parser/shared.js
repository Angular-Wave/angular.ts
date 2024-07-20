import { ASTType } from "./ast-type";
import { forEach, isFunction } from "../../shared/utils";

const objectValueOf = {}.constructor.prototype.valueOf;

/**
 * Converts parameter to  strings property name for use  as keys in an object.
 * Any non-string object, including a number, is typecasted into a string via the toString method.
 * {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Property_accessors#Property_names}
 *
 * @param {!any} name
 * @returns {string}
 */
export function getStringValue(name) {
  return `${name}`;
}

/// //////////////////////////////////////

export function ifDefined(v, d) {
  return typeof v !== "undefined" ? v : d;
}

export function plusFn(l, r) {
  if (typeof l === "undefined") return r;
  if (typeof r === "undefined") return l;
  return l + r;
}

export function isStateless($filter, filterName) {
  const fn = $filter(filterName);
  return !fn.$stateful;
}

export const PURITY_ABSOLUTE = 1;
export const PURITY_RELATIVE = 2;

// Detect nodes which could depend on non-shallow state of objects
export function isPure(node, parentIsPure) {
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

/**
 * Decorates ast with constant, toWatch, and isPure properties
 * @param {import("./ast").ASTNode} ast
 * @param {function(any):any} $filter
 * @param {*} parentIsPure
 */
export function findConstantAndWatchExpressions(ast, $filter, parentIsPure) {
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
      forEach(ast.arguments, (expr) => {
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
      forEach(ast.elements, (expr) => {
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
      forEach(ast.properties, (property) => {
        findConstantAndWatchExpressions(property.value, $filter, astIsPure);
        allConstants = allConstants && property.value.constant;
        argsToWatch.push.apply(argsToWatch, property.value.toWatch);
        if (property.computed) {
          // `{[key]: value}` implicitly does `key.toString()` which may be non-pure
          findConstantAndWatchExpressions(
            property.key,
            $filter,
            /* parentIsPure= */ false,
          );
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

export function getInputs(body) {
  if (body.length !== 1) return;
  const lastExpression = body[0].expression;
  const candidate = lastExpression.toWatch;
  if (candidate.length !== 1) return candidate;
  return candidate[0] !== lastExpression ? candidate : undefined;
}

export function isAssignable(ast) {
  return (
    ast.type === ASTType.Identifier || ast.type === ASTType.MemberExpression
  );
}

export function assignableAST(ast) {
  if (ast.body.length === 1 && isAssignable(ast.body[0].expression)) {
    return {
      type: ASTType.AssignmentExpression,
      left: ast.body[0].expression,
      right: { type: ASTType.NGValueParameter },
      operator: "=",
    };
  }
}

export function isLiteral(ast) {
  return (
    ast.body.length === 0 ||
    (ast.body.length === 1 &&
      (ast.body[0].expression.type === ASTType.Literal ||
        ast.body[0].expression.type === ASTType.ArrayExpression ||
        ast.body[0].expression.type === ASTType.ObjectExpression))
  );
}

export function isConstant(ast) {
  return ast.constant;
}

export function getValueOf(value) {
  return isFunction(value.valueOf)
    ? value.valueOf()
    : objectValueOf.call(value);
}
