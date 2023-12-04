// State tracking and publishing for the loadout apply process.

import { DimItem } from 'app/inventory/item-types';
import { Observable } from 'app/utils/observable';
import { produce } from 'immer';

/**
 * What part of the loadout application process are we currently in?
 */
export const enum LoadoutApplyPhase {
  NotStarted,
  /** De-equip loadout items from other characters so they can be moved */
  Deequip,
  /** Moving items to the selected store */
  MoveItems,
  /** Equip any items marked as equip */
  EquipItems,
  /** Apply perk/socket configurations to specific items */
  SocketOverrides,
  /** Assign mods to armor and apply them */
  ApplyMods,
  /** Clear out empty space */
  ClearSpace,
  /** Applying in game loadout */
  InGameLoadout,
  /** Terminal state, loadout succeeded */
  Succeeded,
  /** Terminal state, loadout failed */
  Failed,
}

export const enum LoadoutItemState {
  Pending,
  /** A successful state (maybe we don't need to distinguish this) for items that didn't need to be moved. */
  AlreadyThere,
  DequippedPendingMove,
  /** The item was moved but still needs to be equipped */
  MovedPendingEquip,
  Succeeded,
  FailedDequip,
  FailedMove,
  FailedEquip,
}

export interface LoadoutItemResult {
  readonly item: DimItem;
  readonly state: LoadoutItemState;
  readonly equip: boolean;
  readonly error?: Error;
}

export const enum LoadoutModState {
  Pending,
  Unassigned,
  Applied,
  Failed,
}

export interface LoadoutModResult {
  readonly modHash: number;
  readonly state: LoadoutModState;
  readonly error?: Error;
}

export const enum LoadoutSocketOverrideState {
  Pending,
  Applied,
  Failed,
}

export interface LoadoutSocketOverrideResult {
  readonly item: DimItem;
  readonly results: {
    readonly [socketIndex: number]: {
      readonly plugHash: number;
      readonly state: LoadoutSocketOverrideState;
      readonly error?: Error;
    };
  };
}

/**
 * This is the current state of the loadout application, which can be accessed
 * or updated from within the loadout application process. It also powers the
 * loadout progress and result notification.
 */
export interface LoadoutApplyState {
  /** What phase of the loadout application process are we currently on? */
  readonly phase: LoadoutApplyPhase;
  /**
   * This is set if we've discovered that the player is in a location that does
   * not allow equipping items/mods. We will short circuit many actions and show
   * a custom result.
   */
  readonly equipNotPossible: boolean;
  /**
   * For each item in the loadout, how did it fare in the loadout application process?
   */
  readonly itemStates: {
    readonly [itemIndex: string]: LoadoutItemResult;
  };
  /**
   * For each item with socket overrides, how did the overrides go?
   */
  readonly socketOverrideStates: {
    readonly [itemIndex: string]: LoadoutSocketOverrideResult;
  };
  /**
   * For each mod to be applied, how did it go?
   */
  // TODO: how to get a consistent display sort?
  readonly modStates: LoadoutModResult[];

  /** Whether the in game loadout could not be equipped because you're in an activity. */
  readonly inGameLoadoutInActivity: boolean;
}

export type LoadoutStateGetter = () => LoadoutApplyState;
export type LoadoutStateUpdater = (update: (state: LoadoutApplyState) => LoadoutApplyState) => void;

/**
 * Build a state tracker that can be subscribed to, checked, and updated. This
 * is basically a little private Redux state per-loadout-application - we could
 * go through Redux but it seems like too much.
 */
export function makeLoadoutApplyState(): [
  /** Get the current state */
  get: LoadoutStateGetter,
  /** Set the current state to a new state */
  set: LoadoutStateUpdater,
  /** An observable that can be used to subscribe to state updates. */
  observable: Observable<LoadoutApplyState>,
] {
  // TODO: fill in more of the initial state from the loadout, or wait for loadout-apply to do it?
  const initialLoadoutApplyState: LoadoutApplyState = {
    phase: LoadoutApplyPhase.NotStarted,
    equipNotPossible: false,
    itemStates: {},
    socketOverrideStates: {},
    modStates: [],
    inGameLoadoutInActivity: false,
  };

  const observable = new Observable(initialLoadoutApplyState);

  const get = () => observable.getCurrentValue();
  const set = (update: (state: LoadoutApplyState) => LoadoutApplyState) => {
    const newState = update(observable.getCurrentValue());
    observable.next(newState);
  };

  return [get, set, observable];
}

export function setLoadoutApplyPhase(phase: LoadoutApplyPhase) {
  return (state: LoadoutApplyState) => ({
    ...state,
    phase,
  });
}

export function setModResult(result: LoadoutModResult, equipNotPossible?: boolean) {
  return produce<LoadoutApplyState>((state) => {
    const mod = state.modStates.find(
      (m) => m.modHash === result.modHash && m.state === LoadoutModState.Pending,
    );
    if (mod) {
      mod.state = result.state;
      mod.error = result.error;
    } else {
      state.modStates.push(result);
    }
    state.equipNotPossible ||= equipNotPossible || false;
  });
}

export function setSocketOverrideResult(
  item: DimItem,
  socketIndex: number,
  socketState: LoadoutSocketOverrideState,
  error?: Error,
  equipNotPossible?: boolean,
) {
  return produce<LoadoutApplyState>((state) => {
    const thisSocketResult = state.socketOverrideStates[item.index].results[socketIndex];

    // don't insert a state or error for anything that wasn't given an initial tracking state
    if (!thisSocketResult) {
      return;
    }

    thisSocketResult.state = socketState;
    thisSocketResult.error = error;
    state.equipNotPossible ||= equipNotPossible || false;
  });
}

/**
 * Has any part of the loadout application process failed?
 */
export function anyActionFailed(state: LoadoutApplyState) {
  if (state.inGameLoadoutInActivity) {
    return true;
  }
  if (
    Object.values(state.itemStates).some(
      (s) => s.state !== LoadoutItemState.Succeeded && s.state !== LoadoutItemState.AlreadyThere,
    )
  ) {
    return true;
  }
  if (
    Object.values(state.socketOverrideStates).some((s) =>
      Object.values(s.results).some((r) => r.state !== LoadoutSocketOverrideState.Applied),
    )
  ) {
    return true;
  }
  return state.modStates.some((s) => s.state !== LoadoutModState.Applied);
}
