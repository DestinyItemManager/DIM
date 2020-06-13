import React from 'react';
import { render } from '@testing-library/react';
import BungieImageAndAmmo from './BungieImageAndAmmo';

it('should have an extra class name ', () => {
  const { container } = render(
    <BungieImageAndAmmo src="/foo.png" hash={143442373} className="test-class-name" />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="test-class-name container"
    >
      <img
        class="no-pointer-events"
        loading="lazy"
        src="https://www.bungie.net/foo.png"
      />
      <div
        class="ammo ammo-primary"
      />
    </div>
  `);
});

it('should not have an extra class name ', () => {
  const { container } = render(<BungieImageAndAmmo src="/foo.png" hash={143442373} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="container"
    >
      <img
        class="no-pointer-events"
        loading="lazy"
        src="https://www.bungie.net/foo.png"
      />
      <div
        class="ammo ammo-primary"
      />
    </div>
  `);
});

it('should be a primary ammo image ', () => {
  const { container } = render(<BungieImageAndAmmo src="/foo.png" hash={143442373} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="container"
    >
      <img
        class="no-pointer-events"
        loading="lazy"
        src="https://www.bungie.net/foo.png"
      />
      <div
        class="ammo ammo-primary"
      />
    </div>
  `);
});

it('should be a special ammo image ', () => {
  const { container } = render(<BungieImageAndAmmo src="/foo.png" hash={2620835322} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="container"
    >
      <img
        class="no-pointer-events"
        loading="lazy"
        src="https://www.bungie.net/foo.png"
      />
      <div
        class="ammo ammo-special"
      />
    </div>
  `);
});

it('should be a heavy ammo image ', () => {
  const { container } = render(<BungieImageAndAmmo src="/foo.png" hash={2867719094} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="container"
    >
      <img
        class="no-pointer-events"
        loading="lazy"
        src="https://www.bungie.net/foo.png"
      />
      <div
        class="ammo ammo-heavy"
      />
    </div>
  `);
});

it('should have no ammo image if hashes do not match ', () => {
  const { container } = render(<BungieImageAndAmmo src="/foo.png" hash={1111111111} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="container"
    >
      <img
        class="no-pointer-events"
        loading="lazy"
        src="https://www.bungie.net/foo.png"
      />
    </div>
  `);
});
