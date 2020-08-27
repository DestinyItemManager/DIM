/*
; Lazy BNF diagram of our search grammar
<query> ::= <term> | <term> <term>
<clause> ::= <opt-whitespace> <clause>
<terms> ::= <term> { " " <term>}
<term> ::= <string> | <filter> | <group> | <boolean>
<filter> ::= ["-"]<filterName>:<filterValue>[<operator><number>]
<filterName> ::= <the set of known filter names - is, notes, perks, tag, stat, etc.>
<filterValue> ::= <keyword> | "stat:" <statName> | <string>
<keyword> ::= <the set of known keyword filters - locked, sniperrifle, tagged, etc.>
<statName> ::= <the set of known stat keywords - charge, impact, resilience, etc.>
<operator> ::= "none" | "=" | "<" | "<=" | ">" | ">="
; Numbers are positive only, but don't need to be
<number> ::= DIGIT{DIGIT}
<group> ::= "(" <query> ")"
<boolean> ::= "or" | "not" | "and"
; Strings are basically anything within matching quotes, either single or double
<string> ::= WORD | "\"" WORD {" " WORD} "\"" | "'" WORD {" " WORD} "'\"'"
*/

import _ from 'lodash';

/* **** Parser **** */

/**
 * A tree of the parsed query. Boolean/unary operators have children (operands)that
 * describe their relationship.
 */
export type QueryAST = (AndOp | OrOp | NotOp | FilterOp | NoOp) & {
  error?: Error;
};

/** If ALL of of the operands are true, this resolves to true. There may be any number of operands. */
export interface AndOp {
  op: 'and';
  operands: QueryAST[];
}

/** If any of the operands is true, this resolves to true. There may be any number of operands. */
export interface OrOp {
  op: 'or';
  operands: QueryAST[];
}

/** An operator which negates the result of its only operand. */
export interface NotOp {
  op: 'not';
  operand: QueryAST;
}

/** This represents one of our filter function definitions, such as is:, season:, etc. */
export interface FilterOp {
  op: 'filter';
  /**
   * The name of the filter function, without any trailing :. The only weird case is
   * stats, which will appear like "stat:strength".
   */
  type: string;
  /**
   * Any arguments to the filter function as a single string. e.g: haspower, arrivals, >=1000
   */
  args: string;
}

/** This is mostly for error cases and empty string */
interface NoOp {
  op: 'noop';
}

/**
 * The lexer is implemented as a generator, but generators don't support peeking without advancing
 * the iterator. This wraps the generator in an object that buffers the next element if you call peek().
 */
class PeekableGenerator<T> {
  private gen: Generator<T>;
  private next: T | undefined;

  constructor(gen: Generator<T>) {
    this.gen = gen;
  }

  /**
   * Get what the next item from the generator will be, without advancing it.
   */
  peek(): T | undefined {
    if (!this.next) {
      this.next = this.gen.next().value;
    }
    return this.next;
  }

  /**
   * Get the next element from the generator and advance it to the next element.
   */
  pop(): T | undefined {
    if (this.next) {
      const ret = this.next;
      this.next = undefined;
      return ret;
    }
    return this.gen.next().value;
  }
}

/**
 * A table of operator precedence for our three binary operators. Operators with higher precedence group together
 * before those with lower precedence. The "op" property maps them to an AST node.
 */
const operators = {
  // The implicit `and` (two statements separated by whitespace) has lower precedence than either the explicit or or and.
  implicit_and: {
    precedence: 1,
    op: 'and',
  },
  or: {
    precedence: 2,
    op: 'or',
  },
  and: {
    precedence: 3,
    op: 'and',
  },
} as const;

/**
 * The query parser first lexes the string, then parses it into an AST (abstract syntax tree)
 * representing the logical structure of the query. This AST can then be walked to match up
 * to defined filters and generate an actual filter function.
 *
 * We choose to produce an AST instead of executing the search inline with parsing both to
 * make testing easier, and to allow for things like canonicalization of search queries.
 */
