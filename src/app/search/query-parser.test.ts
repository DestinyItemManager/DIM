import { canonicalizeQuery, lexer, parseQuery, Token } from './query-parser';

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
  // https://github.com/TMMania/TMManias-DIM-Filter-Gallery/blob/main/Master%20Filter
  [
    '  (\n    (\n    (is:weapon -is:maxpower powerlimit:1060 or tag:junk or is:blue)\n    or\n    (\n    (is:armor -is:exotic -is:classitem)\n  \n    -(is:titan (basestat:recovery:>=18 or basestat:total:>=63))\n    -(is:hunter ((basestat:recovery:>=13 basestat:mobility:>=18) or basestat:recovery:>15 or basestat:total:>=63))\n    -(is:warlock ((basestat:recovery:>=18 discipline:>=17) or basestat:total:>=63))\n  \n    -(\n    ((basestat:mobility:>=18 basestat:resilience:>=13) or\n    (basestat:mobility:>=18 basestat:recovery:>=13) or\n    (basestat:mobility:>=18 basestat:discipline:>=13) or\n    (basestat:mobility:>=18 basestat:intellect:>=13) or\n    (basestat:mobility:>=18 basestat:strength:>=13) or\n    (basestat:resilience:>=18 basestat:mobility:>=13) or\n    (basestat:resilience:>=18 basestat:recovery:>=13) or\n    (basestat:resilience:>=18 basestat:discipline:>=13) or\n    (basestat:resilience:>=18 basestat:intellect:>=13) or\n    (basestat:resilience:>=18 basestat:strength:>=13) or\n    (basestat:recovery:>=18 basestat:mobility:>=13) or\n    (basestat:recovery:>=18 basestat:resilience:>=13) or\n    (basestat:recovery:>=18 basestat:discipline:>=13) or\n    (basestat:recovery:>=18 basestat:intellect:>=13) or\n    (basestat:recovery:>=18 basestat:strength:>=13) or\n    (basestat:discipline:>=18 basestat:mobility:>=13) or\n    (basestat:discipline:>=18 basestat:resilience:>=13) or\n    (basestat:discipline:>=18 basestat:recovery:>=13) or\n    (basestat:discipline:>=18 basestat:intellect:>=13) or\n    (basestat:discipline:>=18 basestat:strength:>=13) or\n    (basestat:intellect:>=18 basestat:mobility:>=13) or\n    (basestat:intellect:>=18 basestat:resilience:>=13) or\n    (basestat:intellect:>=18 basestat:recovery:>=13) or\n    (basestat:intellect:>=18 basestat:discipline:>=13) or\n    (basestat:intellect:>=18 basestat:strength:>=13) or\n    (basestat:strength:>=18 basestat:mobility:>=13) or\n    (basestat:strength:>=18 basestat:resilience:>=13) or\n    (basestat:strength:>=18 basestat:recovery:>=13) or\n    (basestat:strength:>=18 basestat:discipline:>=13) or\n    (basestat:strength:>=18 basestat:intellect:>=13))\n    )\n  \n    -(\n    ((basestat:mobility:>=13 basestat:resilience:>=13 basestat:recovery:>=13) or\n    (basestat:mobility:>=13 basestat:resilience:>=13 basestat:discipline:>=13) or\n    (basestat:mobility:>=13 basestat:resilience:>=13 basestat:intellect:>=13) or\n    (basestat:mobility:>=13 basestat:resilience:>=13 basestat:strength:>=13) or\n    (basestat:mobility:>=13 basestat:recovery:>=13 basestat:discipline:>=13) or\n    (basestat:mobility:>=13 basestat:recovery:>=13 basestat:intellect:>=13) or\n    (basestat:mobility:>=13 basestat:recovery:>=13 basestat:strength:>=13) or\n    (basestat:mobility:>=13 basestat:discipline:>=13 basestat:intellect:>=13) or\n    (basestat:mobility:>=13 basestat:discipline:>=13 basestat:strength:>=13) or\n    (basestat:mobility:>=13 basestat:intellect:>=13 basestat:strength:>=13) or\n    (basestat:resilience:>=13 basestat:recovery:>=13 basestat:discipline:>=13) or\n    (basestat:resilience:>=13 basestat:recovery:>=13 basestat:intellect:>=13) or\n    (basestat:resilience:>=13 basestat:recovery:>=13 basestat:strength:>=13) or\n    (basestat:resilience:>=13 basestat:discipline:>=13 basestat:intellect:>=13) or\n    (basestat:resilience:>=13 basestat:discipline:>=13 basestat:strength:>=13) or\n    (basestat:resilience:>=13 basestat:intellect:>=13 basestat:strength:>=13) or\n    (basestat:recovery:>=13 basestat:discipline:>=13 basestat:intellect:>=13) or\n    (basestat:recovery:>=13 basestat:discipline:>=13 basestat:strength:>=13) or\n    (basestat:recovery:>=13 basestat:intellect:>=13 basestat:strength:>=13) or\n    (basestat:discipline:>=13 basestat:intellect:>=13 basestat:strength:>=13))\n    )\n  \n    -(basestat:mobility:>=8 basestat:resilience:>=8 basestat:recovery:>=8 basestat:discipline:>=8 basestat:intellect:>=8 basestat:strength:>=8)\n    )\n  \n    or\n    (is:classitem ((is:dupelower -is:modded) or (is:sunset))) \n    or\n    (is:armor -powerlimit:>1060) \n    or\n    (is:armor is:blue)\n    )\n    -tag:keep -tag:archive -tag:favorite -tag:infuse -is:maxpower -power:>=1260 -is:inloadout -is:masterwork\n    )',
  ],
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
