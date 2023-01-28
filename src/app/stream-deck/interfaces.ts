import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { RootState, ThunkResult } from 'app/store/types';
import * as actions from 'app/stream-deck/actions';
import { Reducer } from 'redux';
import { ActionType } from 'typesafe-actions';

export type StreamDeckSelectionType = 'loadout' | 'item';

// Redux Store Stream Deck State
export interface StreamDeckState {
  // WebSocket status
  readonly connected: boolean;
  // Update popup already showed
  readonly updatePopupShowed: boolean;
  // Selection type
  readonly selection?: 'item' | 'loadout' | 'postmaster' | undefined;
}

export type StreamDeckAction = ActionType<typeof actions>;

// trigger a pre-written search
// choose a specific page (inventory, vendors, records, etc..)
// choose if highlight items only or move search items to current store
export interface SearchAction {
  action: 'search';
  search: string;
  page: string;
  pullItems?: boolean;
}

// randomize the current character
// both modes (weapon only / all)
export interface RandomizeAction {
  action: 'randomize';
  weaponsOnly: boolean;
}

// collect all items from postmaster
export interface CollectPostmasterAction {
  action: 'collectPostmaster';
}

// trigger refresh DIM
export interface RefreshAction {
  action: 'refresh';
}

// enable/disable farming mode
export interface FarmingModeAction {
  action: 'farmingMode';
}

// maximize power
export interface MaxPowerAction {
  action: 'maxPower';
}

// pick a random item of the selected bucket
// and move it to the vault to free a slot
// export interface FreeBucketSlotAction {
//  action: 'freeBucketSlot';
//  bucket: InventoryBucket['type'];
// }

// pull a selected item from other character/vault
// (if the current character has already that item it will be moved to the vault)
export interface PullItemAction {
  action: 'pullItem';
  item: string;
  equip: boolean;
  context: string;
}

// allow the user to pick a specific "thing" and send it to the Stream Deck
// this thing can be a loadout or an item
export interface SelectionAction {
  action: 'selection';
  selection: StreamDeckSelectionType;
}

// equip a selected loadout (for a specific store)
// send the shareable link of a loadout to the Stream Deck
export interface EquipLoadoutAction {
  action: 'loadout';
  loadout: string;
  character?: string;
}

export interface AuthorizationInitAction {
  action: 'authorization';
  id: string;
  code: string;
}

// | FreeBucketSlotAction
export type StreamDeckMessage = (
  | AuthorizationInitAction
  | SearchAction
  | RandomizeAction
  | CollectPostmasterAction
  | RefreshAction
  | FarmingModeAction
  | MaxPowerAction
  | PullItemAction
  | SelectionAction
  | EquipLoadoutAction
) & { token?: string };

// Types of messages sent to Stream Deck
export interface VaultArgs {
  vault: number;
  shards?: number;
  glimmer?: number;
  brightDust?: number;
}

export interface MetricsArgs {
  gambit: number;
  vanguard: number;
  crucible: number;
  trials: number;
  gunsmith: number;
  ironBanner: number;
  triumphs: number;
  triumphsActive: number;
  battlePass: number;
  artifactIcon?: string;
}

export interface PostmasterArgs {
  total: number;
  ascendantShards: number;
  enhancementPrisms: number;
  spoils: number;
}

export interface MaxPowerArgs {
  artifact: number;
  base: string;
  total: string;
}

export interface Challenge {
  label: number;
  value: string;
}

export interface SendUpdateArgs {
  action: 'dim:update';
  data?: {
    farmingMode?: boolean;
    postmaster?: PostmasterArgs;
    maxPower?: MaxPowerArgs;
    vault?: VaultArgs;
    metrics?: MetricsArgs;
    equippedItems?: string[];
  };
}

export interface SelectionArgs {
  action: 'dim:selection';
  data?: {
    selectionType?: StreamDeckSelectionType;
    selection?: {
      label: string;
      subtitle: string;
      icon?: string;
      overlay?: string;
      item?: string;
      loadout?: string;
      character?: string;
      isExotic?: boolean;
      element?: string;
      inventory?: boolean;
    };
  };
}

export interface SendAuthorizationConfirm {
  action: 'authorization:confirm';
  data?: {
    token: string;
  };
}

export interface SendItemUpdateArgs {
  action: 'dim:item-update';
  data: {
    context: string;
    equipped: boolean;
    element?: string;
    // power: number;
  };
}

export interface SendAuthorizationResetArgs {
  action: 'authorization:reset';
}

export type SendToStreamDeckArgs =
  | SendUpdateArgs
  | SelectionArgs
  | SendItemUpdateArgs
  | SendAuthorizationConfirm
  | SendAuthorizationResetArgs;

export interface LazyStreamDeck {
  reducer?: Reducer<StreamDeckState, StreamDeckAction>;
  core?: {
    startStreamDeckConnection: () => ThunkResult;
    stopStreamDeckConnection: () => ThunkResult;
    streamDeckSelectItem: (item: DimItem) => ThunkResult;
    streamDeckSelectLoadout: (loadout: Loadout, store: DimStore) => ThunkResult;
    resetIdentifierOnStreamDeck: () => void;
  };
}

export interface HandlerArgs<T> {
  msg: T;
  state: RootState;
  store: DimStore;
}

type ActionName = StreamDeckMessage['action'];
type ActionMatching<key> = Extract<StreamDeckMessage, { action: key }>;
export type MessageHandler = {
  [key in ActionName]: (args: HandlerArgs<ActionMatching<key>>) => ThunkResult;
};
