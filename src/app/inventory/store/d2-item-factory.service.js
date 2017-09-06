import angular from 'angular';
import _ from 'underscore';
import { getClass } from './character-utils';

// Maps tierType to tierTypeName in English
const tiers = [
  'Unknown',
  'Currency',
  'Common',
  'Uncommon',
  'Rare',
  'Legendary',
  'Exotic'
];

/**
 * A factory service for producing DIM inventory items.
 */
export function D2ItemFactory(
  D2ManifestService,
  dimSettingsService,
  $i18next,
  NewItemsService,
  D2Definitions,
  D2BucketsService,
  $q
) {
  'ngInject';

  let _idTracker = {};

  // Prototype for Item objects - add methods to this to add them to all
  // items.
  const ItemProto = {
    // Can this item be equipped by the given store?
    canBeEquippedBy: function(store) {
      if (store.isVault) {
        return false;
      }

      return this.equipment &&
        // For the right class
        (this.classTypeName === 'unknown' || this.classTypeName === store.class) &&
        // nothing we are too low-level to equip
        this.equipRequiredLevel <= store.level &&
        // can be moved or is already here
        (!this.notransfer || this.owner === store.id) &&
        !this.location.inPostmaster;
    },
    inCategory: function(categoryName) {
      return _.contains(this.categories, categoryName);
    },
    isEngram: function() {
      return this.inCategory('CATEGORY_ENGRAM');
    },
    canBeInLoadout: function() {
      return this.equipment || this.type === 'Material' || this.type === 'Consumable';
    }
  };

  return {
    resetIdTracker,
    processItems,
    makeItem,
    createItemIndex
  };


  function resetIdTracker() {
    _idTracker = {};
  }

  /**
   * Process an entire list of items into DIM items.
   * @param {string} owner the ID of the owning store.
   * @param {Array} items a list of "raw" items from the Destiny API
   * @param {Set<string>} previousItems a set of item IDs representing the previous store's items
   * @param {Set<string>} newItems a set of item IDs representing the previous list of new items
   * @param itemInfoService the item info factory for this store's platform
   * @return {Promise<Array>} a promise for the list of items
   */
  function processItems(owner, items, itemComponents, previousItems = new Set(), newItems = new Set(), itemInfoService) {
    return $q.all([
      D2Definitions.getDefinitions(),
      D2BucketsService.getBuckets(),
      previousItems,
      newItems,
      itemInfoService])
      .then((args) => {
        const result = [];
        D2ManifestService.statusText = `${$i18next.t('Manifest.LoadCharInv')}...`;
        _.each(items, (item) => {
          let createdItem = null;
          try {
            createdItem = makeItem(...args, itemComponents, item, owner);
          } catch (e) {
            console.error("Error processing item", item, e);
          }
          if (createdItem !== null) {
            createdItem.owner = owner.id;
            result.push(createdItem);
          }
        });
        return result;
      });
  }

  /**
   * Process a single raw item into a DIM item.s
   * @param defs the manifest definitions from dimDefinitions
   * @param buckets the bucket definitions from dimBucketService
   * @param {Set<string>} previousItems a set of item IDs representing the previous store's items
   * @param {Set<string>} newItems a set of item IDs representing the previous list of new items
   * @param itemInfoService the item info factory for this store's platform
   * @param item "raw" item from the Destiny API
   * @param {string} owner the ID of the owning store.
   */
  function makeItem(defs, buckets, previousItems, newItems, itemInfoService, itemComponents, item, owner) {
    let itemDef = defs.InventoryItem.get(item.itemHash);
    const instanceDef = itemComponents.instances.data[item.itemInstanceId] || {};
    // Missing definition?
    if (!itemDef) {
      // maybe it is redacted...
      itemDef = {
        itemName: "Missing Item",
        redacted: true
      };
      D2ManifestService.warnMissingDefinition();
    }

    if (!itemDef.icon && !itemDef.action) {
      itemDef.classified = true;
      itemDef.classType = 3;
    }

    if (!itemDef.icon) {
      itemDef.icon = '/img/misc/missing_icon.png';
    }

    // TODO: find a substitute for itemTypeName
    if (!itemDef.itemTypeDisplayName) {
      itemDef.itemTypeDisplayName = 'Unknown';
    }

    if (itemDef.redacted) {
      console.warn('Missing Item Definition:\n\n', item, '\n\nThis item is not in the current manifest and will be added at a later time by Bungie.');
    }

    if (!itemDef || !itemDef.displayProperties.name) {
      return null;
    }

    // def.bucketTypeHash is where it goes normally
    let normalBucket = buckets.byHash[itemDef.inventory.bucketTypeHash];
    // item.bucket is where it IS right now
    let currentBucket = buckets.byHash[item.bucketHash] || normalBucket;
    if (!normalBucket) {
      currentBucket = normalBucket = buckets.unknown;
      buckets.setHasUnknown();
    }

    console.log({ itemDef, instanceDef, item, normalBucket, currentBucket });

    // We cheat a bit for items in the vault, since we treat the
    // vault as a character. So put them in the bucket they would
    // have been in if they'd been on a character.
    if (instanceDef.location === 2 /* vault */) {
      currentBucket = normalBucket;
    }

    const itemType = normalBucket.type || 'Unknown';

    const categories = itemDef.itemCategoryHashes ? _.compact(itemDef.itemCategoryHashes.map((c) => {
      const category = defs.ItemCategory.get(c);
      return category ? category.hash : null; // Uh oh, no more readable IDs!
    })) : [];

    const dmgName = [null, 'kinetic', 'arc', 'solar', 'void', 'raid'][instanceDef.damageType];

    const createdItem = angular.extend(Object.create(ItemProto), {
      // figure out what year this item is probably from
      destinyVersion: 2,
      // The bucket the item is currently in
      location: currentBucket,
      // The bucket the item normally resides in (even though it may be in the vault/postmaster)
      bucket: normalBucket,
      hash: item.itemHash,
      // This is the type of the item (see D2Category/D2Buckets) regardless of location
      type: itemType,
      categories: categories, // see defs.ItemCategories
      tier: tiers[itemDef.inventory.tierType] || 'Common',
      isExotic: tiers[itemDef.inventory.tierType] === 'Exotic',
      isVendorItem: (!owner || owner.id === null),
      name: itemDef.displayProperties.name,
      description: itemDef.displayProperties.description,
      icon: itemDef.displayProperties.icon,
      notransfer: Boolean(currentBucket.inPostmaster || itemDef.nonTransferrable || !itemDef.allowActions || itemDef.classified),
      id: item.itemInstanceId,
      equipped: instanceDef.isEquipped,
      equipment: Boolean(item.equippingBlock), // TODO: this has a ton of good info for the item move logic
      complete: false, // TODO: what's the deal w/ item progression?
      amount: item.quantity,
      primStat: instanceDef.primaryStat || null,
      typeName: itemDef.itemTypeDisplayName,
      equipRequiredLevel: instanceDef.equipRequiredLevel,
      maxStackSize: Math.max(itemDef.inventory.maxStackSize, 1),
      // 0: titan, 1: hunter, 2: warlock, 3: any
      classType: itemDef.classType,
      classTypeName: getClass(itemDef.classType),
      classTypeNameLocalized: getClassTypeNameLocalized(defs, itemDef.classType),
      dmg: dmgName,
      visible: true,
      lockable: item.lockable,
      tracked: item.state === 2,
      locked: item.state === 1,
      redacted: Boolean(itemDef.redacted),
      classified: Boolean(itemDef.classified),
      isInLoadout: false,
      percentComplete: null, // filled in later
      talentGrid: null, // filled in later
      stats: null, // filled in later
      objectives: null, // filled in later
      quality: null // filled in later
    });

    // *able
    createdItem.taggable = Boolean($featureFlags.tagsEnabled && createdItem.lockable && !_.contains(categories, 'CATEGORY_ENGRAM'));
    createdItem.comparable = Boolean($featureFlags.compareEnabled && createdItem.equipment && createdItem.lockable);

    if (createdItem.primStat) {
      createdItem.primStat.stat = defs.Stat.get(createdItem.primStat.statHash);
    }

    // An item is new if it was previously known to be new, or if it's new since the last load (previousItems);
    createdItem.isNew = false;
    try {
      createdItem.isNew = NewItemsService.isItemNew(createdItem.id, previousItems, newItems);
    } catch (e) {
      console.error(`Error determining new-ness of ${createdItem.name}`, item, itemDef, e);
    }

    if (itemInfoService) {
      try {
        createdItem.dimInfo = itemInfoService.infoForItem(createdItem.hash, createdItem.id);
      } catch (e) {
        console.error(`Error getting extra DIM info for ${createdItem.name}`, item, itemDef, e);
      }
    }

    createdItem.index = createItemIndex(createdItem);

    return createdItem;
  }

  // Set an ID for the item that should be unique across all items
  function createItemIndex(item) {
    // Try to make a unique, but stable ID. This isn't always possible, such as in the case of consumables.
    let index = item.id;
    if (item.id === '0') {
      index = `${item.hash}-am${item.amount}`;
      _idTracker[index] = (_idTracker[index] || 0) + 1;
      index = `${index}-t${_idTracker[index]}`;
    }

    // Perf hack: the index is used as a key for ng-repeat. What we are doing here
    // is adding extra info to that key in order to force items to be re-rendered when
    // this index changes. These properties are selected because they're used in the
    // dimStoreItem directive. Ideally this would just be a hash of all these properties,
    // but for now a big string will do.
    //
    // Oh, also, this value needs to be safe as an HTML ID.

    if (!item.complete && item.percentComplete) {
      index += `-pc${Math.round(item.percentComplete * 100)}`;
    }
    if (item.quality) {
      index += `-q${item.quality.min}`;
    }
    if (item.primStat && item.primStat.value) {
      index += `-ps${item.primStat.value}`;
    }

    return index;
  }

  function getClassTypeNameLocalized(defs, type) {
    const klass = _.find(_.values(defs.Class), { classType: type });
    if (klass) {
      return klass.className;
    } else {
      return $i18next.t('Loadouts.Any');
    }
  }
}
