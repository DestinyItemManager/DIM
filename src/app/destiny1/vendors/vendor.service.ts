import { currentAccountSelector } from 'app/accounts/selectors';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { amountOfItem } from 'app/inventory/stores-helpers';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import copy from 'fast-copy';
import { get, set } from 'idb-keyval';
import _ from 'lodash';
import { DestinyAccount } from '../../accounts/destiny-account';
import { getVendorForCharacter } from '../../bungie-api/destiny1-api';
import { D1Item } from '../../inventory/item-types';
import { AccountCurrency, D1Store } from '../../inventory/store-types';
import { processItems } from '../../inventory/store/d1-item-factory';
import { loadingTracker } from '../../shell/loading-tracker';
import { D1ManifestDefinitions } from '../d1-definitions';
import { factionAligned } from '../d1-factions';

/*
const allVendors = [
  1990950, // Titan Vanguard
  44395194, // Vehicles
  134701236, // Guardian Outfitter
  174528503, // Eris Morn
  242140165, // Iron Banner
  459708109, // Shipwright
  570929315, // Gunsmith
  614738178, // Emote Collection
  1303406887, // Cryptarch (Reef)
  1410745145, // Queen's Wrath
  1460182514, // Exotic Weapon Blueprints
  1527174714, // Bounty Tracker
  1575820975, // Warlock Vanguard
  1808244981, // New Monarchy
  1821699360, // Future War Cult
  1889676839, // Disciple of Osiris
  1998812735, // House of Judgment
  2021251983, // Postmaster
  2190824860, // Vanguard Scout
  2190824863, // Tyra Karn (Cryptarch)
  2244880194, // Ship Collection
  2420628997, // Shader Collection
  2610555297, // Iron Banner
  2648860054, // Iron Lord
  2668878854, // Vanguard Quartermaster
  2680694281, // The Speaker
  2762206170, // Postmaster
  2796397637, // Agent of the Nine
  3003633346, // Hunter Vanguard
  3301500998, // Emblem Collection
  3611686524, // Dead Orbit
  3658200622, // Crucible Quartermaster
  3746647075, // Crucible Handler
  3902439767, // Exotic Armor Blueprints
  3917130357, // Eververse
  4269570979 // Cryptarch (Tower)
];
  */

// Vendors we don't want to load by default
const vendorDenyList = [
  2021251983, // Postmaster,
];

// Hashes for 'Decode Engram'
const categoryDenyList = [3574600435, 3612261728, 1333567905, 2634310414];

const xur = 2796397637;

export interface VendorCost {
  currency: {
    icon: string;
    itemHash: number;
    itemName: string;
  };
  value: number;
}

export interface VendorSaleItem {
  costs: VendorCost[];
  failureStrings: string;
  index: number;
  item: D1Item;
  unlocked: boolean;
  unlockedByCharacter: string[];
}

export interface Vendor {
  failed: boolean;
  nextRefreshDate: string;
  hash: number;
  name: string;
  icon: string;
  vendorOrder: number;
  faction: number;
  location: string;
  enabled: boolean;

  expires: number;
  factionLevel: number;
  factionAligned: boolean;

  allItems: VendorSaleItem[];
  categories: {
    index: number;
    title: string;
    saleItems: VendorSaleItem[];
  }[];
  def;

  cacheKeys: {
    [storeId: string]: {
      expires: number;
      factionLevel: number;
      factionAligned: boolean;
    };
  };
}

/**
 * Returns a promise for a fresh view of the vendors and their items.
 */
export function loadVendors(): ThunkResult<{ [vendorHash: number]: Vendor }> {
  return async (_dispatch, getState) => {
    const account = currentAccountSelector(getState())!;
    const stores = storesSelector(getState()) as D1Store[];
    const characters = stores.filter((s) => !s.isVault);
    const defs = getState().manifest.d1Manifest!;
    const buckets = bucketsSelector(getState())!;
    const reloadPromise = (async () => {
      // Narrow down to only visible vendors (not packages and such)
      const vendorList = Object.values(defs.Vendor).filter((v) => v.summary.visible);

      const vendors = _.compact(
        await Promise.all(
          vendorList.flatMap((vendorDef) =>
            fetchVendor(vendorDef, characters, account, defs, buckets)
          )
        )
      );
      return _.keyBy(vendors, (v) => v.hash);
    })();

    loadingTracker.addPromise(reloadPromise);
    return reloadPromise;
  };
}

async function fetchVendor(
  vendorDef,
  characters: D1Store[],
  account: DestinyAccount,
  defs: D1ManifestDefinitions,
  buckets: InventoryBuckets
): Promise<Vendor | null> {
  if (vendorDenyList.includes(vendorDef.hash)) {
    return null;
  }

  const vendorsForCharacters = await Promise.all(
    characters.map((store) => loadVendorForCharacter(account, store, vendorDef, defs, buckets))
  );
  const nonNullVendors = _.compact(vendorsForCharacters);
  if (nonNullVendors.length) {
    const mergedVendor = mergeVendors(_.compact(nonNullVendors));
    return mergedVendor;
  } else {
    return null;
  }
}

