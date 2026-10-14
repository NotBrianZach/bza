/**
 * Learner text → the worker's restricted expression tree.
 *
 * WHY A PARSER AND NOT A STRING. The worker refuses to accept expression strings,
 * and the refusal is the point: SymPy's `sympify` runs Python's parser over
 * whatever you hand it, so an "expression" is an arbitrary program
 * (worker/mathwb/exprtree.py says so at length). It takes a tree of tagged nodes
 * dispatched by an explicit table. A learner types text, so something has to turn
 * one into the other, and that something has to live on this side of the wire —
 * the whole security property is that no string ever reaches the engine.
 *
 * So this parser is also a gate. It accepts a deliberately small grammar, and
 * anything outside it is a parse error naming the position, not a surprise
 * downstream. Symbols must be declared by the task; an undeclared name is
 * rejected here rather than invented, for the reason the worker gives — `x` and
 * `x` positive simplify differently, so a tree that conjured symbols as it walked
 * would silently decide the mathematics.
 *
 * ── The grammar ───────────────────────────────────────────────────────────
 *
 *   expr     := sum ('=' sum)?
 *   sum      := product (('+' | '-') product)*
 *   product  := unary (('*' | '/' | juxtaposition) unary)*
 *   unary    := ('+' | '-')* power
 *   power    := atom ('^' unary)?                 right-associative
 *   atom     := numeral | symbol | constant | name '(' expr (',' expr)* ')' | '(' expr ')'
 *
 * ── Three decisions worth stating, because each one has a defensible opposite ──
 *
 * 1. Juxtaposition multiplies. `2x`, `x(x+1)` and `(x+3)(x-5)` are what people
 *    actually type, and refusing them would make the parser the hard part of the
 *    exercise. The cost is that `xy` is a product and never a two-letter symbol —
 *    acceptable, because symbols are declared and a declared `xy` is matched
 *    greedily before juxtaposition is considered.
 *
 * 2. `1/2x` parses as `(1/2)·x`, because `*` and `/` are one left-associative
 *    level. This is the conventional CAS reading and it is still a genuine
 *    ambiguity in handwriting. It is documented rather than guessed at.
 *
 * 3. A sum becomes a flat `add` whose negative terms are wrapped in `negate`,
 *    rather than nested `subtract` nodes. Both are legal input to the worker;
 *    this one gives the form checks (forms.ts) a predictable top level, and
 *    "is the answer a sum of N things" is a question the whole feature asks.
 */

// ---------------------------------------------------------------------------
// The tree
// ---------------------------------------------------------------------------

/** Mirrors the node kinds in worker/mathwb/exprtree.py. Nothing else is legal. */
export type ExprNode =
  /** Integers arrive as strings. A JSON number is an IEEE double and would round. */
  | { kind: 'integer'; value: string }
  | { kind: 'rational'; numerator: string; denominator: string }
  | { kind: 'decimal'; value: string; precision: number }
  | { kind: 'symbol'; name: string }
  | { kind: 'constant'; name: 'pi' | 'E' | 'I' | 'oo' | '-oo' }
  | { kind: 'add'; args: ExprNode[] }
  | { kind: 'multiply'; args: ExprNode[] }
  | { kind: 'subtract'; left: ExprNode; right: ExprNode }
  | { kind: 'divide'; numerator: ExprNode; denominator: ExprNode }
  | { kind: 'power'; base: ExprNode; exponent: ExprNode }
  | { kind: 'negate'; operand: ExprNode }
  | { kind: 'function'; name: string; args: ExprNode[] }
  | { kind: 'equation'; left: ExprNode; right: ExprNode }

/** The worker's `ALLOWED_FUNCTIONS`, restated so a bad name fails here. */
export const ALLOWED_FUNCTIONS = [
  'sqrt', 'exp', 'log', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh', 'abs', 'factorial', 'gamma',
] as const

const CONSTANTS: Record<string, 'pi' | 'E' | 'I' | 'oo'> = {
  pi: 'pi', PI: 'pi', E: 'E', e: 'E', I: 'I', i: 'I', oo: 'oo', inf: 'oo', infinity: 'oo',
}

