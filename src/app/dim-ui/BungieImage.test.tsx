import React from 'react';
import BungieImage from './BungieImage';
import { render } from '@testing-library/react';

test('bungie image prefixes with ', async () => {
  const { container } = render(<BungieImage src="/foo.jpg" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <img
      loading="lazy"
      src="https://www.bungie.net/foo.jpg"
    />
  `);
});
