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
 * The query parser first lexes the string, then parses it into an AST representing the logical
 * structure of the query.
 */
export function parseQuery(query: string) {
  // TODO: how to limit how many expressions this consumes?
  const parse = (tokens: PeekableGenerator<Token>, rightAssociative = false): QueryAST => {
    let ast: QueryAST = {
      op: 'and',
      operands: [],
    };

    let token: Token | undefined;
    while ((token = tokens.peek())) {
      console.log('START', token, ast);
      if (rightAssociative && !['filter', 'not', '('].includes(token[0])) {
        break;
      }

      switch (token[0]) {
        case 'filter':
          {
            if (ast.op !== 'and' && ast.op !== 'or') {
              throw new Error('expected to be in an and/or expression');
            }
            tokens.pop();
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
            tokens.pop();
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
            tokens.pop();
            if (ast.op === 'and') {
              ast.operands.push(parse(tokens));
            } else {
              ast = {
                op: 'and',
                operands: [ast, parse(tokens)],
              };
            }
          }
          break;
        case 'or':
          {
            tokens.pop();
            if (ast.op === 'or') {
              ast.operands.push(parse(tokens));
            } else {
              ast = {
                op: 'or',
                operands: [ast, parse(tokens)],
              };
            }
          }
          break;
        case '(':
          {
            tokens.pop();
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

/**
 * The lexer yields a series of tokens representing the linear structure of the search query.
 * This throws an exception if it finds an invalid input.
 */
// TODO: maybe generators are a mistake
export function* lexer(query: string): Generator<Token> {
  query = query.trim().toLowerCase();

  // http://blog.tatedavies.com/2012/08/28/replace-microsoft-chars-in-javascript/
  query = query.replace(/[\u2018|\u2019|\u201A]/g, "'");
  query = query.replace(/[\u201C|\u201D|\u201E]/g, '"');

  let match: string | undefined;
  let i = 0;

  const consume = (str: string) => (i += str.length);

  const consumeString = (startingQuoteChar: string) => {
    // Quoted string
    consume(startingQuoteChar);
    // TODO: cache regexp?
    if ((match = extract(query, i, new RegExp('(.*?)' + startingQuoteChar, 'y'))) !== undefined) {
      consume(match);
      // Slice off the last character
      return match.slice(0, match.length - 1);
    } else {
      throw new Error('Unterminated quotes: |' + query.slice(i) + '| ' + i);
    }
  };

  while (i < query.length) {
    const char = query[i];
    const startingIndex = i;

    if ((match = extract(query, i, /(\(\s*|\s*\))/y)) !== undefined) {
      // Start/end group
      // TODO: use whitespace tolerant regex??
      consume(match);
      yield [match.trim() as NoArgTokenType];
    } else if (char === '"' || char === "'") {
      // Quoted string
      yield ['filter', 'keyword', consumeString(char)];
    } else if ((match = extract(query, i, /-\s*/y)) !== undefined) {
      // minus sign is the same as "not"
      consume(match);
      yield ['not'];
    } else if ((match = extract(query, i, /(not|\s*or|\s*and)\s*/y)) !== undefined) {
      // boolean keywords
      consume(match);
      yield [match.trim() as NoArgTokenType];
    } else if ((match = extract(query, i, /[a-z]+:([a-z]+:)?/y)) !== undefined) {
      // Keyword searches - is:, stat:discipline:, etc
      consume(match);
      const keyword = match.slice(0, match.length - 1);
      const nextChar = query[i];

      let args = '';

      if (nextChar === '"' || nextChar === "'") {
        args = consumeString(nextChar);
      } else if ((match = extract(query, i, /[^\s()]+/y)) !== undefined) {
        consume(match);
        args = match;
      } else {
        throw new Error('missing keyword arguments for ' + match);
      }

      yield ['filter', keyword, args];
    } else if ((match = extract(query, i, /[^\s)]+/y)) !== undefined) {
      // bare words that aren't keywords are effectively "keyword" type filters
      consume(match);
      yield ['filter', 'keyword', match];
    } else if ((match = extract(query, i, /\s+/y)) !== undefined) {
      consume(match);
      yield ['and'];
    } else {
      throw new Error(
        'unrecognized: |' +
          query.slice(i) +
          '| ' +
          i +
          ' wtf: ' +
          /^[^\s)]+/g.test(query.slice(i)) +
          '|' +
          (match = extract(query, i, /^[^\s)]+/g)) +
          '|' +
          ' :: ' +
          /^\s+/g.test(query.slice(i)) +
          '|' +
          (match = extract(query, i, /^\s+/g)) +
          '|'
      );
    }

    if (startingIndex === i) {
      throw new Error('bug: forgot to consume characters');
    }
  }
}

// TODO: maybe move into lexer as a closure, consume inside
/**
 * If `str` matches `re` starting at `index`, return the matched portion of the string. Otherwise return undefined.
 * This avoids having to make slices of strings just to start the regex in the middle of a string.
 *
 * Note that regexes passed to this must have the "sticky" flag set (y) and should not use ^, which will match the
 * beginning of the string, ignoring the index we want to start from. The sticky flag ensures our regex will match
 * based on the beginning of the string.
 */
function extract(str: string, index: number, re: RegExp): string | undefined {
  // These checks only run in unit tests
  if ($DIM_FLAVOR === 'test') {
    if (!re.sticky) {
      throw new Error('regexp must be sticky');
    }
    if (re.source.startsWith('^')) {
      throw new Error('regexp cannot start with ^ and be repositioned');
    }
  }

  re.lastIndex = index;
  const match = re.exec(str);
  if (match) {
    const result = match[0];
    if (result.length > 0) {
      return result;
    }
  }
  return undefined;
}