export class ParseError extends Error {
  constructor(message: string, readonly position: number) {
    super(message)
    this.name = 'ParseError'
  }
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

type TokenType = 'number' | 'name' | 'op' | 'lparen' | 'rparen' | 'comma' | 'end'
interface Token { type: TokenType; text: string; at: number }

/**
 * Unicode the learner's keyboard and this app's own copy both produce.
 *
 * The worked examples in ontology.ts are written with −, ·, ² and × because that
 * is how mathematics is set, and a learner who copies one back has typed
 * characters the ASCII grammar would reject. Normalising them is not leniency; it
 * is accepting what this product itself displays.
 */
function normalize(raw: string): string {
  return raw
    .replace(/[−–—]/g, '-')   // minus, en dash, em dash
    .replace(/[×⋅∙]/g, '*')   // ×, ⋅, ∙
    .replace(/[÷]/g, '/')
    .replace(/√/g, 'sqrt')
    .replace(/\*\*/g, '^')
    // Superscript digits are an exponent, which is the one case where dropping the
    // character would change the mathematics rather than the spelling.
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m =>
      '^' + [...m].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
    // Non-breaking, thin and zero-width spaces. These paste in invisibly from the
    // worked examples above, and an invisible character that fails the tokenizer
    // produces the least actionable error message a parser can emit.
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
}

function tokenize(input: string): Token[] {
  const text = normalize(input)
  const out: Token[] = []
  let i = 0

  while (i < text.length) {
    const c = text[i]
    if (/\s/.test(c)) { i += 1; continue }

    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(text[i + 1] ?? ''))) {
      const start = i
      while (i < text.length && /[0-9]/.test(text[i])) i += 1
      if (text[i] === '.') {
        i += 1
        while (i < text.length && /[0-9]/.test(text[i])) i += 1
      }
      out.push({ type: 'number', text: text.slice(start, i), at: start })
      continue
    }

    if (/[A-Za-z_]/.test(c)) {
      const start = i
      while (i < text.length && /[A-Za-z0-9_]/.test(text[i])) i += 1
      out.push({ type: 'name', text: text.slice(start, i), at: start })
      continue
    }

    if ('+-*/^='.includes(c)) { out.push({ type: 'op', text: c, at: i }); i += 1; continue }
    if (c === '(' || c === '[' || c === '{') { out.push({ type: 'lparen', text: '(', at: i }); i += 1; continue }
    if (c === ')' || c === ']' || c === '}') { out.push({ type: 'rparen', text: ')', at: i }); i += 1; continue }
    if (c === ',') { out.push({ type: 'comma', text: ',', at: i }); i += 1; continue }

    throw new ParseError(`unexpected character ${JSON.stringify(c)}`, i)
  }

  out.push({ type: 'end', text: '', at: text.length })
  return out
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse learner text against a declared symbol table.
 *
 * `symbols` is the task's own `variables` list. An undeclared name that is not a
 * constant or a permitted function is an error, and the message names it: "x is
 * not declared" is actionable, where a tree that invented `x` would produce a
 * ruling whose disagreement with the learner's intent is invisible.
 *
 * Longest-match is used for names, so a declared two-character symbol wins over
 * the juxtaposition reading of its letters.
 */
