import * as _ from 'lodash';
import { get, set, keys, del } from 'idb-keyval';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import '../rx-operators';
import { compareAccounts, DestinyAccount } from '../accounts/destiny-account.service';
import { getVendorForCharacter } from '../bungie-api/destiny1-api';
import { getDefinitions, D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import { processItems } from '../inventory/store/d1-item-factory.service';
import copy from 'fast-copy';
import { D1Store } from '../inventory/store-types';
import { Observable } from 'rxjs/Observable';
import { D1Item } from '../inventory/item-types';
import { dimDestinyTrackerService } from '../item-review/destiny-tracker.service';
import { D1StoresService } from '../inventory/d1-stores.service';
import { loadingTracker } from '../shell/loading-tracker';
import { D1ManifestService } from '../manifest/manifest-service';
import { handleLocalStorageFullError } from '../compatibility';

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
const vendorBlackList = [
  2021251983 // Postmaster,
];

// Hashes for 'Decode Engram'
const categoryBlacklist = [3574600435, 3612261728, 1333567905, 2634310414];

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

export interface VendorServiceType {
  vendorsLoaded: boolean;
  // By hash
  vendors: { [vendorHash: number]: Vendor };
  totalVendors: number;
  loadedVendors: number;
  getVendorsStream(account: DestinyAccount): Observable<[D1Store[], this['vendors']]>;
  reloadVendors(): void;
  getVendors(): this['vendors'];
  requestRatings(): Promise<void>;
  countCurrencies(
    stores: D1Store[],
    vendors: this['vendors']
  ): {
    [currencyHash: number]: number;
  };
}

export const dimVendorService = VendorService();

function VendorService(): VendorServiceType {
  let _ratingsRequested = false;

  const service: VendorServiceType = {
    vendorsLoaded: false,
    getVendorsStream,
    reloadVendors,
    getVendors() {
      return this.vendors;
    },
    // By hash
    vendors: {},
    totalVendors: 0,
    loadedVendors: 0,
    requestRatings,
    countCurrencies
    // TODO: expose getVendor promise, idempotently?
  };

  // A subject that keeps track of the current account. Because it's a
  // behavior subject, any new subscriber will always see its last
  // value.
  const accountStream = new BehaviorSubject<DestinyAccount | null>(null);

  // A stream of stores that switches on account changes and supports reloading.
  // This is a ConnectableObservable that must be connected to start.
  const vendorsStream = accountStream
    // Only emit when the account changes
    .distinctUntilChanged(compareAccounts)
    .do(() => {
      service.vendors = {};
      service.vendorsLoaded = false;
    })
    .switchMap(
      (account) => D1StoresService.getStoresStream(account!),
      (account, stores) => [account!, stores!]
    )
    .filter(([_, stores]) => Boolean(stores))
    .switchMap(([account, stores]: [DestinyAccount, D1Store[]]) => loadVendors(account, stores))
    // Keep track of the last value for new subscribers
    .publishReplay(1);

  const clearVendors = _.once(() => {
    D1ManifestService.newManifest$.subscribe(() => {
      service.vendors = {};
      service.vendorsLoaded = false;
      deleteCachedVendors();
    });
  });

  return service;

  function deleteCachedVendors() {
    // Everything's in one table, so we can't just clear
    keys().then((keys) => {
      keys.forEach((key) => {
        if (key.toString().startsWith('vendor')) {
          del(key);
        }
      });
    });
  }

  /**
   * Set the current account, and get a stream of vendor and stores updates.
   * This will keep returning data even if something else changes
   * the account by also calling "vendorsStream". This won't force the
   * vendors to reload unless they haven't been loaded at all.
   *
   * @return a stream of vendor updates
   */
  function getVendorsStream(account: DestinyAccount) {
    accountStream.next(account);
    // Start the stream the first time it's asked for. Repeated calls
    // won't do anything.
    vendorsStream.connect();
    clearVendors(); // Install listener to clear vendors
    return vendorsStream;
  }

  function reloadVendors() {
    D1StoresService.reloadStores();
  }

  /**
   * Returns a promise for a fresh view of the vendors and their items.
   */
  function loadVendors(
    account: DestinyAccount,
    stores: D1Store[]
  ): Promise<[D1Store[], { [vendorHash: number]: Vendor }]> {
    const characters = stores.filter((s) => !s.isVault);

    const reloadPromise = getDefinitions()
      .then((defs) => {
        // Narrow down to only visible vendors (not packages and such)
        const vendorList = Object.values(defs.Vendor).filter((v) => v.summary.visible);

        service.totalVendors = characters.length * (vendorList.length - vendorBlackList.length);
        service.loadedVendors = 0;

        return Promise.all(
          _.flatten(
            vendorList.map(async (vendorDef) => {
              if (vendorBlackList.includes(vendorDef.hash)) {
                return null;
              }

              if (
                service.vendors[vendorDef.hash] &&
                stores.every((store) =>
                  cachedVendorUpToDate(
                    service.vendors[vendorDef.hash].cacheKeys[store.id],
                    store,
                    vendorDef
                  )
                )
              ) {
                service.loadedVendors++;
                return service.vendors[vendorDef.hash];
              } else {
                return Promise.all(
                  characters.map((store) => loadVendorForCharacter(account, store, vendorDef, defs))
                ).then((vendors) => {
                  const nonNullVendors = _.compact(vendors);
                  if (nonNullVendors.length) {
                    const mergedVendor = mergeVendors(_.compact(vendors));
                    service.vendors[mergedVendor.hash] = mergedVendor;
                  } else {
                    delete service.vendors[vendorDef.hash];
                  }
                });
              }
            })
          )
        );
      })
      .then(() => {
        service.vendorsLoaded = true;
        fulfillRatingsRequest();
        return [stores, service.vendors] as [D1Store[], { [vendorHash: number]: Vendor }];
      });

    loadingTracker.addPromise(reloadPromise);
    return reloadPromise;
  }

  function mergeVendors([firstVendor, ...otherVendors]: Vendor[]) {
    const mergedVendor = copy(firstVendor);

    otherVendors.forEach((vendor) => {
      Object.assign(firstVendor.cacheKeys, vendor.cacheKeys);

      vendor.categories.forEach((category) => {
        const existingCategory = _.find(mergedVendor.categories, { title: category.title });
        if (existingCategory) {
          mergeCategory(existingCategory, category);
        } else {
          mergedVendor.categories.push(category);
        }
      });
    });

    mergedVendor.allItems = _.flatten(mergedVendor.categories.map((i) => i.saleItems));

    return mergedVendor;
  }

  function mergeCategory(mergedCategory, otherCategory) {
    otherCategory.saleItems.forEach((saleItem) => {
      const existingSaleItem: any = _.find(mergedCategory.saleItems, { index: saleItem.index });
      if (existingSaleItem) {
        existingSaleItem.unlocked = existingSaleItem.unlocked || saleItem.unlocked;
        if (saleItem.unlocked) {
          existingSaleItem.unlockedByCharacter.push(saleItem.unlockedByCharacter[0]);
        }
      } else {
        mergedCategory.saleItems.push(saleItem);
      }
    });
  }

  function loadVendorForCharacter(
    account: DestinyAccount,
    store: D1Store,
    vendorDef,
    defs: D1ManifestDefinitions
  ) {
    return loadVendor(account, store, vendorDef, defs)
      .then((vendor) => {
        service.loadedVendors++;
        return vendor;
      })
      .catch((e) => {
        service.loadedVendors++;
        if (vendorDef.hash !== 2796397637 && vendorDef.hash !== 2610555297) {
          // Xur, IB
          console.error(
            `Failed to load vendor ${vendorDef.summary.vendorName} for ${store.name}`,
            e
          );
        }
        return null;
      });
  }

  /**
   * Get this character's level for the given faction.
   */
  function factionLevel(store: D1Store, factionHash: number) {
    const rep =
      store.progression &&
      store.progression.progressions.find((rep) => {
        return rep.faction && rep.faction.hash === factionHash;
      });
    return (rep && rep.level) || 0;
  }

  /**
   * Whether or not this character is aligned with the given faction.
   */
  function factionAligned(store: D1Store, factionHash: number) {
    const factionsByHash = {
      489342053: 'Future War Cult',
      2397602219: 'Dead Orbit',
      3197190122: 'New Monarchy'
    };
    const factionAlignment = store.factionAlignment();

    return factionAlignment === factionsByHash[factionHash];
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
    defs: D1ManifestDefinitions
  ) {
    const vendorHash = vendorDef.hash;

    const key = vendorKey(store, vendorHash);
    return get<Vendor>(key)
      .then((vendor) => {
        if (cachedVendorUpToDate(vendor, store, vendorDef)) {
          // console.log("loaded local", vendorDef.summary.vendorName, key, vendor);
          if (vendor.failed) {
            throw new Error(`Cached failed vendor ${vendorDef.summary.vendorName}`);
          }
          return vendor;
        } else {
          // console.log("load remote", vendorDef.summary.vendorName, key, vendorHash, vendor, vendor && vendor.nextRefreshDate);
          return getVendorForCharacter(account, store, vendorHash)
            .then((vendor: Vendor) => {
              vendor.expires = calculateExpiration(vendor.nextRefreshDate, vendorHash);
              vendor.factionLevel = factionLevel(store, vendorDef.summary.factionHash);
              vendor.factionAligned = factionAligned(store, vendorDef.summary.factionHash);
              return set(key, vendor)
                .catch(handleLocalStorageFullError)
                .then(() => vendor);
            })
            .catch((e) => {
              // console.log("vendor error", vendorDef.summary.vendorName, 'for', store.name, e, e.code, e.status);
              if (e.status === 'DestinyVendorNotFound') {
                const vendor = {
                  failed: true,
                  code: e.code,
                  status: e.status,
                  expires: Date.now() + 60 * 60 * 1000 + (Math.random() - 0.5) * (60 * 60 * 1000),
                  factionLevel: factionLevel(store, vendorDef.summary.factionHash),
                  factionAligned: factionAligned(store, vendorDef.summary.factionHash)
                };

                return set(key, vendor)
                  .catch(handleLocalStorageFullError)
                  .then(() => {
                    throw new Error(`Cached failed vendor ${vendorDef.summary.vendorName}`);
                  });
              }
              throw new Error(`Failed to load vendor ${vendorDef.summary.vendorName}`);
            });
        }
      })
      .then((vendor) => {
        if (vendor && vendor.enabled) {
          const processed = processVendor(vendor, vendorDef, defs, store);
          return processed;
        }
        // console.log("Couldn't load", vendorDef.summary.vendorName, 'for', store.name);
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

  function processVendor(vendor, vendorDef, defs: D1ManifestDefinitions, store: D1Store) {
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
          factionAligned: vendor.factionAligned
        }
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
      categories: []
    };

    const saleItems: any[] = _.flatMap(
      vendor.saleItemCategories,
      (categoryData: any) => categoryData.saleItems
    );

    saleItems.forEach((saleItem) => {
      saleItem.item.itemInstanceId = `vendor-${vendorDef.hash}-${saleItem.vendorItemIndex}`;
    });

    return processItems({ id: null } as any, saleItems.map((i) => i.item)).then((items) => {
      const itemsById = _.keyBy(items, (i) => i.id);
      const categories = _.compact(
        _.map(vendor.saleItemCategories, (category: any) => {
          const categoryInfo = vendorDef.categories[category.categoryIndex];
          if (categoryBlacklist.includes(categoryInfo.categoryHash)) {
            return null;
          }

          const categoryItems: any[] = _.compact(
            category.saleItems.map((saleItem) => {
              const unlocked = isSaleItemUnlocked(saleItem);
              return {
                index: saleItem.vendorItemIndex,
                costs: saleItem.costs
                  .map((cost) => {
                    return {
                      value: cost.value,
                      currency: _.pick(
                        defs.InventoryItem.get(cost.itemHash),
                        'itemName',
                        'icon',
                        'itemHash'
                      )
                    };
                  })
                  .filter((c) => c.value > 0),
                item: itemsById[`vendor-${vendorDef.hash}-${saleItem.vendorItemIndex}`],
                // TODO: caveat, this won't update very often!
                unlocked,
                unlockedByCharacter: unlocked ? [store.id] : [],
                failureStrings: saleItem.failureIndexes
                  .map((i) => vendorDef.failureStrings[i])
                  .join('. ')
              };
            })
          );

          return {
            index: category.categoryIndex,
            title: categoryInfo.displayTitle,
            saleItems: categoryItems
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

  // TODO: do this with another observable!
  function requestRatings() {
    _ratingsRequested = true;
    return fulfillRatingsRequest();
  }

  async function fulfillRatingsRequest(): Promise<void> {
    if (service.vendorsLoaded && _ratingsRequested) {
      // TODO: Throttle this. Right now we reload this on every page
      // view and refresh of the vendors page.
      return dimDestinyTrackerService.updateVendorRankings(service.vendors);
    }
  }

  /**
   * Calculates a count of how many of each type of currency you
   * have on all characters, limited to only currencies required to
   * buy items from the provided vendors.
   */
  function countCurrencies(stores: D1Store[], vendors: { [vendorHash: number]: Vendor }) {
    if (!stores || !vendors || !stores.length || _.isEmpty(vendors)) {
      return {};
    }

    const categories = _.flatMap(Object.values(vendors), (v) => v.categories);
    const saleItems = _.flatMap(categories, (c) => c.saleItems);
    const costs = _.flatMap(saleItems, (i: any) => i.costs);
    const currencies = costs.map((c: any) => c.currency.itemHash);

    const totalCoins: { [currencyHash: number]: number } = {};
    currencies.forEach((currencyHash) => {
      // Legendary marks and glimmer are special cases
      switch (currencyHash) {
        case 2534352370:
          totalCoins[currencyHash] = D1StoresService.getVault()!.legendaryMarks;
          break;
        case 3159615086:
          totalCoins[currencyHash] = D1StoresService.getVault()!.glimmer;
          break;
        case 2749350776:
          totalCoins[currencyHash] = D1StoresService.getVault()!.silver;
          break;
        default:
          totalCoins[currencyHash] = _.sumBy(stores, (store) => {
            return store.amountOfItem({ hash: currencyHash } as any);
          });
          break;
      }
    });
    return totalCoins;
  }
}
