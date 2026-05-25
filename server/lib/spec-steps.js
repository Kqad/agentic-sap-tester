// Static analyzer that turns a Playwright + Midscene spec.ts into a
// structured step tree, so the UI can show what will be executed *before*
// the run actually starts.
//
// We walk the TypeScript AST (not regex) so that:
//   - `})` inside string literals doesn't confuse step-body boundaries
//   - `test.step` calls inside `if` / `for` are marked conditional / loop
//   - template strings keep their `${expr}` shape instead of being mangled
//   - nested `test.step` becomes a real tree
//
// Recognized calls:
//   * test('title', async ({...}) => {...})   — the outer test
//   * test.step('Step N: ...', async () => {...})  — a phase
//   * ai / aiTap / aiInput / aiHover / aiScroll
//     / aiQuery / aiAssert / aiKeyboardPress / aiWaitFor — Midscene actions
//   * fillSapField / dumpForm / dismissInfoPopupIfAny / withRetry
//     — project helpers worth surfacing in the timeline

import ts from 'typescript';

const AI_CALLS = new Set([
  'ai', 'aiTap', 'aiInput', 'aiHover', 'aiScroll',
  'aiQuery', 'aiAssert', 'aiKeyboardPress', 'aiWaitFor',
]);

const PROJECT_HELPERS = new Set([
  'fillSapField', 'dumpForm', 'dismissInfoPopupIfAny',
]);

// Wrappers whose last argument is a () => aiX(...) lambda. We unwrap and
// emit the inner AI call with a `wrappedIn` annotation, so the timeline
// shows the real action instead of an opaque helper call.
const WRAPPERS = new Set(['withRetry']);

export function parseSpecSteps(filePath, text) {
  const sf = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

  // Collect top-level test() calls. Anything else lives inside.
  const testCalls = [];
  (function find(node) {
    if (ts.isCallExpression(node) && isPlainIdentifierCall(node.expression, 'test')) {
      const [titleArg, fnArg] = node.arguments;
      if (titleArg && fnArg) {
        testCalls.push({
          title: serializeStringish(titleArg) ?? '<unnamed test>',
          line: lineOf(sf, node),
          fn: fnArg,
        });
        // Don't recurse into a test's body here — walkTestBody handles it.
        return;
      }
    }
    ts.forEachChild(node, find);
  })(sf);

  return {
    file: filePath.replace(/\\/g, '/'),
    tests: testCalls.map(tc => {
      const body = walkTestBody(sf, tc.fn);
      return {
        title: tc.title,
        line: tc.line,
        steps: body.steps,
        actions: body.actions,  // actions outside any test.step (rare but possible)
      };
    }),
  };
}

function walkTestBody(sf, fnNode) {
  if (!fnNode || (!ts.isArrowFunction(fnNode) && !ts.isFunctionExpression(fnNode))) {
    return { steps: [], actions: [] };
  }
  if (!fnNode.body || !ts.isBlock(fnNode.body)) {
    return { steps: [], actions: [] };
  }
  return walkBlock(sf, fnNode.body, { conditional: false, loop: false });
}

// Walk a Block / Statement and collect:
//   steps   — test.step(...) calls (recursively nested)
//   actions — bare AI / helper calls at this level, not inside any nested step
function walkBlock(sf, root, ctx) {
  const steps = [];
  const actions = [];

  visit(root);

  function visit(node) {
    if (!node) return;

    // test.step('...', async () => {...}) — record and DON'T recurse further;
    // its body has already been walked into its own bucket.
    if (ts.isCallExpression(node) && isTestStepCall(node.expression)) {
      const [titleArg, fnArg] = node.arguments;
      const title = titleArg ? serializeStringish(titleArg) ?? '<dynamic title>' : '<no title>';
      let inner = { steps: [], actions: [] };
      if (fnArg && (ts.isArrowFunction(fnArg) || ts.isFunctionExpression(fnArg)) && fnArg.body) {
        inner = walkBlock(
          sf,
          ts.isBlock(fnArg.body) ? fnArg.body : fnArg.body,
          { conditional: false, loop: false },
        );
      }
      steps.push({
        kind: 'step',
        title,
        line: lineOf(sf, node),
        conditional: ctx.conditional,
        loop: ctx.loop,
        actions: inner.actions,
        children: inner.steps,
      });
      return;
    }

    // Bare AI / helper call at this level
    if (ts.isCallExpression(node)) {
      const action = classifyCall(sf, node, ctx);
      if (action) {
        actions.push(action);
        // fall through so nested args (rare) still get visited? Not needed for AI calls.
        return;
      }
    }

    // Control-flow: tag children as conditional / loop
    if (ts.isIfStatement(node)) {
      walkInto(node.thenStatement, { ...ctx, conditional: true });
      if (node.elseStatement) walkInto(node.elseStatement, { ...ctx, conditional: true });
      return;
    }
    if (
      ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)
      || ts.isWhileStatement(node) || ts.isDoStatement(node)
    ) {
      walkInto(node.statement, { ...ctx, loop: true });
      return;
    }
    if (ts.isTryStatement(node)) {
      walkInto(node.tryBlock, ctx);
      if (node.catchClause) walkInto(node.catchClause.block, { ...ctx, conditional: true });
      if (node.finallyBlock) walkInto(node.finallyBlock, ctx);
      return;
    }

    ts.forEachChild(node, visit);
  }

  function walkInto(child, newCtx) {
    const inner = walkBlock(sf, child, newCtx);
    for (const s of inner.steps) steps.push(s);
    for (const a of inner.actions) actions.push(a);
  }

  return { steps, actions };
}

