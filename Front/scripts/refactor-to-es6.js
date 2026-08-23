import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

const TARGET_DIRS = [
  path.resolve('src/components'),
  path.resolve('src/features'),
  path.resolve('src/layouts'),
];
const EXTS = ['.js', '.jsx'];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : fullPath;
  });
};

const isTargetFile = (filePath) => EXTS.includes(path.extname(filePath));

const parseOpts = {
  sourceType: 'module',
  plugins: ['jsx'],
  allowReturnOutsideFunction: true,
};

const isFunctionBody = (path) => t.isBlockStatement(path.parent) && (
  t.isArrowFunctionExpression(path.parentPath.parent) ||
  t.isFunctionExpression(path.parentPath.parent) ||
  t.isFunctionDeclaration(path.parentPath.parent)
);

const toArrow = (node, forceAsync) => {
  if (t.isArrowFunctionExpression(node)) {
    if (forceAsync && !node.async) node.async = true;
    return node;
  }
  if (node.generator) {
    throw new Error(`Generator functions are not supported: ${node.id?.name || node.loc?.start?.line}`);
  }
  const arrow = t.arrowFunctionExpression(node.params, node.body, forceAsync || node.async);
  arrow.returnType = node.returnType;
  arrow.typeParameters = node.typeParameters;
  return arrow;
};

const buildTernary = (test, consequent, alternate) => {
  const node = t.conditionalExpression(
    test,
    t.isExpression(consequent) ? consequent : t.arrowFunctionExpression([], t.blockStatement(Array.isArray(consequent) ? consequent : [consequent])),
    t.isExpression(alternate) ? alternate : t.arrowFunctionExpression([], t.blockStatement(Array.isArray(alternate) ? alternate : [consequent]))
  );
  return node;
};

const statementToExpression = (stmt) => {
  if (t.isExpressionStatement(stmt)) return stmt.expression;
  if (t.isReturnStatement(stmt) && stmt.argument) return stmt.argument;
  if (t.isReturnStatement(stmt) && !stmt.argument) return t.identifier('undefined');
  return t.callExpression(toArrow(t.functionExpression(null, [], t.blockStatement([stmt]))), []);
};

const extractParams = (left) => {
  if (t.isVariableDeclaration(left)) {
    const ids = left.declarations
      .filter((d) => t.isIdentifier(d.id))
      .map((d) => d.id);
    if (ids.length === 1) return ids[0];
    return t.objectPattern(ids.map((id) => t.objectProperty(id, id, false, true)));
  }
  return left;
};

const containsAwait = (node) => {
  if (!node || typeof node !== 'object') return false;
  if (t.isAwaitExpression(node)) return true;
  if (t.isFunction(node)) return false; // do not descend into nested functions
  return Object.values(node).some((value) => {
    if (Array.isArray(value)) return value.some(containsAwait);
    if (value && typeof value === 'object' && value.type) return containsAwait(value);
    return false;
  });
};