function mergeVendors([firstVendor, ...otherVendors]: Vendor[]) {
  const mergedVendor = copy(firstVendor);

  otherVendors.forEach((vendor) => {
    Object.assign(firstVendor.cacheKeys, vendor.cacheKeys);

    vendor.categories.forEach((category) => {
      const existingCategory = mergedVendor.categories.find((c) => c.title === category.title);
      if (existingCategory) {
        mergeCategory(existingCategory, category);
      } else {
        mergedVendor.categories.push(category);
      }
    });
  });

  mergedVendor.allItems = mergedVendor.categories.flatMap((i) => i.saleItems);

  return mergedVendor;
}

function mergeCategory(mergedCategory, otherCategory) {
  otherCategory.saleItems.forEach((saleItem) => {
    const existingSaleItem = mergedCategory.saleItems.find((i) => i.index === saleItem.index);
    if (existingSaleItem) {
      existingSaleItem.unlocked ||= saleItem.unlocked;
      if (saleItem.unlocked) {
        existingSaleItem.unlockedByCharacter.push(saleItem.unlockedByCharacter[0]);
      }
    } else {
      mergedCategory.saleItems.push(saleItem);
    }
  });
}

async function loadVendorForCharacter(
  account: DestinyAccount,
  store: D1Store,
  vendorDef,
  defs: D1ManifestDefinitions,
  buckets: InventoryBuckets
) {
  try {
    return await loadVendor(account, store, vendorDef, defs, buckets);
  } catch (e) {
    if (vendorDef.hash !== 2796397637 && vendorDef.hash !== 2610555297) {
      // Xur, IB
      errorLog(
        'vendors',
        `Failed to load vendor ${vendorDef.summary.vendorName} for ${store.name}`,
        e
      );
    }
    return null;
  }
}

/**
 * Get this character's level for the given faction.
 */
function factionLevel(store: D1Store, factionHash: number) {
  const rep = store.progressions.find((rep) => rep.faction?.hash === factionHash);
  return rep?.level || 0;
}

/**
 * A cached vendor is only usable if it's not expired, and this character hasn't
 * changed level for the faction associated with this vendor (or changed whether
 * they're aligned with that faction).
 */
function cachedVendorUpToDate(
  vendor: {
    expires: number;
    factionLevel: number;
    factionAligned: boolean;
  },
  store: D1Store,
  vendorDef
) {
  return (
    vendor &&
    vendor.expires > Date.now() &&
    vendor.factionLevel === factionLevel(store, vendorDef.summary.factionHash) &&
    vendor.factionAligned === factionAligned(store, vendorDef.summary.factionHash)
  );
}

function loadVendor(
  account: DestinyAccount,
  store: D1Store,
  vendorDef,
  defs: D1ManifestDefinitions,
  buckets: InventoryBuckets
) {
  const vendorHash = vendorDef.hash;

  const key = vendorKey(store, vendorHash);
  return get<Vendor>(key)
    .then((vendor) => {
      if (cachedVendorUpToDate(vendor, store, vendorDef)) {
        // log("loaded local", vendorDef.summary.vendorName, key, vendor);
        if (vendor.failed) {
          throw new Error(`Cached failed vendor ${vendorDef.summary.vendorName}`);
        }
        return vendor;
      } else {
        // log("load remote", vendorDef.summary.vendorName, key, vendorHash, vendor, vendor?.nextRefreshDate);
        return getVendorForCharacter(account, store, vendorHash)
          .then((vendor: Vendor) => {
            vendor.expires = calculateExpiration(vendor.nextRefreshDate, vendorHash);
            vendor.factionLevel = factionLevel(store, vendorDef.summary.factionHash);
            vendor.factionAligned = factionAligned(store, vendorDef.summary.factionHash);
            return set(key, vendor).then(() => vendor);
          })
          .catch((e) => {
            // log("vendor error", vendorDef.summary.vendorName, 'for', store.name, e, e.code, e.status);
            if (e.status === 'DestinyVendorNotFound') {
              const vendor = {
                failed: true,
                code: e.code,
                status: e.status,
                expires: Date.now() + 60 * 60 * 1000 + (Math.random() - 0.5) * (60 * 60 * 1000),
                factionLevel: factionLevel(store, vendorDef.summary.factionHash),
                factionAligned: factionAligned(store, vendorDef.summary.factionHash),
              };

              return set(key, vendor).then(() => {
                throw new Error(`Cached failed vendor ${vendorDef.summary.vendorName}`);
              });
            }
            throw new Error(`Failed to load vendor ${vendorDef.summary.vendorName}`);
          });
      }
    })
    .then((vendor) => {
      if (vendor?.enabled) {
        return processVendor(vendor, vendorDef, defs, store, buckets);
      }
      // log("Couldn't load", vendorDef.summary.vendorName, 'for', store.name);
      return Promise.resolve(null);
    });
}

