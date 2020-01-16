import _ from 'lodash';
import {
  DestinyVendorSaleItemComponent,
  DestinyInventoryItemDefinition
} from 'bungie-api-ts/destiny2';
import { D2Item } from '../inventory/item-types';
import { DtrD2BasicItem, D2ItemFetchRequest } from '../item-review/d2-dtr-api-types';

const MOD_CATEGORY = 59;
const POWER_STAT_HASH = 1935470627;

/**
 * Lookup keys for review data in the cache.
 * Reference ID comes from the underlying item's hash ID.
 * Available perks is a collection of the item instance's available plug hash IDs.
 */
export interface D2ReviewKey {
  referenceId: number;
  availablePerks?: number[];
}

/** Translate a D2 item into its review key. */
export function getReviewKey(
  item?: D2Item | DestinyVendorSaleItemComponent,
  itemHash?: number
): D2ReviewKey {
  if (item) {
    const dtrItem = translateToDtrItem(item);

    return {
      referenceId: dtrItem.referenceId,
      availablePerks: dtrItem.availablePerks
    };
  } else if (itemHash) {
    return {
      referenceId: itemHash
    };
  } else {
    throw new Error('No data supplied to find a matching item from our stores.');
  }
}

/**
 * Translate a collection of available perks (plug hash IDs) into a string.
 * Useful in reducers and other places where arrays aren't super useful.
 */
export function getD2Roll(availablePerks?: number[]): string {
  return availablePerks?.length ? availablePerks.join(',') : 'fixed';
}

/**
 * Translate a DIM item into the basic form that the DTR understands an item to contain.
 * This does not contain personally-identifying information.
 * Meant for fetch calls.
 */
export function translateToDtrItem(
  item: D2Item | DestinyVendorSaleItemComponent
): D2ItemFetchRequest {
  return {
    referenceId: isVendorSaleItem(item) ? item.itemHash : item.hash,
    availablePerks: getAvailablePerks(item)
  };
}

/**
 * Get the roll and perks for the selected DIM item (to send to the DTR API).
 * Will contain personally-identifying information.
 */
export function getRollAndPerks(item: D2Item): DtrD2BasicItem {
  const powerModHashes = getPowerMods(item).map((m) => m.hash);

  return {
    selectedPlugs: getSelectedPlugs(item, powerModHashes),
    selectedPerks: getSelectedPerks(item),
    attachedMods: powerModHashes,
    referenceId: item.hash,
    instanceId: item.id,
    availablePerks: getAvailablePerks(item)
  };
}

function getSelectedPlugs(item: D2Item, powerModHashes: number[]): number[] {
  if (!item.sockets) {
    return [];
  }

  const allPlugs = _.compact(
    //     remove this ?? null when typescript is fixed
    item.sockets.sockets.map((i) => i.plug).map((i) => i?.plugItem.hash ?? null)
  );

  return _.difference(allPlugs, powerModHashes);
}

function isD2Item(item: D2Item | DestinyVendorSaleItemComponent): item is D2Item {
  return (item as D2Item).sockets !== undefined;
}

function getSelectedPerks(item: D2Item): number[] | undefined {
  if (isD2Item(item)) {
    if (!item.sockets) {
      return undefined;
    }

    const randomPlugOptions = item.sockets.sockets.flatMap((s) =>
      s.hasRandomizedPlugItems && s.plug ? s.plug.plugItem.hash : []
    );

    return randomPlugOptions.length ? randomPlugOptions : undefined;
  }

  // TODO: look up vendor rolls
  return [];
}

/**
 * If the item has a random roll, we supply the random plug hashes it has in
 * a value named `availablePerks` to the DTR API.
 */
function getAvailablePerks(item: D2Item | DestinyVendorSaleItemComponent): number[] | undefined {
  if (isD2Item(item)) {
    if (!item.sockets) {
      return undefined;
    }

    const randomPlugOptions = item.sockets.sockets.flatMap((s) =>
      s.hasRandomizedPlugItems ? s.plugOptions.map((po) => po.plugItem.hash) : []
    );

    return randomPlugOptions?.length ? randomPlugOptions : undefined;
  }

  // TODO: look up vendor rolls
  return [];
}

function isVendorSaleItem(
  item: D2Item | DestinyVendorSaleItemComponent
): item is DestinyVendorSaleItemComponent {
  return (item as DestinyVendorSaleItemComponent).itemHash !== undefined;
}

function getPowerMods(item: D2Item): DestinyInventoryItemDefinition[] {
  return item.sockets //             remove this ?? null when typescript is fixed
    ? _.compact(item.sockets.sockets.map((p) => p.plug?.plugItem ?? null)).filter(
        (plug) =>
          plug.itemCategoryHashes?.includes(MOD_CATEGORY) &&
          plug.investmentStats?.some((s) => s.statTypeHash === POWER_STAT_HASH)
      )
    : [];
}
