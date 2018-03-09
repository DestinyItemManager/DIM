import angular from 'angular';
import _ from 'underscore';
import { sum, flatMap } from '../util';
import idbKeyval from 'idb-keyval';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import '../rx-operators';
import { compareAccounts } from '../accounts/destiny-account.service';
import { getVendorForCharacter } from '../bungie-api/destiny1-api';
import { getDefinitions } from '../destiny1/d1-definitions.service';

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
  2021251983, // Postmaster,
];

// Hashes for 'Decode Engram'
const categoryBlacklist = [
  3574600435,
  3612261728,
  1333567905,
  2634310414
];

const xur = 2796397637;

export function VendorService(
  $rootScope,
  dimStoreService,
  ItemFactory,
  dimDestinyTrackerService,
  loadingTracker,
  $q
) {
  'ngInject';

  let _ratingsRequested = false;

  const service = {
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
  const accountStream = new BehaviorSubject(null);

  // A stream of stores that switches on account changes and supports reloading.
  // This is a ConnectableObservable that must be connected to start.
  const vendorsStream = accountStream
    // Only emit when the account changes
    .distinctUntilChanged(compareAccounts)
    .do(() => {
      service.vendors = {};
      service.vendorsLoaded = false;
    })
    .switchMap((account) => dimStoreService.getStoresStream(account), (account, stores) => [account, stores])
    .switchMap(([account, stores]) => loadVendors(account, stores))
    // Keep track of the last value for new subscribers
    .publishReplay(1);

  $rootScope.$on('dim-new-manifest', () => {
    service.vendors = {};
    service.vendorsLoaded = false;
    deleteCachedVendors();
  });

  return service;

  function deleteCachedVendors() {
    // Everything's in one table, so we can't just clear
    idbKeyval.keys().then((keys) => {
      keys.forEach((key) => {
        if (key.startsWith('vendor')) {
          idbKeyval.delete(key);
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
   * @return {Observable} a stream of vendor updates
   */
  function getVendorsStream(account) {
    accountStream.next(account);
    // Start the stream the first time it's asked for. Repeated calls
    // won't do anything.
    vendorsStream.connect();
    return vendorsStream;
  }

  function reloadVendors() {
    dimStoreService.reloadStores();
  }

  /**
   * Returns a promise for a fresh view of the vendors and their items.
   */
  function loadVendors(account, stores) {
    const characters = _.reject(stores, 'isVault');

    const reloadPromise = getDefinitions()
      .then((defs) => {
        // Narrow down to only visible vendors (not packages and such)
        const vendorList = _.filter(defs.Vendor, (v) => v.summary.visible);

        service.totalVendors = characters.length * (vendorList.length - vendorBlackList.length);
        service.loadedVendors = 0;

        return $q.all(_.flatten(vendorList.map((vendorDef) => {
          if (vendorBlackList.includes(vendorDef.hash)) {
            return null;
          }

          if (service.vendors[vendorDef.hash] &&
              _.all(stores, (store) =>
                cachedVendorUpToDate(service.vendors[vendorDef.hash].cacheKeys,
                                         store,
                                         vendorDef))) {
            service.loadedVendors++;
            return service.vendors[vendorDef.hash];
          } else {
            return $q.all(characters.map((store) => loadVendorForCharacter(account, store, vendorDef, defs)))
              .then((vendors) => {
                const nonNullVendors = _.compact(vendors);
                if (nonNullVendors.length) {
                  const mergedVendor = mergeVendors(_.compact(vendors));
                  service.vendors[mergedVendor.hash] = mergedVendor;
                } else {
                  delete service.vendors[vendorDef.hash];
                }
              });
          }
        })));
      })
      .then(() => {
        $rootScope.$broadcast('dim-filter-invalidate');
        $rootScope.$broadcast('dim-vendors-updated');
        service.vendorsLoaded = true;
        fulfillRatingsRequest();
        return [stores, service.vendors];
      });

    loadingTracker.addPromise(reloadPromise);
    return reloadPromise;
  }

  function mergeVendors([firstVendor, ...otherVendors]) {
    const mergedVendor = angular.copy(firstVendor);

    otherVendors.forEach((vendor) => {
      angular.extend(firstVendor.cacheKeys, vendor.cacheKeys);

      vendor.categories.forEach((category) => {
        const existingCategory = _.find(mergedVendor.categories, { title: category.title });
        if (existingCategory) {
          mergeCategory(existingCategory, category);
        } else {
          mergedVendor.categories.push(category);
        }
      });

      mergedVendor.hasArmorWeaps = mergedVendor.hasArmorWeaps || vendor.hasArmorWeaps;
      mergedVendor.hasVehicles = mergedVendor.hasVehicles || vendor.hasVehicles;
      mergedVendor.hasShadersEmbs = mergedVendor.hasShadersEmbs || vendor.hasShadersEmbs;
      mergedVendor.hasEmotes = mergedVendor.hasEmotes || vendor.hasEmotes;
      mergedVendor.hasConsumables = mergedVendor.hasConsumables || vendor.hasConsumables;
      mergedVendor.hasBounties = mergedVendor.hasBounties || vendor.hasBounties;
    });

    mergedVendor.allItems = _.flatten(mergedVendor.categories.map((i) => i.saleItems), true);

    return mergedVendor;
  }

  function mergeCategory(mergedCategory, otherCategory) {
    otherCategory.saleItems.forEach((saleItem) => {
      const existingSaleItem = _.find(mergedCategory.saleItems, { index: saleItem.index });
      if (existingSaleItem) {
        existingSaleItem.unlocked = existingSaleItem.unlocked || saleItem.unlocked;
        if (saleItem.unlocked) {
          existingSaleItem.unlockedByCharacter.push(saleItem.unlockedByCharacter[0]);
        }
      } else {
        mergedCategory.saleItems.push(saleItem);
      }
    });

    mergedCategory.hasArmorWeaps = mergedCategory.hasArmorWeaps || otherCategory.hasArmorWeaps;
    mergedCategory.hasVehicles = mergedCategory.hasVehicles || otherCategory.hasVehicles;
    mergedCategory.hasShadersEmbs = mergedCategory.hasShadersEmbs || otherCategory.hasShadersEmbs;
    mergedCategory.hasEmotes = mergedCategory.hasEmotes || otherCategory.hasEmotes;
    mergedCategory.hasConsumables = mergedCategory.hasConsumables || otherCategory.hasConsumables;
    mergedCategory.hasBounties = mergedCategory.hasBounties || otherCategory.hasBounties;
  }

  function loadVendorForCharacter(account, store, vendorDef, defs) {
    return loadVendor(account, store, vendorDef, defs)
      .then((vendor) => {
        service.loadedVendors++;
        return vendor;
      })
      .catch((e) => {
        service.loadedVendors++;
        if (vendorDef.hash !== 2796397637 && vendorDef.hash !== 2610555297) { // Xur, IB
          console.error(`Failed to load vendor ${vendorDef.summary.vendorName} for ${store.name}`, e);
        }
        return null;
      });
  }

  /**
   * Get this character's level for the given faction.
   */
  function factionLevel(store, factionHash) {
    const rep = store.progression.progressions.find((rep) => {
      return rep.faction && rep.faction.factionHash === factionHash;
    });
    return (rep && rep.level) || 0;
  }

  /**
   * Whether or not this character is aligned with the given faction.
   */
  function factionAligned(store, factionHash) {
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
  function cachedVendorUpToDate(vendor, store, vendorDef) {
    return vendor &&
      vendor.expires > Date.now() &&
      vendor.factionLevel === factionLevel(store, vendorDef.summary.factionHash) &&
      vendor.factionAligned === factionAligned(store, vendorDef.summary.factionHash);
  }

  function loadVendor(account, store, vendorDef, defs) {
    const vendorHash = vendorDef.hash;

    const key = vendorKey(store, vendorHash);
    return idbKeyval
      .get(key)
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
            .then((vendor) => {
              vendor.expires = calculateExpiration(vendor.nextRefreshDate, vendorHash);
              vendor.factionLevel = factionLevel(store, vendorDef.summary.factionHash);
              vendor.factionAligned = factionAligned(store, vendorDef.summary.factionHash);
              return idbKeyval
                .set(key, vendor)
                .then(() => vendor);
            })
            .catch((e) => {
              // console.log("vendor error", vendorDef.summary.vendorName, 'for', store.name, e, e.code, e.status);
              if (e.status === 'DestinyVendorNotFound') {
                const vendor = {
                  failed: true,
                  code: e.code,
                  status: e.status,
                  expires: Date.now() + (60 * 60 * 1000) + ((Math.random() - 0.5) * (60 * 60 * 1000)),
                  factionLevel: factionLevel(store, vendorDef.summary.factionHash),
                  factionAligned: factionAligned(store, vendorDef.summary.factionHash)
                };

                return idbKeyval
                  .set(key, vendor)
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
        return null;
      });
  }

  function vendorKey(store, vendorHash) {
    return ['vendor', store.id, vendorHash].join('-');
  }

  function calculateExpiration(nextRefreshDate, vendorHash) {
    const date = new Date(nextRefreshDate).getTime();

    if (vendorHash === xur) {
      // Xur always expires in an hour, because Bungie's data only
      // says when his stock will refresh, not when he becomes
      // unavailable.
      return Math.min(date, Date.now() + (60 * 60 * 1000));
    }

    // If the expiration is too far in the future, replace it with +8h
    if (date - Date.now() > 7 * 24 * 60 * 60 * 1000) {
      return Date.now() + (8 * 60 * 60 * 1000);
    }

    return date;
  }

  function processVendor(vendor, vendorDef, defs, store) {
    const def = vendorDef.summary;
    const createdVendor = {
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
      location: defs.VendorCategory.get(def.vendorCategoryHash).categoryName
    };

    const saleItems = flatMap(vendor.saleItemCategories, (categoryData) => {
      return categoryData.saleItems;
    });

    saleItems.forEach((saleItem) => {
      saleItem.item.itemInstanceId = `vendor-${vendorDef.hash}-${saleItem.vendorItemIndex}`;
    });

    return ItemFactory.processItems({ id: null }, saleItems.map((i) => i.item))
      .then((items) => {
        const itemsById = _.indexBy(items, 'id');
        const categories = _.compact(_.map(vendor.saleItemCategories, (category) => {
          const categoryInfo = vendorDef.categories[category.categoryIndex];
          if (_.contains(categoryBlacklist, categoryInfo.categoryHash)) {
            return null;
          }

          const categoryItems = category.saleItems.map((saleItem) => {
            const unlocked = isSaleItemUnlocked(saleItem);
            return {
              index: saleItem.vendorItemIndex,
              costs: saleItem.costs.map((cost) => {
                return {
                  value: cost.value,
                  currency: _.pick(defs.InventoryItem.get(cost.itemHash), 'itemName', 'icon', 'itemHash')
                };
              }).filter((c) => c.value > 0),
              item: itemsById[`vendor-${vendorDef.hash}-${saleItem.vendorItemIndex}`],
              // TODO: caveat, this won't update very often!
              unlocked: unlocked,
              unlockedByCharacter: unlocked ? [store.id] : [],
              failureStrings: saleItem.failureIndexes.map((i) => vendorDef.failureStrings[i]).join('. ')
            };
          });

          let hasArmorWeaps = false;
          let hasVehicles = false;
          let hasShadersEmbs = false;
          let hasEmotes = false;
          let hasConsumables = false;
          let hasBounties = false;
          categoryItems.forEach((saleItem) => {
            const item = saleItem.item;
            if (item.bucket.sort === 'Weapons' || item.bucket.sort === 'Armor' || item.type === 'Artifact' || item.type === 'Ghost') {
              if (item.talentGrid) {
                item.dtrRoll = _.compact(item.talentGrid.nodes.map((i) => i.dtrRoll)).join(';');
              }
              hasArmorWeaps = true;
            }
            if (item.type === 'Ship' || item.type === 'Vehicle') {
              hasVehicles = true;
            }
            if (item.type === "Emblem" || item.type === "Shader") {
              hasShadersEmbs = true;
            }
            if (item.type === "Emote") {
              hasEmotes = true;
            }
            if (item.type === "Material" || item.type === "Consumable") {
              hasConsumables = true;
            }
            if (item.type === 'Bounties') {
              hasBounties = true;
            }
          });

          return {
            index: category.categoryIndex,
            title: categoryInfo.displayTitle,
            saleItems: categoryItems,
            hasArmorWeaps: hasArmorWeaps,
            hasVehicles: hasVehicles,
            hasShadersEmbs: hasShadersEmbs,
            hasEmotes: hasEmotes,
            hasConsumables: hasConsumables,
            hasBounties: hasBounties
          };
        }));

        items.forEach((item) => {
          item.vendorIcon = createdVendor.icon;
        });

        createdVendor.allItems = items;
        createdVendor.categories = categories;

        createdVendor.hasArmorWeaps = _.any(categories, 'hasArmorWeaps');
        createdVendor.hasVehicles = _.any(categories, 'hasVehicles');
        createdVendor.hasShadersEmbs = _.any(categories, 'hasShadersEmbs');
        createdVendor.hasEmotes = _.any(categories, 'hasEmotes');
        createdVendor.hasConsumables = _.any(categories, 'hasConsumables');
        createdVendor.hasBounties = _.any(categories, 'hasBounties');

        return createdVendor;
      });
  }

  function isSaleItemUnlocked(saleItem) {
    return _.every(saleItem.unlockStatuses, 'isSet');
  }

  // TODO: do this with another observable!
  function requestRatings() {
    _ratingsRequested = true;
    fulfillRatingsRequest();
  }

  function fulfillRatingsRequest() {
    if (service.vendorsLoaded && _ratingsRequested) {
      // TODO: Throttle this. Right now we reload this on every page
      // view and refresh of the vendors page.
      dimDestinyTrackerService.updateVendorRankings(service.vendors);
    }
  }

  /**
   * Calculates a count of how many of each type of currency you
   * have on all characters, limited to only currencies required to
   * buy items from the provided vendors.
   */
  function countCurrencies(stores, vendors) {
    if (!stores || !vendors || !stores.length || _.isEmpty(vendors)) {
      return {};
    }

    const categories = flatMap(Object.values(vendors), 'categories');
    const saleItems = flatMap(categories, 'saleItems');
    const costs = flatMap(saleItems, 'costs');
    const currencies = costs.map((c) => c.currency.itemHash);

    const totalCoins = {};
    currencies.forEach((currencyHash) => {
      // Legendary marks and glimmer are special cases
      if (currencyHash === 2534352370) {
        totalCoins[currencyHash] = dimStoreService.getVault().legendaryMarks;
      } else if (currencyHash === 3159615086) {
        totalCoins[currencyHash] = dimStoreService.getVault().glimmer;
      } else if (currencyHash === 2749350776) {
        totalCoins[currencyHash] = dimStoreService.getVault().silver;
      } else {
        totalCoins[currencyHash] = sum(stores, (store) => {
          return store.amountOfItem({ hash: currencyHash });
        });
      }
    });
    return totalCoins;
  }
}