export function parseQuery(query: string): QueryAST {
  // This implements operator precedence via this mechanism:
  // https://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing

  /**
   * This extracts the next "atom" aka "value" from the token stream. An atom is either
   * an individual filter expression, or a grouped expression. Basically anything that's
   * not a binary operator. "not" is also in here because it's really just a modifier on an atom.
   */
  function parseAtom(tokens: PeekableGenerator<Token>): QueryAST {
    const token: Token | undefined = tokens.pop();

    if (!token) {
      throw new Error('expected an atom');
    }

    switch (token[0]) {
      case 'filter': {
        const keyword = token[1];
        if (keyword === 'not') {
          // `not:` a synonym for `-is:`. We could fix this up in filter execution but I chose to normalize it here.
          return {
            op: 'not',
            operand: {
              op: 'filter',
              type: 'is',
              args: token[2],
            },
          };
        } else {
          return {
            op: 'filter',
            type: keyword,
            args: token[2],
          };
        }
      }
      case 'not': {
        return {
          op: 'not',
          // The operand should always be an atom
          operand: parseAtom(tokens),
        };
      }
      case '(': {
        const result = parse(tokens);
        if (tokens.peek()?.[0] === ')') {
          tokens.pop();
        }
        return result;
      }
      default:
        throw new Error('Unexpected token type, looking for an atom: ' + token + ', ' + query);
    }
  }

  /**
   * Parse a stream of tokens into an AST. `minPrecedence` determined the minimum operator precedence
   * of operators that will be included in this portion of the parse.
   */
  function parse(tokens: PeekableGenerator<Token>, minPrecedence = 1): QueryAST {
    let ast: QueryAST = { op: 'noop' };

    try {
      ast = parseAtom(tokens);

      let token: Token | undefined;
      while ((token = tokens.peek())) {
        if (token[0] === ')') {
          break;
        }
        const operator = operators[token[0] as keyof typeof operators];
        if (!operator) {
          throw new Error('Expected an operator, got ' + token);
        } else if (operator.precedence < minPrecedence) {
          break;
        }

        tokens.pop();
        const nextMinPrecedence = operator.precedence + 1; // all our operators are left-associative
        const rhs = parse(tokens, nextMinPrecedence);

        // Our operators allow for more than 2 operands, to avoid deep logic trees.
        // This logic tries to combine them where possible.
        if (isSameOp(operator.op, ast)) {
          ast.operands.push(rhs);
        } else {
          ast = {
            op: operator.op,
            operands: isSameOp(operator.op, rhs) ? [ast, ...rhs.operands] : [ast, rhs],
          };
        }
      }
    } catch (e) {
      ast.error = e;
    }

    return ast;
  }

  const tokens = new PeekableGenerator(lexer(query));
  try {
    if (!tokens.peek()) {
      return { op: 'noop' };
    }
  } catch (e) {
    return { op: 'noop' };
  }
  const ast = parse(tokens);
  return ast;
}

function isSameOp<T extends 'and' | 'or'>(binOp: T, op: QueryAST): op is AndOp | OrOp {
  return binOp === op.op;
}

/* **** Lexer **** */

// Lexer token types
type NoArgTokenType = '(' | ')' | 'not' | 'or' | 'and' | 'implicit_and';
export type Token = [NoArgTokenType] | ['filter', string, string];

// Two different kind of quotes
const quoteRegexes = {
  '"': /.*?"/y,
  "'": /.*?'/y,
};
// Parens: `(` can be followed by whitespace, while `)` can be preceded by it
const parens = /(\(\s*|\s*\))/y;
// A `-` followed by any amount of whitespace is the same as "not"
const negation = /-\s*/y;
// `not`, `or`, and `and` keywords. or and not can be preceded by whitespace, and any of them can be followed by whitespace.
// `not` can't be preceded by whitespace because that whitespace is an implicit `and`.
const booleanKeywords = /(not|\s+or|\s+and)\s+/y;
// Filter names like is:, stat:, etc
const filterName = /[a-z]+:/y;
// Arguments to filters are pretty unconstrained
const filterArgs = /[^\s()]+/y;
// Words without quotes are basically any non-whitespace that doesn't terminate a group
const bareWords = /[^\s)]+/y;
// Whitespace that doesn't match anything else is an implicit `and`
const whitespace = /\s+/y;

/**
 * The lexer yields a series of tokens representing the linear structure of the search query.
 * This throws an exception if it finds an invalid input.
 *
 * Example: "is:blue -is:maxpower" turns into:
 * ["filter", "is", "blue"], ["implicit_and"], ["not"], ["filter", "is", "maxpower"]
 */