const transformFile = (content) => {
  const ast = parse(content, parseOpts);

  traverse(ast, {
    // 1) Function declarations -> const arrow
    FunctionDeclaration(path) {
      const { node } = path;
      if (!node.id) return;
      const arrow = toArrow(node);
      const decl = t.variableDeclaration('const', [
        t.variableDeclarator(node.id, arrow),
      ]);
      if (path.parentPath.isExportNamedDeclaration()) {
        path.parentPath.node.declaration = decl;
      } else if (path.parentPath.isExportDefaultDeclaration()) {
        path.parentPath.node.declaration = arrow;
      } else {
        path.replaceWith(decl);
      }
    },

    // 2) Function expressions -> arrow
    FunctionExpression(path) {
      if (t.isObjectMethod(path.parent) || t.isClassMethod(path.parent)) return;
      path.replaceWith(toArrow(path.node));
    },

    // 3) ?? -> ternary
    LogicalExpression(path) {
      if (path.node.operator !== '??') return;
      const { left, right } = path.node;
      const test = t.logicalExpression(
        '&&',
        t.binaryExpression('!==', t.cloneNode(left), t.identifier('undefined')),
        t.binaryExpression('!==', t.cloneNode(left), t.nullLiteral())
      );
      path.replaceWith(t.conditionalExpression(test, t.cloneNode(left), right));
    },

    // 4) JSX {cond && <X />} -> {cond ? <X /> : null}
    JSXExpressionContainer(path) {
      const expr = path.node.expression;
      if (t.isLogicalExpression(expr) && expr.operator === '&&') {
        path.node.expression = t.conditionalExpression(expr.left, expr.right, t.nullLiteral());
      }
    },

    // 5) forEach -> map (call expression)
    CallExpression(path) {
      const callee = path.node.callee;
      if (t.isMemberExpression(callee) && t.isIdentifier(callee.property, { name: 'forEach' })) {
        callee.property.name = 'map';
      }
    },

    // 6) if -> ternary
    IfStatement(path) {
      const { node } = path;

      const isLastStatementInBlock = () => {
        const parent = path.parent;
        if (!t.isBlockStatement(parent)) return false;
        const body = parent.body;
        return body[body.length - 1] === node;
      };

      const isDirectChildOfFunctionBody = () => {
        const parent = path.parent;
        if (!t.isBlockStatement(parent)) return false;
        const fn = path.getFunctionParent();
        return fn && fn.node.body === parent;
      };

      const isInsideAsyncFunction = () => {
        const fn = path.getFunctionParent();
        return fn && (fn.node.async || fn.node.generator === false && fn.node.async);
      };

      const wrap = (stmt) => {
        const body = t.isBlockStatement(stmt) ? stmt : t.blockStatement([stmt]);
        const isAsync = containsAwait(body);
        const arrow = toArrow(t.functionExpression(null, [], body), isAsync);
        return t.callExpression(arrow, []);
      };

      const fn = path.getFunctionParent();
      const fnBody = fn?.node.body?.body;
      const idx = fnBody ? fnBody.indexOf(node) : -1;
      const next = idx >= 0 ? fnBody[idx + 1] : null;

      // Pattern: if (c) return a; return b;
      if (idx >= 0 && t.isReturnStatement(node.consequent) && !node.alternate && t.isReturnStatement(next)) {
        const trueExpr = node.consequent.argument || t.identifier('undefined');
        const falseExpr = next.argument || t.identifier('undefined');
        path.replaceWith(t.returnStatement(t.conditionalExpression(node.test, trueExpr, falseExpr)));
        path.getNextSibling().remove();
        return;
      }

      // Guard clauses: if (c) return; ...rest...   or   if (c) return a; ...rest...
      if (isDirectChildOfFunctionBody() && t.isReturnStatement(node.consequent) && !node.alternate) {
        const remaining = fnBody.slice(idx + 1);
        const trueExpr = node.consequent.argument || t.identifier('undefined');
        if (remaining.length === 0) {
          path.replaceWith(t.returnStatement(t.conditionalExpression(node.test, trueExpr, t.identifier('undefined'))));
          return;
        }
        const restBlock = t.blockStatement(remaining);
        const restIife = wrap(restBlock);
        const parentFn = path.getFunctionParent();
        if (parentFn && containsAwait(restBlock) && !parentFn.node.async && !parentFn.node.generator) {
          parentFn.node.async = true;
        }
        path.replaceWith(t.returnStatement(t.conditionalExpression(node.test, trueExpr, restIife)));
        // Remove the rest statements that we moved into the IIFE
        for (let i = remaining.length - 1; i >= 0; i--) {
          path.getNextSibling().remove();
        }
        return;
      }

      // Pattern: if (c) expr;  (no else) -> c ? expr : undefined;
      if (!node.alternate && t.isExpressionStatement(node.consequent) && !isLastStatementInBlock()) {
        const expr = t.conditionalExpression(
          node.test,
          node.consequent.expression,
          t.identifier('undefined')
        );
        path.replaceWith(t.expressionStatement(expr));
        return;
      }

      // If the if is the last statement of a block, try to return its value.
      if (isLastStatementInBlock()) {
        if (!node.alternate) {
          if (t.isReturnStatement(node.consequent)) {
            const trueExpr = node.consequent.argument || t.identifier('undefined');
            path.replaceWith(t.returnStatement(t.conditionalExpression(node.test, trueExpr, t.identifier('undefined'))));
            return;
          }
          const cons = wrap(node.consequent);
          path.replaceWith(t.returnStatement(t.conditionalExpression(node.test, cons, t.identifier('undefined'))));
          return;
        }
        const cons = wrap(node.consequent);
        const alt = wrap(node.alternate);
        path.replaceWith(t.returnStatement(t.conditionalExpression(node.test, cons, alt)));
        return;
      }

      // General if/else -> ternary with IIFE arrows for statement blocks
      const consExpr = wrap(node.consequent);
      const altExpr = node.alternate
        ? wrap(node.alternate)
        : toArrow(t.functionExpression(null, [], t.blockStatement([])));
      const parentFn = path.getFunctionParent();
      if (parentFn && (containsAwait(node.consequent) || containsAwait(node.alternate)) && !parentFn.node.async && !parentFn.node.generator) {
        parentFn.node.async = true;
      }
      const iife = t.conditionalExpression(node.test, consExpr, altExpr);
      path.replaceWith(t.expressionStatement(iife));
    },

    // 7) for...of and for...in are left for manual conversion because
    // continue/break and nested loops do not map cleanly to .map()/filter().
    // ForOfStatement(path) { ... }
    // ForInStatement(path) { ... }
  });

  const output = generate(ast, { retainLines: false, compact: false }, content);
  return output.code;
};

const files = TARGET_DIRS.flatMap(walk).filter(isTargetFile);

files.forEach((filePath) => {
  const original = fs.readFileSync(filePath, 'utf-8');
  try {
    const transformed = transformFile(original);
    if (transformed !== original) {
      fs.writeFileSync(filePath, transformed, 'utf-8');
      console.log('✓', path.relative(process.cwd(), filePath));
    }
  } catch (err) {
    console.error('✗', path.relative(process.cwd(), filePath), err.message);
  }
});

console.log(`\nProcessed ${files.length} files.`);
