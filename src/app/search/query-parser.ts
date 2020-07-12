/*
is:blue is:haspower -is:maxpower
-is:equipped is:haspower is:incurrentchar
-source:garden -source:lastwish sunsetsafter:arrival
-is:exotic -is:locked -is:maxpower -is:tagged stat:total:<55
(is:weapon is:sniperrifle) or (is:armor modslot:arrival)
(is:weapon and is:sniperrifle) or not (is:armor and modslot:arrival)
-(power:>1000 and -modslot:arrival)
*/

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

type QueryAST = AndOp | OrOp | NotOp | FilterOp | NoOp;

interface AndOp {
  op: 'and';
  operands: QueryAST[];
}

interface OrOp {
  op: 'or';
  operands: QueryAST[];
}

interface NotOp {
  op: 'not';
  operand: QueryAST;
}

interface FilterOp {
  op: 'filter';
  type: string;
  args: string;
}

interface NoOp {
  op: 'noop';
}

class PeekableGenerator<T> {
  private gen: Generator<T>;
  private next: T | undefined;

  constructor(gen: Generator<T>) {
    this.gen = gen;
  }

  peek(): T | undefined {
    if (!this.next) {
      this.next = this.gen.next().value;
    }
    return this.next;
  }

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
 * The query parser first lexes the string, then parses it into an AST (abstract syntax tree)
 * representing the logical structure of the query. This AST can then be walked to match up
 * to defined filters and generate an actual filter function.
 *
 * We choose to produce an AST instead of executing the search inline with parsing both to
 * make testing easier, and to allow for things like canonicalization of search queries.
 */
export function parseQuery(query: string): QueryAST {
  // TODO: how to limit how many expressions this consumes?
  // https://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing
  // TODO: implement operator precedence, with lower precedence for implicit and?
  // TODO: separate into parseAtom and an operator-focused loop?
  /**
   * Parse a stream of tokens into an AST. If `singleExpression` is passed, this expects
   * to parse exactly one filter or parenthesized subquery and then returns.
   */
  const parse = (tokens: PeekableGenerator<Token>, singleExpression = false): QueryAST => {
    let ast: QueryAST = {
      op: 'and',
      operands: [],
    };

    let token: Token | undefined;
    while ((token = tokens.peek())) {
      console.log('START', token, ast);
      if (singleExpression && !['filter', 'not', '('].includes(token[0])) {
        break;
      }
      tokens.pop();

      switch (token[0]) {
        case 'filter':
          {
            if (ast.op !== 'and' && ast.op !== 'or') {
              throw new Error('expected to be in an and/or expression');
            }
            const keyword = token[1];
            if (keyword === 'not') {
              // not: is a synonym for -is:
              ast.operands.push({
                op: 'not',
                operand: {
                  op: 'filter',
                  type: 'is',
                  args: token[2],
                },
              });
            } else {
              ast.operands.push({
                op: 'filter',
                type: keyword,
                args: token[2],
              });
            }
          }
          break;
        case 'not':
          {
            if (ast.op !== 'and' && ast.op !== 'or') {
              throw new Error('expected to be in an and/or expression');
            }
            // parse next espression?
            // Parse all the rest then fish out the leftmost?
            ast.operands.push({
              op: 'not',
              // TODO: how to limit it to a single expression?
              operand: parse(tokens, true),
            });
          }
          break;
        case 'and':
          {
            if (ast.op === 'and') {
              ast.operands.push(parse(tokens, true));
            } else {
              ast = {
                op: 'and',
                operands: [ast, parse(tokens, true)],
              };
            }
          }
          break;
        case 'or':
          {
            if (ast.op === 'or') {
              ast.operands.push(parse(tokens, true));
            } else {
              ast = {
                op: 'or',
                operands: [ast, parse(tokens, true)],
              };
            }
          }
          break;
        case '(':
          {
            if (ast.op !== 'and' && ast.op !== 'or') {
              throw new Error('expected to be in an and/or expression');
            }
            const subQuery = parse(new PeekableGenerator(untilCloseParen(tokens)));
            if (ast.operands.length > 0) {
              ast.operands.push(subQuery);
            } else {
              ast = subQuery;
            }
          }
          break;
        default:
          throw new Error('Invalid syntax: ' + token + ', ' + query);
      }

      console.log('END', token, ast, tokens);
    }

    console.log('ALLDONE', token, ast);

    if (ast.op === 'and' || ast.op === 'or') {
      if (ast.operands.length === 1) {
        return ast.operands[0];
      } else if (ast.operands.length === 0) {
        return {
          op: 'noop',
        };
      }
    }
    return ast;
  };

  const tokens = lexer(query);
  const ast = parse(new PeekableGenerator(tokens));
  return ast;
}

type NoArgTokenType = '(' | ')' | 'not' | 'or' | 'and';
export type Token = [NoArgTokenType] | ['filter', string, string];

/**
 * Yield tokens from the passed in generator until we reach a closing parenthesis token.
 */
function* untilCloseParen(tokens: PeekableGenerator<Token>): Generator<Token> {
  let token: Token | undefined;
  while ((token = tokens.pop())) {
    if (token[0] === ')') {
      return;
    }
    yield token;
  }
}

/**
 * Yield tokens from the passed in generator until we reach an and/or token.
 */
// TODO: this really needs "peek"...
/*
function* untilBooleanOp(tokens: Generator<Token>): Generator<Token> {
  for (const token of tokens) {
    if (token[0] === 'and') {
      return;
    }
    yield token;
  }
}
*/

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
const booleanKeywords = /(not|\s*or|\s*and)\s*/y;
// Filter names like is:, stat:discipline:, etc
const filterName = /[a-z]+:([a-z]+:)?/y;
// Arguments to filters are pretty unconstrained
const filterArgs = /[^\s()]+/y;
// Words without quotes are basically any non-whitespace that doesn't terminate a group
const bareWords = /[^\s)]+/y;
// Whitespace that doesn't match anything else is an implicit `and`
const whitespace = /\s+/y;

/**
 * The lexer yields a series of tokens representing the linear structure of the search query.
 * This throws an exception if it finds an invalid input.
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
   * If `str` matches `re` starting at `index`, return the matched portion of the string. Otherwise return undefined.
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
    // TODO: cache regexp?
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
      yield ['and'];
    } else {
      throw new Error('unrecognized tokens: |' + query.slice(i) + '| ' + i);
    }

    if (startingIndex === i) {
      throw new Error('bug: forgot to consume characters');
    }
  }
}