export function* lexer(query: string): Generator<Token> {
  query = query.trim().toLowerCase();

  // http://blog.tatedavies.com/2012/08/28/replace-microsoft-chars-in-javascript/
  query = query.replace(/[\u2018|\u2019|\u201A]/g, "'");
  query = query.replace(/[\u201C|\u201D|\u201E]/g, '"');

  let match: string | undefined;
  let i = 0;

  const consume = (str: string) => (i += str.length);

  /**
   * If `query` matches `re` starting at `i`, return the matched portion of the string. Otherwise return undefined.
   * This avoids having to make slices of strings just to start the regex in the middle of a string.
   *
   * Note that regexes passed to this must have the "sticky" flag set (y) and should not use ^, which will match the
   * beginning of the string, ignoring the index we want to start from. The sticky flag ensures our regex will match
   * based on the beginning of the string.
   */
  const extract = (re: RegExp): string | undefined => {
    // These checks only run in unit tests
    if ($DIM_FLAVOR === 'test') {
      if (!re.sticky) {
        throw new Error('regexp must be sticky');
      }
      if (re.source.startsWith('^')) {
        throw new Error('regexp cannot start with ^ and be repositioned');
      }
    }

    re.lastIndex = i;
    const match = re.exec(query);
    if (match) {
      const result = match[0];
      if (result.length > 0) {
        consume(result);
        return result;
      }
    }
    return undefined;
  };

  /**
   * Consume and return the contents of a quoted string.
   */
  const consumeString = (startingQuoteChar: string) => {
    // Quoted string
    consume(startingQuoteChar);
    if ((match = extract(quoteRegexes[startingQuoteChar])) !== undefined) {
      // Slice off the last character
      return match.slice(0, match.length - 1);
    } else {
      throw new Error('Unterminated quotes: |' + query.slice(i) + '| ' + i);
    }
  };

  while (i < query.length) {
    const char = query[i];
    const startingIndex = i;

    if ((match = extract(parens)) !== undefined) {
      // Start/end group
      yield [match.trim() as NoArgTokenType];
    } else if (char === '"' || char === "'") {
      // Quoted string
      yield ['filter', 'keyword', consumeString(char)];
    } else if ((match = extract(negation)) !== undefined) {
      // minus sign is the same as "not"
      yield ['not'];
    } else if ((match = extract(booleanKeywords)) !== undefined) {
      // boolean keywords
      yield [match.trim() as NoArgTokenType];
    } else if ((match = extract(filterName)) !== undefined) {
      // Keyword searches - is:, stat:discipline:, etc
      const keyword = match.slice(0, match.length - 1);
      const nextChar = query[i];

      let args = '';

      if (nextChar === '"' || nextChar === "'") {
        args = consumeString(nextChar);
      } else if ((match = extract(filterArgs)) !== undefined) {
        args = match;
      } else {
        throw new Error('missing keyword arguments for ' + match);
      }

      yield ['filter', keyword, args];
    } else if ((match = extract(bareWords)) !== undefined) {
      // bare words that aren't keywords are effectively "keyword" type filters
      yield ['filter', 'keyword', match];
    } else if ((match = extract(whitespace)) !== undefined) {
      yield ['implicit_and'];
    } else {
      throw new Error('unrecognized tokens: |' + query.slice(i) + '| ' + i);
    }

    if (startingIndex === i) {
      throw new Error('bug: forgot to consume characters');
    }
  }
}

/**
 * Build a standardized version of the query as a string. This is useful for deduping queries.
 * Example: 'is:weapon and is:sniperrifle or not is:armor and modslot:arrival' =>
 *          '(-is:armor modslot:arrival) or (is:sniperrifle is:weapon)'
 */
export function canonicalizeQuery(query: QueryAST, depth = 0) {
  switch (query.op) {
    case 'filter':
      return query.type === 'keyword'
        ? `${/\s/.test(query.args) ? `"${query.args}"` : query.args}`
        : `${query.type}:${/\s/.test(query.args) ? `"${query.args}"` : query.args}`;
    case 'not':
      return `-${canonicalizeQuery(query.operand, depth + 1)}`;
    case 'and':
    case 'or': {
      const sortedOperands = _.sortBy(
        query.operands.map((q) => canonicalizeQuery(q, depth + 1)),
        (q) => q.replace(/[(-](.*)/, '$1')
      ).join(query.op === 'and' ? ' ' : ` ${query.op} `);
      return depth === 0 ? sortedOperands : `(${sortedOperands})`;
    }
    case 'noop':
      return '';
  }
}
