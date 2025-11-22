import {
  AndOp,
  canonicalizeQuery,
  FilterOp,
  lexer,
  NoOp,
  NotOp,
  OrOp,
  parseQuery,
  QueryAST,
  quoteFilterString,
  Token,
} from './query-parser';

// To update the snapshots, run:
// npx jest --updateSnapshot src/app/search/query-parser.test.ts

// TODO: failed parse - a failed parse should return the parts that didn't fail plus an error code??

// Some of these are contrived, some are from past search parsing issues
const cases = [
  [`is:blue is:haspower -is:maxpower`],
  [`is:blue is:haspower not:maxpower`],
  [`not:maxpower`],
  [`not -not:maxpower`],
  [`not not not:maxpower`],
  [`is:blue is:weapon or is:armor not:maxpower`], // => is:blue and (is:weapon or is:armor) and -is:maxpower
  [`not not:maxpower`],
  [`-is:equipped is:haspower is:incurrentchar`],
  [`-source:garden -source:lastwish sunsetsafter:arrival`],
  [`-is:exotic -is:locked -is:maxpower -is:tagged stat:total:<55`],
  [`(is:weapon is:sniperrifle) or (is:armor modslot:arrival)`],
  [`(is:weapon and is:sniperrifle) or not (is:armor and modslot:arrival)`],
  [`is:weapon and is:sniperrifle or not is:armor and modslot:arrival`], // => (is:weapon and is:sniperrifle) or (-is:armor and modslot:arrival)
  [`is:weapon is:sniperrifle or not is:armor modslot:arrival`], // => is:weapon and (is:sniperrifle or -is:armor) and modslot:arrival
  [`is:weapon is:sniperrifle or is:armor and modslot:arrival`], // => is:weapon and (is:sniperrifle or (-is:armor modslot:arrival))
  [`is:weapon (is:sniperrifle or (is:armor and modslot:arrival))`], // => is:weapon and (is:sniperrifle or (-is:armor modslot:arrival))
  [`-(power:>1000 and -modslot:arrival)`],
  [`( power:>1000 and -modslot:arrival ) `],
  [`- is:exotic - (power:>1000)`],
  [`is:armor2.0`],
  [`not forgotten`], // => -"forgotten"
  [`cluster tracking`], // => "cluster" and "tracking"
  [`name:"Hard Light"`],
  [`name:'Hard Light'`],
  [`name:"Gahlran's Right Hand"`],
  [`-witherhoard`],
  [`perk:수집가`],
  [`perk:"수집가"`],
  [`"수집가"`],
  [`수집가`],
  [`is:rocketlauncher -"cluster" -"tracking module"`],
  [`is:rocketlauncher -"cluster" -'tracking module'`],
  [`is:rocketlauncher (perk:"cluster" or perk:"tracking module")`],
  [`(is:hunter power:>=540) or (is:warlock power:>=560)`],
  [`"grenade launcher reserves"`],
  // These test copy/pasting from somewhere that automatically converts quotes to "smart quotes"
  [`“grenade launcher reserves”`],
  [`‘grenade launcher reserves’`],
  [`(("test" or "test") and "test")`],
  // https://github.com/TMMania/TMManias-DIM-Filter-Gallery/blob/main/Master%20Filter
  [
    `  (\n    (\n    (is:weapon -is:maxpower powerlimit:1060 or tag:junk or is:blue)\n    or\n    (\n    (is:armor -is:exotic -is:classitem)\n  \n    -(is:titan (basestat:recovery:>=18 or basestat:total:>=63))\n    -(is:hunter ((basestat:recovery:>=13 basestat:mobility:>=18) or basestat:recovery:>15 or basestat:total:>=63))\n    -(is:warlock ((basestat:recovery:>=18 discipline:>=17) or basestat:total:>=63))\n  \n    -(\n    ((basestat:mobility:>=18 basestat:resilience:>=13) or\n    (basestat:mobility:>=18 basestat:recovery:>=13) or\n    (basestat:mobility:>=18 basestat:discipline:>=13) or\n    (basestat:mobility:>=18 basestat:intellect:>=13) or\n    (basestat:mobility:>=18 basestat:strength:>=13) or\n    (basestat:resilience:>=18 basestat:mobility:>=13) or\n    (basestat:resilience:>=18 basestat:recovery:>=13) or\n    (basestat:resilience:>=18 basestat:discipline:>=13) or\n    (basestat:resilience:>=18 basestat:intellect:>=13) or\n    (basestat:resilience:>=18 basestat:strength:>=13) or\n    (basestat:recovery:>=18 basestat:mobility:>=13) or\n    (basestat:recovery:>=18 basestat:resilience:>=13) or\n    (basestat:recovery:>=18 basestat:discipline:>=13) or\n    (basestat:recovery:>=18 basestat:intellect:>=13) or\n    (basestat:recovery:>=18 basestat:strength:>=13) or\n    (basestat:discipline:>=18 basestat:mobility:>=13) or\n    (basestat:discipline:>=18 basestat:resilience:>=13) or\n    (basestat:discipline:>=18 basestat:recovery:>=13) or\n    (basestat:discipline:>=18 basestat:intellect:>=13) or\n    (basestat:discipline:>=18 basestat:strength:>=13) or\n    (basestat:intellect:>=18 basestat:mobility:>=13) or\n    (basestat:intellect:>=18 basestat:resilience:>=13) or\n    (basestat:intellect:>=18 basestat:recovery:>=13) or\n    (basestat:intellect:>=18 basestat:discipline:>=13) or\n    (basestat:intellect:>=18 basestat:strength:>=13) or\n    (basestat:strength:>=18 basestat:mobility:>=13) or\n    (basestat:strength:>=18 basestat:resilience:>=13) or\n    (basestat:strength:>=18 basestat:recovery:>=13) or\n    (basestat:strength:>=18 basestat:discipline:>=13) or\n    (basestat:strength:>=18 basestat:intellect:>=13))\n    )\n  \n    -(\n    ((basestat:mobility:>=13 basestat:resilience:>=13 basestat:recovery:>=13) or\n    (basestat:mobility:>=13 basestat:resilience:>=13 basestat:discipline:>=13) or\n    (basestat:mobility:>=13 basestat:resilience:>=13 basestat:intellect:>=13) or\n    (basestat:mobility:>=13 basestat:resilience:>=13 basestat:strength:>=13) or\n    (basestat:mobility:>=13 basestat:recovery:>=13 basestat:discipline:>=13) or\n    (basestat:mobility:>=13 basestat:recovery:>=13 basestat:intellect:>=13) or\n    (basestat:mobility:>=13 basestat:recovery:>=13 basestat:strength:>=13) or\n    (basestat:mobility:>=13 basestat:discipline:>=13 basestat:intellect:>=13) or\n    (basestat:mobility:>=13 basestat:discipline:>=13 basestat:strength:>=13) or\n    (basestat:mobility:>=13 basestat:intellect:>=13 basestat:strength:>=13) or\n    (basestat:resilience:>=13 basestat:recovery:>=13 basestat:discipline:>=13) or\n    (basestat:resilience:>=13 basestat:recovery:>=13 basestat:intellect:>=13) or\n    (basestat:resilience:>=13 basestat:recovery:>=13 basestat:strength:>=13) or\n    (basestat:resilience:>=13 basestat:discipline:>=13 basestat:intellect:>=13) or\n    (basestat:resilience:>=13 basestat:discipline:>=13 basestat:strength:>=13) or\n    (basestat:resilience:>=13 basestat:intellect:>=13 basestat:strength:>=13) or\n    (basestat:recovery:>=13 basestat:discipline:>=13 basestat:intellect:>=13) or\n    (basestat:recovery:>=13 basestat:discipline:>=13 basestat:strength:>=13) or\n    (basestat:recovery:>=13 basestat:intellect:>=13 basestat:strength:>=13) or\n    (basestat:discipline:>=13 basestat:intellect:>=13 basestat:strength:>=13))\n    )\n  \n    -(basestat:mobility:>=8 basestat:resilience:>=8 basestat:recovery:>=8 basestat:discipline:>=8 basestat:intellect:>=8 basestat:strength:>=8)\n    )\n  \n    or\n    (is:classitem ((is:dupelower -is:modded) or (is:sunset))) \n    or\n    (is:armor -powerlimit:>1060) \n    or\n    (is:armor is:blue)\n    )\n    -tag:keep -tag:archive -tag:favorite -tag:infuse -is:maxpower -power:>=1260 -is:inloadout -is:masterwork\n    )`,
  ],
  // Plaintext special case
  [`not forgotten`],
  [`not (forgotten)`],
  [`not "forgotten"`],
  [`gnawing hunger`],
  // Comments
  [`/* My cool search */ is:armor`],
  [`  /* My cool search */\n is:armor`],
  [
    `/* My cool search */ (/* armor */ is:armor and is:blue) or (/*weapons*/ is:weapon and perkname:"Kill Clip")`,
  ],
  [`   `],
];

