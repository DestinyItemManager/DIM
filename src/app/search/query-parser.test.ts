import { parseQuery } from './query-parser';

// Some of these are contrived, some are from past search parsing issues
const cases = [
  ['is:blue is:haspower -is:maxpower'],
  ['-is:equipped is:haspower is:incurrentchar'],
  ['-source:garden -source:lastwish sunsetsafter:arrival'],
  ['-is:exotic -is:locked -is:maxpower -is:tagged stat:total:<55'],
  ['(is:weapon is:sniperrifle) or (is:armor modslot:arrival)'],
  ['(is:weapon and is:sniperrifle) or not (is:armor and modslot:arrival)'],
  ['-(power:>1000 and -modslot:arrival)'],
  ['name:"Hard Light"'],
  ["name:'Hard Light'"],
  ['name:"Gahlran\'s Right Hand"'],
  ['not witherhoard'],
  ['-witherhoard'],
  ['perk:수집가'],
  ['is:rocketlauncher -"cluster" -"tracking module"'],
  ['is:rocketlauncher -"cluster" -\'tracking module\''],
  ['(is:hunter power:>=540) or (is:warlock power:>=560)'],
  ['"grenade launcher reserves"'],
  // These test copy/pasting from somewhere that automatically converts quotes to "smart quotes"
  ['“grenade launcher reserves”'],
  ['‘grenade launcher reserves’'],
];

test.each(cases)('should parse %s', (query) => {
  const parsed = parseQuery(query);
  expect(parsed).toMatchSnapshot('lexer');
});
