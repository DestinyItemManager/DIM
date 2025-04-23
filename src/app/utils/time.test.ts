import i18next from 'i18next';
import { setupi18n } from 'testing/test-utils';
import {
  i15dDurationFromMs,
  i15dDurationFromMsWithSeconds,
  timerDurationFromMs,
  timerDurationFromMsWithDecimal,
} from './time';

beforeAll(() => {
  setupi18n();
});

test.each([
  [1000, '0:00:01'],
  [0, '0:00:00'],
  [279241234, '3:05:34:01'],
  [20041234, '5:34:01'],
])('timerDurationFromMs(%s) === "%s"', (timestamp, expected) => {
  expect(timerDurationFromMs(timestamp)).toBe(expected);
});

test.each([
  [1000, '0:01'],
  [0, '0:00'],
  [279241234, '3:05:34:01.234'],
  [20041234, '5:34:01.234'],
])('timerDurationFromMs(%s) === "%s"', (timestamp, expected) => {
  expect(timerDurationFromMsWithDecimal(timestamp)).toBe(expected);
});

describe('english localization', () => {
  beforeEach(() => {
    i18next.changeLanguage('en');
  });

  test.each([
    [1000, '0:00'],
    [0, '0:00'],
    [86400000, '1 Day 0:00'],
    [279241234, '3 Days 5:34'],
    [20041234, '5:34'],
  ])('i15dDurationFromMs(%s) === "%s"', (timestamp, expected) => {
    expect(i15dDurationFromMs(timestamp)).toBe(expected);
  });

  test.each([
    [1000, '0:00'],
    [0, '0:00'],
    [86400000, '1d 0:00'],
    [279241234, '3d 5:34'],
    [20041234, '5:34'],
  ])('i15dDurationFromMs(%s) === "%s"', (timestamp, expected) => {
    expect(i15dDurationFromMs(timestamp, true)).toBe(expected);
  });

  test.each([
    [1000, '0:00:01'],
    [0, '0:00:00'],
    [279241234, '3 Days 5:34:01'],
    [20041234, '5:34:01'],
  ])('i15dDurationFromMs(%s) === "%s"', (timestamp, expected) => {
    expect(i15dDurationFromMsWithSeconds(timestamp)).toBe(expected);
  });
});

describe('japanese localization', () => {
  beforeEach(() => {
    i18next.changeLanguage('ja');
  });

  test.each([
    [1000, '0:00'],
    [0, '0:00'],
    [86400000, '1日間 0:00'],
    [279241234, '3日間 5:34'],
    [20041234, '5:34'],
  ])('i15dDurationFromMs(%s) === "%s"', (timestamp, expected) => {
    expect(i15dDurationFromMs(timestamp)).toBe(expected);
  });

  test.each([
    [1000, '0:00'],
    [0, '0:00'],
    [86400000, '1日間 0:00'],
    [279241234, '3日間 5:34'],
    [20041234, '5:34'],
  ])('i15dDurationFromMs(%s) === "%s"', (timestamp, expected) => {
    expect(i15dDurationFromMs(timestamp, true)).toBe(expected);
  });

  test.each([
    [1000, '0:00:01'],
    [0, '0:00:00'],
    [279241234, '3日間 5:34:01'],
    [20041234, '5:34:01'],
  ])('i15dDurationFromMs(%s) === "%s"', (timestamp, expected) => {
    expect(i15dDurationFromMsWithSeconds(timestamp)).toBe(expected);
  });
});
