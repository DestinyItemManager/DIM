import { DIM_LANGS, DimLanguage } from 'app/i18n';
import { localizedIncludes, localizedSorter } from './intl';

const sortCases: [language: DimLanguage, input: string[], output: string[]][] = [
  [
    'en',
    [
      'foo1',
      'foo10',
      'foo9',
      '🥺',
      '🤯',
      '\uD83D\uDE00', // 😀
    ],
    ['🤯', '🥺', '😀', 'foo1', 'foo9', 'foo10'],
  ],
  ['de', ['foo', 'föo', 'ess', 'eß'], ['ess', 'eß', 'foo', 'föo']],
  ['ko', ['하', '가'], ['가', '하']],
  ['ja', ['あかさ', '赤け', 'アカコ'], ['アカコ', 'あかさ', '赤け']],
  [
    'es',
    [
      'ñ',
      '\u00F1', // ñ
      '\u006E\u0303', // ñ
    ],
    ['ñ', 'ñ', 'ñ'],
  ],
  // For the rest, mostly just test that it constructs correctly. We can add special test cases if we find things we want.
  ['es-mx', ['foo1', 'foo10', 'foo9'], ['foo1', 'foo9', 'foo10']],
  ['fr', ['foo1', 'foo10', 'foo9'], ['foo1', 'foo9', 'foo10']],
  ['it', ['foo1', 'foo10', 'foo9'], ['foo1', 'foo9', 'foo10']],
  ['pl', ['foo1', 'foo10', 'foo9'], ['foo1', 'foo9', 'foo10']],
  ['pt-br', ['foo1', 'foo10', 'foo9'], ['foo1', 'foo9', 'foo10']],
  ['ru', ['foo1', 'foo10', 'foo9'], ['foo1', 'foo9', 'foo10']],
  ['zh-chs', ['foo1', 'foo10', 'foo9'], ['foo1', 'foo9', 'foo10']],
  ['zh-cht', ['foo1', 'foo10', 'foo9'], ['foo1', 'foo9', 'foo10']],
];

it('should include a sorting test case for every supported DIM language', () => {
  expect(new Set(sortCases.map(([language]) => language))).toStrictEqual(new Set(DIM_LANGS));
});

// Test that we can construct this for every supported language
test.each(sortCases)('localizedSorter: %s', (language, input, output) => {
  expect(
    // Map them into objects
    input
      .map((name) => ({
        name,
      }))
      .sort(
        localizedSorter(
          language,
          // un-map the objects into their sort key
          (o) => o.name,
        ),
      )
      // Map back to strings to make the matcher easier
      .map((o) => o.name),
  ).toStrictEqual(output);
});

const includeCases: [language: DimLanguage, input: string, query: string, matches: boolean][] = [
  ['en', 'bar', 'foobar', true],
  ['en', '😀', 'Laughing \uD83D\uDE00!!', true],
  ['en', '\uDE00', 'Laughing \uD83D\uDE00!!', true],
  // A bit weird - some unicode is composed of multiple other characters. In this case it sorta makes sense...
  ['en', '👨‍👩‍👧', '👨‍👩‍👧‍👦', true],
  ['en', 'föo', 'foobar', true],
  ['en', 'Föo', 'foobar', true],
  ['de', 'föo', 'foobar', false],
  ['ko', '가', '하가', true],
  ['ja', 'かさ', 'あかさ赤け', true],
  ['es', 'ño', 'niño', true],
  ['es-mx', 'ño', 'niño', true],
  // For the rest, mostly just test that it constructs correctly. We can add special test cases if we find things we want.
  ['fr', 'bar', 'foobar', true],
  ['it', 'bar', 'foobar', true],
  ['pl', 'bar', 'foobar', true],
  ['pt-br', 'bar', 'foobar', true],
  ['ru', 'bar', 'foobar', true],
  ['zh-chs', 'bar', 'foobar', true],
  ['zh-cht', 'bar', 'foobar', true],
];

it('should include an include test case for every supported DIM language', () => {
  expect(new Set(includeCases.map(([language]) => language))).toStrictEqual(new Set(DIM_LANGS));
});

test.each(includeCases)(
  'localizedIncludes("%s", "%s")("%s") === %s',
  (language, query, input, matches) => {
    expect(localizedIncludes(language, query)(input)).toBe(matches);
  },
);
