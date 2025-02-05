import {
  InGameLoadoutIdentifiers,
  Loadout,
  LoadoutItem,
  LoadoutParameters,
} from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { UNSET_PLUG_HASH } from 'app/loadout/known-values';
import { filterMap, mapValues } from 'app/utils/collections';
import { emptyObject } from 'app/utils/empty';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import {
  DestinyClass,
  DestinyLoadoutComponent,
  DestinyProfileResponse,
} from 'bungie-api-ts/destiny2';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import { convertToLoadoutItem, itemsByItemId, newLoadout } from '../loadout-drawer/loadout-utils';
import {
  Loadout as DimLoadout,
  LoadoutItem as DimLoadoutItem,
  InGameLoadout,
} from './loadout-types';

/**
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. These functions convert
 * back and forth.
 */
export function convertDimLoadoutToApiLoadout(dimLoadout: DimLoadout): Loadout {
  const { items, name, parameters, ...rest } = dimLoadout;
  const equipped = items.filter((i) => i.equip).map(convertDimLoadoutItemToLoadoutItem);
  const unequipped = items.filter((i) => !i.equip).map(convertDimLoadoutItemToLoadoutItem);

  const loadout: Loadout = {
    ...rest,
    name: name.trim(),
    equipped,
    unequipped,
    parameters,
    clearSpace: Boolean(parameters?.clearArmor && parameters?.clearWeapons),
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
  if (item.id && item.id !== '0' && /^\d{1,32}$/.test(item.id)) {
    result.id = item.id;
  }
  if (item.amount > 1) {
    result.amount = item.amount;
  }
  if (item.socketOverrides) {
    result.socketOverrides = item.socketOverrides;
  }
  if (item.craftedDate) {
    result.craftedDate = item.craftedDate;
  }
  return result;
}

function migrateLoadoutParameters(
  parameters: DimLoadout['parameters'],
  clearSpace: boolean,
): DimLoadout['parameters'] {
  // Migrate the single "clear" parameter into separate armor/weapons parameters
  if (
    clearSpace &&
    parameters?.clearArmor === undefined &&
    parameters?.clearWeapons === undefined
  ) {
    return { ...parameters, clearArmor: true, clearWeapons: true };
  }

  return parameters;
}

/**
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. This converts the API
 * storage format to the old loadout format.
 */
export function convertDimApiLoadoutToLoadout(loadout: Loadout): DimLoadout {
  const { equipped = [], unequipped = [], clearSpace = false, parameters, ...rest } = loadout;
  return {
    ...rest,
    parameters: migrateLoadoutParameters(parameters, clearSpace),
    clearSpace,
    items: [
      ...equipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, true)),
      ...unequipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, false)),
    ],
  };
}

/**
 * Converts DimApiLoadoutItem to real loadout items.
 */
function convertDimApiLoadoutItemToLoadoutItem(
  item: LoadoutItem,
  equipped: boolean,
): DimLoadoutItem {
  return {
    ...item,
    id: item.id || '0',
    amount: item.amount || 1,
    equip: equipped,
  };
}

export const processInGameLoadouts = (
  profileResponse: DestinyProfileResponse,
  defs: D2ManifestDefinitions,
): { [characterId: string]: InGameLoadout[] } => {
  const characterLoadouts = profileResponse?.characterLoadouts?.data;
  if (characterLoadouts) {
    return mapValues(characterLoadouts, (c, characterId) =>
      filterMap(c.loadouts, (l, i) =>
        convertDestinyLoadoutComponentToInGameLoadout(l, i, characterId, defs),
      ),
    );
  }
  return emptyObject();
};

/**
 * Given what the API returns for loadouts, return an enhanced object that tells us a little more about the loadout.
 */
function convertDestinyLoadoutComponentToInGameLoadout(
  loadoutComponent: DestinyLoadoutComponent,
  index: number,
  characterId: string,
  defs: D2ManifestDefinitions,
): InGameLoadout | undefined {
  const resolvedIdentifiers = resolveInGameLoadoutIdentifiers(defs, loadoutComponent);

  if (
    loadoutComponent.items === undefined ||
    loadoutComponent.items.length === 0 ||
    loadoutComponent.items.every((i) => i.itemInstanceId === '0')
  ) {
    return undefined;
  }

  return {
    ...loadoutComponent,
    ...resolvedIdentifiers,
    characterId,
    index,
    id: `ingame-${characterId}-${index}`,
  };
}

