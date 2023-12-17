import { serializeCsv } from './csv';

test('csv basic', () => {
  const data = [
    { str: '123', num: 5, undef: undefined, nul: null, bool: true },
    // property order does not matter
    { str: '734', bool: false, undef: undefined, nul: null, num: 4 },
    { str: '567', num: 4, undef: undefined, nul: null, bool: false },
  ];

  const output = serializeCsv(data, {});
  expect(output).toMatchSnapshot();
});

test('csv undef keys in first object', () => {
  const data = [{ str: '123' }, { str: '123', num: 5 }];

  const output = serializeCsv(data, {});
  expect(output).toMatchSnapshot();
});

const arrayData = [
  { str: '123', arr: ['one', 'two', 'three'], str2: 'something' },
  { str: '123', str2: 'blah', arr: ['one', 'two', 'three', 'four'] },
];

test('csv no unpack', () => {
  const output = serializeCsv(arrayData, {});
  expect(output).toMatchSnapshot();
});

test('csv unpack', () => {
  const output = serializeCsv(arrayData, { unpackArrays: ['arr'] });
  expect(output).toMatchSnapshot();
});
