import { clearAllHotkeysForTest, registerHotkeys, removeHotkeysById } from './hotkeys';

beforeEach(clearAllHotkeysForTest);

it('stacks hotkeys', () => {
  let p1 = 0;
  const handleP1 = () => {
    p1++;
  };
  let p2 = 0;
  const handleP2 = () => {
    p2++;
  };
  let p3 = 0;
  const handleP3 = () => {
    p3++;
  };

  registerHotkeys('1', [{ combo: 'p', callback: handleP1, description: 'p' }]);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));

  expect(p1).toBe(1);

  registerHotkeys('2', [{ combo: 'p', callback: handleP2, description: 'p' }]);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));

  expect(p1).toBe(1);
  expect(p2).toBe(1);

  // Now, re-register 1 with a different handler
  registerHotkeys('1', [{ combo: 'p', callback: handleP3, description: 'p' }]);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));

  // It should still trigger p2!
  expect(p1).toBe(1);
  expect(p2).toBe(2);
  expect(p3).toBe(0);

  removeHotkeysById('2', 'p');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));

  expect(p1).toBe(1);
  expect(p2).toBe(2);
  expect(p3).toBe(1);
});

// Fixes https://github.com/DestinyItemManager/DIM/issues/6246
it('allows Escape hotkey when an input is focused', () => {
  const cb = jest.fn();
  registerHotkeys('esc', [{ combo: 'Escape', callback: cb, description: 'p' }]);

  const input = document.createElement('input');
  document.body.appendChild(input);

  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  expect(cb).toHaveBeenCalled();
});