function vendorKey(store: D1Store, vendorHash: number) {
  return ['vendor', store.id, vendorHash].join('-');
}

function calculateExpiration(nextRefreshDate: string, vendorHash: number): number {
  const date = new Date(nextRefreshDate).getTime();

  if (vendorHash === xur) {
    // Xur always expires in an hour, because Bungie's data only
    // says when his stock will refresh, not when he becomes
    // unavailable.
    return Math.min(date, Date.now() + 60 * 60 * 1000);
  }

  // If the expiration is too far in the future, replace it with +8h
  if (date - Date.now() > 7 * 24 * 60 * 60 * 1000) {
    return Date.now() + 8 * 60 * 60 * 1000;
  }

  return date;
}

function processVendor(
  vendor,
  vendorDef,
  defs: D1ManifestDefinitions,
  store: D1Store,
  buckets: InventoryBuckets
) {
  const def = vendorDef.summary;
  const createdVendor: Vendor = {
    def: vendorDef,
    hash: vendorDef.hash,
    name: def.vendorName,
    icon: def.factionIcon || def.vendorIcon,
    nextRefreshDate: vendor.nextRefreshDate,
    cacheKeys: {
      [store.id]: {
        expires: vendor.expires,
        factionLevel: vendor.factionLevel,
        factionAligned: vendor.factionAligned,
      },
    },
    vendorOrder: def.vendorSubcategoryHash + def.vendorOrder,
    faction: def.factionHash, // TODO: show rep!
    location: defs.VendorCategory.get(def.vendorCategoryHash).categoryName,
    failed: false,
    enabled: true,
    expires: 0,
    factionLevel: 0,
    factionAligned: false,
    allItems: [],
    categories: [],
  };

  const saleItems = vendor.saleItemCategories.flatMap((categoryData) => categoryData.saleItems);

  saleItems.forEach((saleItem) => {
    saleItem.item.itemInstanceId = `vendor-${vendorDef.hash}-${saleItem.vendorItemIndex}`;
  });

  return processItems(
    { id: null } as any,
    saleItems.map((i) => i.item),
    defs,
    buckets
  ).then((items) => {
    const itemsById = _.keyBy(items, (i) => i.id);
    const categories = _.compact(
      _.map(vendor.saleItemCategories, (category) => {
        const categoryInfo = vendorDef.categories[category.categoryIndex];
        if (categoryDenyList.includes(categoryInfo.categoryHash)) {
          return null;
        }

        const categoryItems: any[] = _.compact(
          category.saleItems.map((saleItem) => {
            const unlocked = isSaleItemUnlocked(saleItem);
            return {
              index: saleItem.vendorItemIndex,
              costs: saleItem.costs
                .map((cost) => ({
                  value: cost.value,
                  currency: _.pick(
                    defs.InventoryItem.get(cost.itemHash),
                    'itemName',
                    'icon',
                    'itemHash'
                  ),
                }))
                .filter((c) => c.value > 0),
              item: itemsById[`vendor-${vendorDef.hash}-${saleItem.vendorItemIndex}`],
              // TODO: caveat, this won't update very often!
              unlocked,
              unlockedByCharacter: unlocked ? [store.id] : [],
              failureStrings: saleItem.failureIndexes
                .map((i) => vendorDef.failureStrings[i])
                .join('. '),
            };
          })
        );

        return {
          index: category.categoryIndex,
          title: categoryInfo.displayTitle,
          saleItems: categoryItems,
        };
      })
    );

    items.forEach((item: any) => {
      item.vendorIcon = createdVendor.icon;
    });

    createdVendor.categories = categories;

    return createdVendor;
  });
}

function isSaleItemUnlocked(saleItem) {
  return saleItem.unlockStatuses.every((s) => s.isSet);
}

/**
 * Calculates a count of how many of each type of currency you
 * have on all characters, limited to only currencies required to
 * buy items from the provided vendors.
 */
export function countCurrencies(
  stores: D1Store[],
  vendors: { [vendorHash: number]: Vendor },
  currencies: AccountCurrency[]
) {
  if (!stores || !vendors || !stores.length || _.isEmpty(vendors)) {
    return {};
  }

  const categories = Object.values(vendors).flatMap((v) => v.categories);
  const saleItems = categories.flatMap((c) => c.saleItems);
  const costs = saleItems.flatMap((i) => i.costs);

  const totalCoins: { [currencyHash: number]: number } = {};
  costs
    .map((c) => c.currency.itemHash)
    .forEach((currencyHash) => {
      // Legendary marks and glimmer are special cases
      switch (currencyHash) {
        case 2534352370:
        case 3159615086:
        case 2749350776:
          totalCoins[currencyHash] = currencies.find((c) => c.itemHash === currencyHash)!.quantity;
          break;
        default:
          totalCoins[currencyHash] = _.sumBy(stores, (store) =>
            amountOfItem(store, { hash: currencyHash })
          );
          break;
      }
    });
  return totalCoins;
}
