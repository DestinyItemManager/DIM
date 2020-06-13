import React from 'react';
import BungieImage, { bungieBackgroundStyle, BungieImagePath, bungieNetPath } from './BungieImage';
import { render } from '@testing-library/react';

test('bungie image prefixes with ', () => {
  const { container } = render(<BungieImage src="/foo.jpg" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <img
      class="no-pointer-events"
      loading="lazy"
      src="https://www.bungie.net/foo.jpg"
    />
  `);
});

test('bungie net path ', () => {
  let testData: string = '';
  expect(bungieNetPath(testData)).toBeFalsy();
  testData = '~whatever';
  expect(bungieNetPath(testData)).toBe('whatever');
  testData = '/foo.jpg';
  expect(bungieNetPath(testData)).toBe('https://www.bungie.net' + testData);
});

test('bungie background direct link ', () => {
  let testString: BungieImagePath = '~test';
  const data = { backgroundImage: `url("test")` };
  expect(bungieBackgroundStyle(testString)).toStrictEqual(data);
});