// Each of these asserts that the first query is the same as the second query once parsed
const equivalentSearches = [
  [
    `is:blue is:weapon or is:armor not:maxpower`,
    `is:blue and (is:weapon or is:armor) and -is:maxpower`,
  ],
  [`not forgotten`, `-"forgotten"`],
  [`cluster tracking`, `"cluster" and "tracking"`],
  [
    `is:weapon and is:sniperrifle or not is:armor and modslot:arrival`,
    `(is:weapon and is:sniperrifle) or (-is:armor and modslot:arrival)`,
  ],
  [
    `is:weapon is:sniperrifle or not is:armor modslot:arrival`,
    `is:weapon and (is:sniperrifle or -is:armor) and modslot:arrival`,
  ],
  [
    `is:weapon is:sniperrifle or is:armor and modslot:arrival`,
    `is:weapon and (is:sniperrifle or (is:armor and modslot:arrival))`,
  ],
  [
    `is:rocketlauncher perk:"cluster" or perk:"tracking module"`,
    `is:rocketlauncher (perk:"cluster" or perk:"tracking module")`,
  ],
  [`is:blue (is:rocketlauncher`, `is:blue is:rocketlauncher`],
  [`  is:blue  `, `is:blue`],
];

// Test what we generate as the canonical form of queries. The first is the input,
// the second is the canonical version
const canonicalize = [
  [`is:blue is:haspower not:maxpower`, `is:blue is:haspower -is:maxpower`],
  [
    `is:weapon and is:sniperrifle or not is:armor and modslot:arrival`,
    `(is:weapon is:sniperrifle) or (-is:armor modslot:arrival)`,
  ],
  [
    `is:rocketlauncher perk:"cluster" or perk:'tracking module'`,
    `is:rocketlauncher (perk:cluster or perk:"tracking module")`,
  ],
  [`( power:>1000 and -modslot:arrival ) `, `power:>1000 -modslot:arrival`],
  [`food fight`, `food and fight`],
  [`/* My cool search   */\n is:armor`, `/* my cool search */ is:armor`],
  [
    `/* My cool search */ (/* armor */ is:armor and is:blue) or (/*weapons*/ is:weapon and perkname:"Kill Clip")`,
    `/* my cool search */ (is:armor is:blue) or (is:weapon perkname:"kill clip")`,
  ],
  [`inloadout:"----<()>fast"`, `inloadout:"----<()>fast"`],
  [`perkname:"foobar"`, `perkname:foobar`],
  [`perkname:'foo bar'`, `perkname:"foo bar"`],
  [`perkname:"foobar"`, `perkname:foobar`],
  [`perkname:'foo"bar'`, `perkname:'foo"bar'`],
  [`perkname:"foo\\"bar"`, `perkname:'foo"bar'`],
  [`perkname:'foo\\"ba\\'r'`, `perkname:"foo\\"ba'r"`],
];