export function parseExpression(input: string, symbols: string[]): ExprNode {
  const tokens = tokenize(input)
  const declared = new Set(symbols)
  let pos = 0

  const peek = () => tokens[pos]
  const at = () => tokens[pos].at
  const eat = (type: TokenType, text?: string): Token | null => {
    const token = tokens[pos]
    if (token.type !== type) return null
    if (text !== undefined && token.text !== text) return null
    pos += 1
    return token
  }

  function expect(type: TokenType, text: string): Token {
    const token = eat(type, text)
    if (!token) throw new ParseError(`expected ${JSON.stringify(text)}`, at())
    return token
  }

  function numeral(token: Token): ExprNode {
    if (token.text.includes('.')) {
      // Significant digits as written. A decimal is a measurement the author
      // typed, not a rational they meant — the worker keeps that distinction and
      // so does this.
      const digits = token.text.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '')
      return { kind: 'decimal', value: token.text, precision: Math.max(1, digits.length) }
    }
    return { kind: 'integer', value: token.text }
  }

  function atom(): ExprNode {
    if (eat('lparen')) {
      const inner = sum()
      expect('rparen', ')')
      return inner
    }

    const number = eat('number')
    if (number) return numeral(number)

    const name = eat('name')
    if (name) {
      // A declared symbol wins over everything, including a bracket that follows
      // it: `x(x+1)` is juxtaposition, and `product()` will pick the bracket up as
      // the next factor. Checking declaration first is what makes that work
      // without backtracking.
      if (declared.has(name.text)) return { kind: 'symbol', name: name.text }

      if ((ALLOWED_FUNCTIONS as readonly string[]).includes(name.text)) {
        expect('lparen', '(')
        const args: ExprNode[] = [sum()]
        while (eat('comma')) args.push(sum())
        expect('rparen', ')')
        return { kind: 'function', name: name.text, args }
      }

      if (CONSTANTS[name.text]) return { kind: 'constant', name: CONSTANTS[name.text] }

      // Naming which of the two it failed to be is the whole value of the message:
      // "y is not declared" sends the learner to the problem statement, where an
      // undeclared symbol usually means they answered a different question.
      throw new ParseError(
        peek().type === 'lparen'
          ? `${name.text} is not a permitted function (allowed: ${ALLOWED_FUNCTIONS.join(', ')})`
          : `${name.text} is not declared as a symbol of this problem`,
        name.at,
      )
    }

    throw new ParseError('expected a number, a symbol or a bracket', at())
  }

  function power(): ExprNode {
    const base = atom()
    if (eat('op', '^')) {
      // Right-associative, and the exponent may be signed: x^-2.
      return { kind: 'power', base, exponent: unary() }
    }
    return base
  }

  function unary(): ExprNode {
    if (eat('op', '-')) return { kind: 'negate', operand: unary() }
    if (eat('op', '+')) return unary()
    return power()
  }

  /** Does the next token begin an atom? That is what makes juxtaposition a product. */
  function startsAtom(): boolean {
    const t = peek()
    return t.type === 'number' || t.type === 'name' || t.type === 'lparen'
  }

  function product(): ExprNode {
    let node = unary()
    for (;;) {
      if (eat('op', '*')) {
        node = flatMultiply(node, unary())
      } else if (eat('op', '/')) {
        node = { kind: 'divide', numerator: node, denominator: unary() }
      } else if (startsAtom()) {
        node = flatMultiply(node, unary())
      } else {
        return node
      }
    }
  }

  function sum(): ExprNode {
    const terms: ExprNode[] = [product()]
    for (;;) {
      if (eat('op', '+')) {
        terms.push(product())
      } else if (eat('op', '-')) {
        terms.push({ kind: 'negate', operand: product() })
      } else {
        break
      }
    }
    return terms.length === 1 ? terms[0] : { kind: 'add', args: terms }
  }

  const left = sum()
  const tree = eat('op', '=')
    ? ({ kind: 'equation', left, right: sum() } as ExprNode)
    : left

  if (peek().type !== 'end') {
    throw new ParseError(`unexpected ${JSON.stringify(peek().text)} after a complete expression`, at())
  }
  return tree
}

function flatMultiply(left: ExprNode, right: ExprNode): ExprNode {
  const args = left.kind === 'multiply' ? [...left.args, right] : [left, right]
  return { kind: 'multiply', args }
}

/**
 * Parse without throwing. The route wants a message and a position, not an
 * exception — a malformed answer is an ordinary thing a learner submits and is not
 * an error in the sense a 500 is.
 */
export function tryParse(input: string, symbols: string[]):
  | { ok: true; tree: ExprNode }
  | { ok: false; message: string; position: number } {
  try {
    if (!input.trim()) return { ok: false, message: 'nothing was submitted', position: 0 }
    return { ok: true, tree: parseExpression(input, symbols) }
  } catch (e) {
    if (e instanceof ParseError) return { ok: false, message: e.message, position: e.position }
    return { ok: false, message: e instanceof Error ? e.message : 'could not be read', position: 0 }
  }
}

// ---------------------------------------------------------------------------
// Rendering back
// ---------------------------------------------------------------------------

/** Precedence, for deciding where brackets are needed on the way out. */
const PRECEDENCE: Record<string, number> = {
  equation: 0, add: 1, subtract: 1, negate: 2, multiply: 3, divide: 3, power: 4,
}
const precedenceOf = (n: ExprNode) => PRECEDENCE[n.kind] ?? 5

/**
 * The tree as infix text, round-trippable through `parseExpression`.
 *
 * Used to echo a parsed answer back to the learner, which is worth doing: seeing
 * `(1/2)*x` when you typed `1/2x` is how you find out the parser read you
 * differently than you meant, and finding that out before the ruling rather than
 * after is the difference between a confusing mark and a clear one.
 */
