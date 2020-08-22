import { parseQuery, lexer, Token, canonicalizeQuery } from './query-parser';

// To update the snapshots, run:
// npx jest --updateSnapshot src/app/search/query-parser.test.ts

// TODO: failed parse - a failed parse should return the parts that didn't fail plus an error code??

// Some of these are contrived, some are from past search parsing issues
const cases = [
  ['is:blue is:haspower -is:maxpower'],
  ['is:blue is:haspower not:maxpower'],
  ['not:maxpower'],
  ['not -not:maxpower'],
  ['not not not:maxpower'],
  ['is:blue is:weapon or is:armor not:maxpower'], // => is:blue and (is:weapon or is:armor) and -is:maxpower
  ['not not:maxpower'],
  ['-is:equipped is:haspower is:incurrentchar'],
  ['-source:garden -source:lastwish sunsetsafter:arrival'],
  ['-is:exotic -is:locked -is:maxpower -is:tagged stat:total:<55'],
  ['(is:weapon is:sniperrifle) or (is:armor modslot:arrival)'],
  ['(is:weapon and is:sniperrifle) or not (is:armor and modslot:arrival)'],
  ['is:weapon and is:sniperrifle or not is:armor and modslot:arrival'], // => (is:weapon and is:sniperrifle) or (-is:armor and modslot:arrival)
  ['is:weapon is:sniperrifle or not is:armor modslot:arrival'], // => is:weapon and (is:sniperrifle or -is:armor) and modslot:arrival
  ['is:weapon is:sniperrifle or is:armor and modslot:arrival'], // => is:weapon and (is:sniperrifle or (-is:armor modslot:arrival))
  ['is:weapon (is:sniperrifle or (is:armor and modslot:arrival))'], // => is:weapon and (is:sniperrifle or (-is:armor modslot:arrival))
  ['-(power:>1000 and -modslot:arrival)'],
  ['( power:>1000 and -modslot:arrival ) '],
  ['- is:exotic - (power:>1000)'],
  ['is:armor2.0'],
  ['not forgotten'], // => -"forgotten"
  ['cluster tracking'], // => "cluster" and "tracking"
  ['name:"Hard Light"'],
  ["name:'Hard Light'"],
  ['name:"Gahlran\'s Right Hand"'],
  ['-witherhoard'],
  ['perk:수집가'],
  ['perk:"수집가"'],
  ['"수집가"'],
  ['수집가'],
  ['is:rocketlauncher -"cluster" -"tracking module"'],
  ['is:rocketlauncher -"cluster" -\'tracking module\''],
  ['is:rocketlauncher (perk:"cluster" or perk:"tracking module")'],
  ['(is:hunter power:>=540) or (is:warlock power:>=560)'],
  ['"grenade launcher reserves"'],
  // These test copy/pasting from somewhere that automatically converts quotes to "smart quotes"
  ['“grenade launcher reserves”'],
  ['‘grenade launcher reserves’'],
  ['(("test" or "test") and "test")'],
];

// Each of these asserts that the first query is the same as the second query once parsed
const equivalentSearches = [
  [
    'is:blue is:weapon or is:armor not:maxpower',
    'is:blue and (is:weapon or is:armor) and -is:maxpower',
  ],
  ['not forgotten', "-'forgotten'"],
  ['cluster tracking', '"cluster" and "tracking"'],
  [
    'is:weapon and is:sniperrifle or not is:armor and modslot:arrival',
    '(is:weapon and is:sniperrifle) or (-is:armor and modslot:arrival)',
  ],
  [
    'is:weapon is:sniperrifle or not is:armor modslot:arrival',
    'is:weapon and (is:sniperrifle or -is:armor) and modslot:arrival',
  ],
  [
    'is:weapon is:sniperrifle or is:armor and modslot:arrival',
    'is:weapon and (is:sniperrifle or (is:armor and modslot:arrival))',
  ],
  [
    'is:rocketlauncher perk:"cluster" or perk:"tracking module"',
    'is:rocketlauncher (perk:"cluster" or perk:"tracking module")',
  ],
  ['is:blue (is:rocketlauncher', 'is:blue is:rocketlauncher'],
];

// Test what we generate as the canonical form of queries. The first is the input,
// the second is the canonical version
const canonicalize = [
  ['is:blue is:haspower not:maxpower', 'is:blue is:haspower -is:maxpower'],
  [
    'is:weapon and is:sniperrifle or not is:armor and modslot:arrival',
    '(-is:armor modslot:arrival) or (is:sniperrifle is:weapon)',
  ],
  [
    'is:rocketlauncher perk:"cluster" or perk:\'tracking module\'',
    'is:rocketlauncher (perk:"tracking module" or perk:cluster)',
  ],
  ['( power:>1000 and -modslot:arrival ) ', '-modslot:arrival power:>1000'],
  ['food fight', 'fight food'],
];

test.each(cases)('parse |%s|', (query) => {
  // Test just the lexer
  const tokens: Token[] = [];
  for (const t of lexer(query)) {
    tokens.push(t);
  }
  expect(tokens).toMatchSnapshot('lexer');

  // Test the full parse tree
  const ast = parseQuery(query);
  expect(ast).toMatchSnapshot('ast');
});

test.each(equivalentSearches)('|%s| is equivalent to |%s|', (firstQuery, secondQuery) => {
  const firstAST = parseQuery(firstQuery);
  const secondAST = parseQuery(secondQuery);
  expect(firstAST).toEqual(secondAST);
});

test.each(canonicalize)('|%s| is canonically |%s|', (query, canonical) => {
  const canonicalized = canonicalizeQuery(parseQuery(query));
  expect(canonicalized).toEqual(canonical);
});