function classifyCall(sf, callNode, ctx) {
  const expr = callNode.expression;
  if (!ts.isIdentifier(expr)) return null;
  const name = expr.text;

  if (AI_CALLS.has(name)) {
    const [a, b] = callNode.arguments;
    return {
      kind: name,
      text: a ? serializeArgExpression(a) : '',
      hint: b ? serializeArgExpression(b) : null,
      line: lineOf(sf, callNode),
      conditional: ctx.conditional,
      loop: ctx.loop,
    };
  }

  if (WRAPPERS.has(name)) {
    // withRetry('label', () => aiX(...))   or   withRetry('label', async () => { ... aiX(...) ... })
    const label = serializeArgExpression(callNode.arguments[0]);
    const lambda = callNode.arguments[callNode.arguments.length - 1];
    const inner = findFirstAiCall(lambda);
    if (inner) {
      const action = classifyCall(sf, inner, ctx);
      if (action) {
        action.wrappedIn = name;
        action.wrapLabel = label;
        return action;
      }
    }
    // No recognizable AI call inside; fall back to a helper entry.
    return {
      kind: 'helper',
      name,
      args: [label],
      line: lineOf(sf, callNode),
      conditional: ctx.conditional,
      loop: ctx.loop,
    };
  }

  if (PROJECT_HELPERS.has(name)) {
    return {
      kind: 'helper',
      name,
      args: callNode.arguments.map(serializeArgExpression),
      line: lineOf(sf, callNode),
      conditional: ctx.conditional,
      loop: ctx.loop,
    };
  }

  // Catch-all: any other awaited identifier call (typically a user-defined
  // helper like `runFaglReport(...)` or `addColumnsToLayout(...)`) so the
  // timeline doesn't silently drop steps that delegate all their work to
  // local helpers. We require it to be awaited so we don't flood the list
  // with expect()/console.log() noise.
  const parent = callNode.parent;
  if (parent && ts.isAwaitExpression(parent)) {
    return {
      kind: 'call',
      name,
      args: callNode.arguments.map(serializeArgExpression),
      line: lineOf(sf, callNode),
      conditional: ctx.conditional,
      loop: ctx.loop,
    };
  }

  return null;
}

function isPlainIdentifierCall(expr, name) {
  return ts.isIdentifier(expr) && expr.text === name;
}

function isTestStepCall(expr) {
  return ts.isPropertyAccessExpression(expr)
    && ts.isIdentifier(expr.expression) && expr.expression.text === 'test'
    && ts.isIdentifier(expr.name) && expr.name.text === 'step';
}

// Best-effort: collapse string literals, no-substitution templates, template
// expressions (keeping `${expr}` shape), and `'a' + 'b' + expr` chains.
function serializeStringish(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) {
      out += '${' + node.getSourceFile().text.slice(span.expression.getStart(node.getSourceFile()), span.expression.getEnd()) + '}';
      out += span.literal.text;
    }
    return out;
  }
  if (ts.isParenthesizedExpression(node)) {
    return serializeStringish(node.expression);
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = serializeStringish(node.left);
    const r = serializeStringish(node.right);
    if (l != null && r != null) return l + r;
    // mixed: fallthrough — show raw expression for the dynamic side
    if (l != null) return l + '${' + node.right.getText() + '}';
    if (r != null) return '${' + node.left.getText() + '}' + r;
  }
  return null;
}

function serializeArgExpression(node) {
  if (!node) return '';
  const s = serializeStringish(node);
  if (s != null) return s;
  // Variable, member access, call: keep the raw source so the UI can show
  // params.query.companyCode verbatim.
  try {
    return node.getText();
  } catch {
    return '';
  }
}

// Walk a lambda / expression looking for the first AI call. Used to unwrap
// `withRetry('label', () => aiQuery(...))` and similar.
function findFirstAiCall(node) {
  if (!node) return null;
  let found = null;
  (function visit(n) {
    if (found || !n) return;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && AI_CALLS.has(n.expression.text)) {
      found = n;
      return;
    }
    ts.forEachChild(n, visit);
  })(node);
  return found;
}

function lineOf(sf, node) {
  try {
    return ts.getLineAndCharacterOfPosition(sf, node.getStart(sf)).line + 1;
  } catch {
    return 0;
  }
}
