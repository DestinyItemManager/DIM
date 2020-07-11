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

export type Token = [TokenType] | [TokenType, string];

/**
 * The query parser first lexes the string, then parses it into an AST representing the logical
 * structure of the query.
 */
export function parseQuery(query: string) {
  query = query.trim().toLowerCase();

  // http://blog.tatedavies.com/2012/08/28/replace-microsoft-chars-in-javascript/
  query = query.replace(/[\u2018|\u2019|\u201A]/g, "'");
  query = query.replace(/[\u201C|\u201D|\u201E]/g, '"');

  /*
  // \S*?(["']).*?\1 -> match `is:"stuff here"` or `is:'stuff here'`
  // [^\s"']+ -> match is:stuff
  const searchTerms = query.match(/\S*?(["']).*?\1|[^\s"']+/g) || [];
  return searchTerms;
  */

  const tokens: Token[] = [];
  for (const t of lexer(query)) {
    tokens.push(t);
  }
  return tokens;
}

type TokenType = '(' | ')' | 'not' | 'or' | 'and' | 'str' | 'word';

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

  while (i < query.length) {
    const char = query[i];
    const startingIndex = i;

    if (char === '(' || char === ')') {
      // Start/end group
      // TODO: use whitespace tolerant regex??
      consume(char);
      yield [char];
    } else if (char === '"' || char === "'") {
      // Quoted string
      consume(char);
      const quote = char;
      // TODO: cache regexp?
      if ((match = extract(query, i, new RegExp('(.*?)' + quote, 'y'))) !== undefined) {
        consume(match);
        // Slice off the last character
        yield ['str', match.slice(0, match.length - 1)];
      } else {
        throw new Error('Unterminated quotes: |' + query.slice(i) + '| ' + i);
      }
    } else if (char === '-') {
      // TODO: whitespace-tolerant regex
      // minus sign is the same as "not"
      consume(char);
      yield ['not'];
    } else if ((match = extract(query, i, /(not|or|and)/y)) !== undefined) {
      // boolean keywords
      consume(match);
      yield [match as TokenType];
    } else if ((match = extract(query, i, /[^\s)]+/y)) !== undefined) {
      // bare words that aren't keywords
      consume(match);
      yield ['word', match];
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
