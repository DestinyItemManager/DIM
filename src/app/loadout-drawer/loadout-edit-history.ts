import { useCallback, useReducer } from 'react';
import { LoadoutUpdateFunction } from './loadout-drawer-reducer';
import { Loadout } from './loadout-types';

interface LoadoutEditHistory {
  loadout: Loadout;
  undoStack: Loadout[];
  redoStack: Loadout[];
}

interface SetLoadoutAction {
  type: 'set_loadout';
  loadoutUpdate: LoadoutUpdateFunction;
}

interface UndoAction {
  type: 'undo';
}

interface RedoAction {
  type: 'redo';
}

type Action = SetLoadoutAction | UndoAction | RedoAction;

function loadoutEditHistoryReducer(state: LoadoutEditHistory, action: Action): LoadoutEditHistory {
  switch (action.type) {
    case 'set_loadout': {
      const { undoStack, loadout } = state;
      return {
        loadout: action.loadoutUpdate(loadout),
        undoStack: [...undoStack, loadout],
        redoStack: [],
      };
    }
    case 'undo': {
      const { undoStack, redoStack, loadout } = state;
      if (undoStack.length < 1) {
        throw new Error("Can't undo");
      }
      const previousLoadout = undoStack[undoStack.length - 1];
      return {
        loadout: previousLoadout,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, loadout],
      };
    }
    case 'redo': {
      const { undoStack, redoStack, loadout } = state;
      if (redoStack.length < 1) {
        throw new Error("Can't redo");
      }
      const nextLoadout = redoStack[redoStack.length - 1];
      return {
        loadout: nextLoadout,
        undoStack: [...undoStack, loadout],
        redoStack: redoStack.slice(0, -1),
      };
    }
  }
}

function initializer(loadout: Loadout): LoadoutEditHistory {
  return {
    loadout,
    undoStack: [],
    redoStack: [],
  };
}

// TODO: with a bit of finagling this could be generalized to wrap any state or
// reducer. Perhaps for the loadout optimizer or certain settings?
export function useLoadoutEditHistory(initialLoadout: Loadout) {
  const [{ loadout, undoStack, redoStack }, dispatch] = useReducer(
    loadoutEditHistoryReducer,
    initialLoadout,
    initializer
  );

  const setLoadout = useCallback(
    (loadoutUpdate: LoadoutUpdateFunction) => dispatch({ type: 'set_loadout', loadoutUpdate }),
    []
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return {
    loadout,
    setLoadout,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