export function resolveInGameLoadoutIdentifiers(
  defs: D2ManifestDefinitions,
  { nameHash, colorHash, iconHash }: InGameLoadoutIdentifiers,
) {
  const name = defs.LoadoutName.get(nameHash)?.name ?? 'Unknown';
  const colorIcon = defs.LoadoutColor.get(colorHash)?.colorImagePath ?? '';
  const icon = defs.LoadoutIcon.get(iconHash)?.iconImagePath ?? '';
  return { name, colorIcon, icon };
}

export function convertInGameLoadoutToDimLoadout(
  inGameLoadout: InGameLoadout,
  classType: DestinyClass,
  allItems: DimItem[],
) {
  const armorMods: number[] = [];
  const modsByBucket: LoadoutParameters['modsByBucket'] = {};

  const loadoutItems = filterMap(inGameLoadout.items, (inGameItem) => {
    if (inGameItem.itemInstanceId === '0') {
      return;
    }

    const matchingItem = itemsByItemId(allItems)[inGameItem.itemInstanceId];
    if (!matchingItem) {
      return;
    }

    if (matchingItem.bucket.inArmor) {
      const armorModSockets = getSocketsByCategoryHash(
        matchingItem.sockets,
        SocketCategoryHashes.ArmorMods,
      );
      const fashionModSockets = getSocketsByCategoryHash(
        matchingItem.sockets,
        SocketCategoryHashes.ArmorCosmetics,
      );
      for (let i = 0; i < inGameItem.plugItemHashes.length; i++) {
        const plugHash = inGameItem.plugItemHashes[i];
        if (plugHash === UNSET_PLUG_HASH) {
          continue;
        }
        if (!emptyPlugHashes.has(plugHash) && armorModSockets.some((s) => s.socketIndex === i)) {
          armorMods.push(plugHash);
        } else if (fashionModSockets.some((s) => s.socketIndex === i)) {
          // For fashion, we do record the emply plug hashes
          (modsByBucket[matchingItem.bucket.hash] ||= []).push(plugHash);
        }
      }
    }

    const socketOverrides =
      // TODO: Pretty soon we can capture all the socket overrides, but for now only copy over subclass config.
      matchingItem.bucket.hash === BucketHashes.Subclass
        ? convertInGameLoadoutPlugItemHashesToSocketOverrides(inGameItem.plugItemHashes)
        : undefined;

    const loadoutItem: DimLoadoutItem = {
      ...convertToLoadoutItem(matchingItem, true),
      socketOverrides,
    };

    return loadoutItem;
  });

  const loadout = newLoadout(inGameLoadout.name, loadoutItems, classType);
  loadout.parameters = {
    mods: armorMods,
    modsByBucket,
    inGameIdentifiers: {
      nameHash: inGameLoadout.nameHash,
      iconHash: inGameLoadout.iconHash,
      colorHash: inGameLoadout.colorHash,
    },
  };
  return loadout;
}

/**
 * In game loadouts' plug item hashes are a list of plug items, one per socket index. We strip
 * out unset or empty plugs when converting to DIM's SocketOverrides, which are only set for sockets
 * that should be modified.
 *
 * NOTE: In game loadouts map any socket that has only a single option to UNSET_PLUG_HASH instead of
 * the real plug hash. Not sure why they bother, and it doesn't matter for saving loadouts to DIM's
 * format, but it does matter for displaying them.
 */
export function convertInGameLoadoutPlugItemHashesToSocketOverrides(
  plugItemHashes: number[],
): SocketOverrides {
  return Object.fromEntries(
    filterMap(plugItemHashes, (plugHash, i) =>
      plugHash !== UNSET_PLUG_HASH ? [i, plugHash] : undefined,
    ),
  );
}
