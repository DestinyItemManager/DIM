import { useCallback, useReducer } from 'react';

interface History<S> {
  state: S;
  undoStack: S[];
  redoStack: S[];
}

type StateUpdateFunction<S> = (oldState: S) => S;

interface SetAction<S> {
  type: 'set';
  update: StateUpdateFunction<S>;
}

interface UndoAction {
  type: 'undo';
}

interface RedoAction {
  type: 'redo';
}

type Action<S> = SetAction<S> | UndoAction | RedoAction;

function historyReducer<S>(oldState: History<S>, action: Action<S>): History<S> {
  switch (action.type) {
    case 'set': {
      const { undoStack, state } = oldState;
      return {
        state: action.update(state),
        undoStack: [...undoStack, state],
        redoStack: [],
      };
    }
    case 'undo': {
      const { undoStack, redoStack, state } = oldState;
      if (undoStack.length < 1) {
        throw new Error("Can't undo");
      }
      const previousState = undoStack[undoStack.length - 1];
      return {
        state: previousState,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, state],
      };
    }
    case 'redo': {
      const { undoStack, redoStack, state } = oldState;
      if (redoStack.length < 1) {
        throw new Error("Can't redo");
      }
      const nextState = redoStack[redoStack.length - 1];
      return {
        state: nextState,
        undoStack: [...undoStack, state],
        redoStack: redoStack.slice(0, -1),
      };
    }
  }
}

function initializer<S>(state: S): History<S> {
  return {
    state,
    undoStack: [],
    redoStack: [],
  };
}

export function useHistory<S>(initialState: S): {
  state: S;
  setState: (f: StateUpdateFunction<S>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
} {
  // Needed for type checking, TS otherwise seems to get lost
  // in weaker overloads of `useReducer`?
  const reducer: typeof historyReducer<S> = historyReducer;
  const [{ state, undoStack, redoStack }, dispatch] = useReducer(
    reducer,
    initialState,
    initializer
  );

  const setState = useCallback(
    (f: StateUpdateFunction<S>) => dispatch({ type: 'set', update: f }),
    []
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