// Test that we can quote a string, parse it back as part of a search, and get the original string
const quotes = [
  [`foobar`],
  [`Foo\\bar`],
  [`My cool loadout`],
  [`My "cool" loadout`],
  [`My "cool" loadout's little brother`],
  [`My "cool" load\\out's little brother`],
];

test.each(cases)('parse |%s|', (query) => {
  // Test just the lexer
  const tokens: Token[] = [];
  for (const t of lexer(query)) {
    tokens.push(t);
  }
  expect(
    tokens.map((t) => {
      switch (t.type) {
        case 'comment':
          return [t.type, t.content];
        case 'filter':
          return [t.type, t.keyword, t.args];
        default:
          return [t.type];
      }
    }),
  ).toMatchSnapshot('lexer');

  // Test the full parse tree
  const ast = parseQuery(query);
  expect(ast).toMatchSnapshot('ast');
});

test.each(equivalentSearches)('|%s| is equivalent to |%s|', (firstQuery, secondQuery) => {
  const firstAST = parseQuery(firstQuery);
  const secondAST = parseQuery(secondQuery);
  expect(stripIndexes(firstAST)).toEqual(stripIndexes(secondAST));
});

/** Remove the startIndex and length from the AST to make them comparable */
function stripIndexes(ast: QueryAST): AndOp | OrOp | NotOp | FilterOp | NoOp {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  delete (ast as any).startIndex;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  delete (ast as any).length;

  switch (ast.op) {
    case 'and':
    case 'or':
      for (const op of ast.operands) {
        stripIndexes(op);
      }
      break;
    case 'not':
      stripIndexes(ast.operand);
      break;
    default:
      break;
  }

  return ast;
}

test.each(canonicalize)('|%s| is canonically |%s|', (query, expectedCanonical) => {
  const canonicalized = canonicalizeQuery(parseQuery(query));
  expect(canonicalized).toEqual(expectedCanonical);
});

test.each(quotes)('|%s| quoting roundtrip', (str) => {
  const quoted = quoteFilterString(str);
  const ast = parseQuery(`name:${quoted}`);
  if (ast.op === 'filter') {
    expect(ast.args).toEqual(str.toLowerCase());
  } else {
    throw new Error(`Failed: ${quoted}`);
  }
});
