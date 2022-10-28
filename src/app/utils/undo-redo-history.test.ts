import { act, renderHook } from '@testing-library/react';
import { newLoadout } from 'app/loadout-drawer/loadout-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { useHistory } from './undo-redo-history';

// Hilariously when I looked up a guide to testing React hooks... it was for testing a useUndo hook:
// https://kentcdodds.com/blog/how-to-test-custom-react-hooks
test('allows you to undo and redo loadout edits', () => {
  const initialLoadout = newLoadout('', [], DestinyClass.Hunter);
  const { result } = renderHook(() => useHistory(initialLoadout));

  // assert initial state
  expect(result.current.canUndo).toBe(false);
  expect(result.current.canRedo).toBe(false);
  expect(result.current.state).toEqual(initialLoadout);

  // make a change
  act(() => {
    result.current.setState((loadout) => ({ ...loadout, name: 'foo' }));
  });

  // assert new state
  expect(result.current.canUndo).toBe(true);
  expect(result.current.canRedo).toBe(false);
  expect(result.current.state.name).toEqual('foo');

  // another change
  act(() => {
    result.current.setState((loadout) => ({
      ...loadout,
      items: [{ id: '2', hash: 1, amount: 1, equip: true }],
    }));
  });

  // assert new state
  expect(result.current.canUndo).toBe(true);
  expect(result.current.canRedo).toBe(false);
  expect(result.current.state.items).toEqual([{ id: '2', hash: 1, amount: 1, equip: true }]);
  expect(result.current.state.name).toEqual('foo');

  // undo
  act(() => {
    result.current.undo();
  });

  // assert "undone" state
  expect(result.current.canUndo).toBe(true);
  expect(result.current.canRedo).toBe(true);
  expect(result.current.state.items).toEqual([]);
  expect(result.current.state.name).toEqual('foo');

  // undo again
  act(() => {
    result.current.undo();
  });

  // assert "double-undone" state
  expect(result.current.canUndo).toBe(false);
  expect(result.current.canRedo).toBe(true);
  expect(result.current.state.items).toEqual([]);
  expect(result.current.state.name).toEqual('');

  // redo
  act(() => {
    result.current.redo();
  });

  // assert undo + undo + redo state
  expect(result.current.canUndo).toBe(true);
  expect(result.current.canRedo).toBe(true);
  expect(result.current.state.items).toEqual([]);
  expect(result.current.state.name).toEqual('foo');

  // add fourth value
  act(() => {
    result.current.setState((loadout) => ({ ...loadout, name: 'bar' }));
  });

  // assert final state (note the lack of "third")
  expect(result.current.canUndo).toBe(true);
  expect(result.current.canRedo).toBe(false);
  expect(result.current.state.items).toEqual([]);
  expect(result.current.state.name).toEqual('bar');
});
