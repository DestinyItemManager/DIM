import { Loadout, LoadoutItem } from '@destinyitemmanager/dim-api-types';
import { Loadout as DimLoadout, LoadoutItem as DimLoadoutItem } from './loadout-types';

/**
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. These functions convert
 * back and forth.
 */
export function convertDimLoadoutToApiLoadout(dimLoadout: DimLoadout): Loadout {
  const { items, name, clearSpace, ...rest } = dimLoadout;
  const equipped = items.filter((i) => i.equipped).map(convertDimLoadoutItemToLoadoutItem);
  const unequipped = items.filter((i) => !i.equipped).map(convertDimLoadoutItemToLoadoutItem);

  const loadout: Loadout = {
    ...rest,
    name: name.trim(),
    clearSpace: clearSpace || false,
    equipped,
    unequipped,
    lastUpdatedAt: Date.now(),
  };
  if (!loadout.notes) {
    delete loadout.notes;
  }
  return loadout;
}

function convertDimLoadoutItemToLoadoutItem(item: DimLoadoutItem): LoadoutItem {
  const result: LoadoutItem = {
    hash: item.hash,
  };
  if (item.id && item.id !== '0') {
    result.id = item.id;
  }
  if (item.amount > 1) {
    result.amount = item.amount;
  }
  if (item.socketOverrides) {
    result.socketOverrides = item.socketOverrides;
  }
  return result;
}

/**
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. This converts the API
 * storage format to the old loadout format.
 */
export function convertDimApiLoadoutToLoadout(loadout: Loadout): DimLoadout {
  const { equipped, unequipped, clearSpace, ...rest } = loadout;
  return {
    ...rest,
    clearSpace: clearSpace || false,
    items: [
      ...equipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, true)),
      ...unequipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, false)),
    ],
  };
}

/**
 * Converts DimApiLoadoutItem to real loadout items.
 */
export function convertDimApiLoadoutItemToLoadoutItem(
  item: LoadoutItem,
  equipped: boolean
): DimLoadoutItem {
  return {
    id: item.id || '0',
    hash: item.hash,
    amount: item.amount || 1,
    socketOverrides: item.socketOverrides,
    equipped,
  };
}
