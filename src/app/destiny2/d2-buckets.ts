import { VendorHashes } from 'app/search/d2-known-values';
import { filterMap } from 'app/utils/collections';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import type {
  D2BucketCategory,
  DimBucketType,
  InventoryBucket,
  InventoryBuckets,
} from '../inventory/inventory-buckets';
import { D2Categories } from './d2-bucket-categories';
import { D2ManifestDefinitions } from './d2-definitions';

// A mapping from the bucket hash to DIM item types
const bucketToTypeRaw = {
  [BucketHashes.EnergyWeapons]: 'Energy',
  [BucketHashes.UpgradePoint]: 'UpgradePoint',
  [BucketHashes.StrangeCoin]: 'StrangeCoin',
  [BucketHashes.Glimmer]: 'Glimmer',
  [BucketHashes.LegendaryShards]: 'Legendary Shards',
  [BucketHashes.Silver]: 'Silver',
  [BucketHashes.BrightDust]: 'Bright Dust',
  [BucketHashes.Messages]: 'Messages',
  [BucketHashes.Subclass]: 'Class',
  [BucketHashes.Modifications]: 'Modifications',
  [BucketHashes.Helmet]: 'Helmet',
  [BucketHashes.Gauntlets]: 'Gauntlets',
  [BucketHashes.Materials]: 'Materials',
  [BucketHashes.Ghost]: 'Ghost',
  [BucketHashes.Emblems]: 'Emblems',
  [BucketHashes.ChestArmor]: 'Chest',
  [BucketHashes.LegArmor]: 'Leg',
  [BucketHashes.LostItems]: 'LostItems',
  [BucketHashes.Ships]: 'Ships',
  [BucketHashes.Engrams]: 'Engrams',
  [BucketHashes.PowerWeapons]: 'Power',
  [BucketHashes.Auras]: 'Auras',
  [BucketHashes.SpecialOrders]: 'SpecialOrders',
  [BucketHashes.KineticWeapons]: 'KineticSlot',
  [BucketHashes.ClassArmor]: 'ClassItem',
  [BucketHashes.Vehicle]: 'Vehicle',
  [BucketHashes.Consumables]: 'Consumables',
  [BucketHashes.General]: 'General',
  [BucketHashes.Emotes_Invisible]: 'Emotes',
  [BucketHashes.Quests]: 'Pursuits',
  [BucketHashes.SeasonalArtifact]: 'SeasonalArtifacts',
  [BucketHashes.Finishers]: 'Finishers',
  [BucketHashes.ClanBanners]: 'ClanBanner',
} as const;

export type D2BucketTypes = (typeof bucketToTypeRaw)[keyof typeof bucketToTypeRaw];

// these don't have bucket hashes but may be manually assigned to DimItems
export type D2AdditionalBucketTypes = 'Milestone' | 'Unknown';

// A mapping from the bucket hash to DIM item types
export const bucketToType: {
  [hash: number]: DimBucketType | undefined;
} = bucketToTypeRaw;

const bucketHashToSort: { [bucketHash: number]: D2BucketCategory } = {};
for (const [category, bucketHashes] of Object.entries(D2Categories)) {
  for (const bucketHash of bucketHashes) {
    bucketHashToSort[bucketHash] = category as D2BucketCategory;
  }
}

export function getBuckets(defs: D2ManifestDefinitions) {
  const buckets: InventoryBuckets = {
    byHash: {},
    byCategory: {},
    unknown: {
      description: 'Unknown items. DIM needs a manifest update.',
      name: 'Unknown',
      hash: -1,
      // default to false. an equipped item existing, will override this in inv display
      equippable: false,
      hasTransferDestination: false,
      capacity: Number.MAX_SAFE_INTEGER,
      sort: 'Unknown',
      type: 'Unknown',
      accountWide: false,
      category: BucketCategory.Item,
    },
    setHasUnknown() {
      this.byCategory[this.unknown.sort!] = [this.unknown];
    },
  };
  for (const def of Object.values(defs.InventoryBucket.getAll())) {
    const type = bucketToType[def.hash];
    const sort = bucketHashToSort[def.hash];
    const bucket: InventoryBucket = {
      description: def.displayProperties.description,
      name: def.displayProperties.name,
      hash: def.hash,
      equippable: def.category === BucketCategory.Equippable,
      hasTransferDestination: def.hasTransferDestination,
      capacity: def.itemCount,
      accountWide: def.scope === 1,
      category: def.category,
      type,
      sort,
    };
    // Add an easy helper property like "inPostmaster"
    if (bucket.sort) {
      bucket[`in${bucket.sort}`] = true;
    }
    buckets.byHash[bucket.hash] = bucket;
  }
  const vaultMappings: { [bucketHash: number]: number } = {};
  for (const items of defs.Vendor.get(VendorHashes.Vault).acceptedItems) {
    vaultMappings[items.acceptedInventoryBucketHash] = items.destinationInventoryBucketHash;
  }
  for (const bucket of Object.values(buckets.byHash)) {
    if (vaultMappings[bucket.hash]) {
      bucket.vaultBucket = buckets.byHash[vaultMappings[bucket.hash]];
    }
  }
  for (const [category, bucketHashes] of Object.entries(D2Categories)) {
    buckets.byCategory[category] = filterMap(
      bucketHashes,
      (bucketHash) => buckets.byHash[bucketHash],
    );
  }
  return buckets;
}