export function renderExpr(node: ExprNode): string {
  const wrap = (child: ExprNode, floor: number) =>
    precedenceOf(child) < floor ? `(${renderExpr(child)})` : renderExpr(child)

  switch (node.kind) {
    case 'integer': return node.value
    case 'decimal': return node.value
    case 'rational': return `${node.numerator}/${node.denominator}`
    case 'symbol': return node.name
    case 'constant': return node.name
    case 'add':
      return node.args
        .map((arg, i) =>
          arg.kind === 'negate'
            ? `${i === 0 ? '-' : ' - '}${wrap(arg.operand, 2)}`
            : `${i === 0 ? '' : ' + '}${wrap(arg, 1)}`)
        .join('')
    case 'subtract': return `${wrap(node.left, 1)} - ${wrap(node.right, 2)}`
    case 'multiply': return node.args.map(a => wrap(a, 3)).join('*')
    case 'divide': return `${wrap(node.numerator, 3)}/${wrap(node.denominator, 4)}`
    case 'power': return `${wrap(node.base, 5)}^${wrap(node.exponent, 4)}`
    case 'negate': return `-${wrap(node.operand, 2)}`
    case 'function': return `${node.name}(${node.args.map(renderExpr).join(', ')})`
    case 'equation': return `${renderExpr(node.left)} = ${renderExpr(node.right)}`
  }
}

// ---------------------------------------------------------------------------
// Shape questions the form checks need
// ---------------------------------------------------------------------------

/** Strip the sign wrappers, so shape questions are asked of the thing itself. */
export function unsigned(node: ExprNode): ExprNode {
  return node.kind === 'negate' ? unsigned(node.operand) : node
}

export function isNumeral(node: ExprNode): boolean {
  const n = unsigned(node)
  if (n.kind === 'integer' || n.kind === 'rational' || n.kind === 'decimal') return true
  if (n.kind === 'divide') return isNumeral(n.numerator) && isNumeral(n.denominator)
  if (n.kind === 'multiply') return n.args.every(isNumeral)
  if (n.kind === 'add') return n.args.every(isNumeral)
  if (n.kind === 'power') return isNumeral(n.base) && isNumeral(n.exponent)
  return false
}

/** Every symbol the tree mentions. */
export function symbolsIn(node: ExprNode): string[] {
  const out = new Set<string>()
  const walk = (n: ExprNode) => {
    switch (n.kind) {
      case 'symbol': out.add(n.name); break
      case 'add': case 'multiply': case 'function': n.args.forEach(walk); break
      case 'subtract': case 'equation': walk(n.left); walk(n.right); break
      case 'divide': walk(n.numerator); walk(n.denominator); break
      case 'power': walk(n.base); walk(n.exponent); break
      case 'negate': walk(n.operand); break
    }
  }
  walk(node)
  return [...out]
}

/**
 * Polynomial degree in one symbol, or null when it cannot be determined.
 *
 * `null` is not a failure mode to be smoothed over — it is the answer for
 * anything this cheap walk has no business ruling on: a transcendental function,
 * a symbolic exponent, a division by something containing the symbol. Every
 * caller must treat null as *inconclusive*, never as degree 0, because degree 0
 * would silently pass a form check the checker could not actually perform.
 */
export function degreeIn(node: ExprNode, symbol: string): number | null {
  switch (node.kind) {
    case 'integer': case 'decimal': case 'rational': case 'constant':
      return 0
    case 'symbol':
      return node.name === symbol ? 1 : 0
    case 'negate':
      return degreeIn(node.operand, symbol)
    case 'add': {
      const parts = node.args.map(a => degreeIn(a, symbol))
      return parts.some(p => p === null) ? null : Math.max(...(parts as number[]))
    }
    case 'subtract': {
      const l = degreeIn(node.left, symbol)
      const r = degreeIn(node.right, symbol)
      return l === null || r === null ? null : Math.max(l, r)
    }
    case 'multiply': {
      const parts = node.args.map(a => degreeIn(a, symbol))
      return parts.some(p => p === null) ? null : (parts as number[]).reduce((a, b) => a + b, 0)
    }
    case 'divide': {
      const d = degreeIn(node.denominator, symbol)
      // A quotient is a polynomial only when the symbol is absent downstairs.
      if (d === null || d !== 0) return null
      return degreeIn(node.numerator, symbol)
    }
    case 'power': {
      const base = degreeIn(node.base, symbol)
      if (base === null) return null
      const exponent = unsigned(node.exponent)
      if (exponent.kind !== 'integer') return null
      const power = Number(node.exponent.kind === 'negate' ? `-${exponent.value}` : exponent.value)
      if (!Number.isInteger(power) || power < 0) return null
      return base * power
    }
    case 'function':
      return symbolsIn(node).includes(symbol) ? null : 0
    case 'equation':
      return null
  }
}
