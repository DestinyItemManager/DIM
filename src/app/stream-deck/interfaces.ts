import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { RootState, ThunkResult } from 'app/store/types';
import { SelectionType } from './actions';

// trigger a pre-written search
// choose a specific page (inventory, vendors, records, etc..)
// choose if highlight items only or move search items to current store
export interface SearchAction {
  action: 'search';
  query: string;
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
  action: 'toggleFarmingMode';
}

// maximize power
export interface MaxPowerAction {
  action: 'equipMaxPower';
}

// pull a selected item from other character/vault
// (if the current character has already that item it will be moved to the vault)
export interface PullItemAction {
  action: 'pullItem';
  itemId: string;
  equip: boolean;
}

// equip a selected loadout (for a specific store)
// send the shareable link of a loadout to the Stream Deck
export interface EquipLoadoutAction {
  action: 'equipLoadout';
  loadout: string;
  character?: string;
}

// set the selection to item/loadout/postmaster
export interface SelectionAction {
  action: 'selection';
  type?: SelectionType;
}

// | FreeBucketSlotAction
export type StreamDeckMessage = (
  | SearchAction
  | RandomizeAction
  | CollectPostmasterAction
  | RefreshAction
  | FarmingModeAction
  | MaxPowerAction
  | PullItemAction
  | EquipLoadoutAction
  | SelectionAction
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
  action: 'state';
  data?: {
    postmaster?: PostmasterArgs;
    maxPower?: MaxPowerArgs;
    vault?: VaultArgs;
    metrics?: MetricsArgs;
    equippedItems?: string[];
  };
}

export interface SendFarmingModeArgs {
  action: 'farmingMode';
  data: boolean;
}

export interface SendEquipmentStatusArgs {
  action: 'equipmentStatus';
  data: {
    equipped: boolean;
    itemId: string;
  };
}

export type LoadoutSelection =
  | {
      type: 'dim';
      loadout: Loadout;
    }
  | {
      type: 'game';
      loadout: InGameLoadout;
    };

export type SendToStreamDeckArgs = SendUpdateArgs | SendFarmingModeArgs | SendEquipmentStatusArgs;

export interface LazyStreamDeck {
  core?: {
    startStreamDeckConnection: () => ThunkResult;
    stopStreamDeckConnection: () => ThunkResult;
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
