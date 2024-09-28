import { filterMap } from 'app/utils/collections';
import { HashLookup, StringLookup } from 'app/utils/util-types';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import type {
  D1BucketCategory,
  InventoryBucket,
  InventoryBuckets,
} from '../inventory/inventory-buckets';
import { D1Categories } from './d1-bucket-categories';
import type { D1ManifestDefinitions } from './d1-definitions';

export const vaultTypes: HashLookup<string> = {
  3003523923: 'Armor',
  4046403665: 'Weapons',
  138197802: 'General',
};

const sortToVault: StringLookup<number> = {
  Armor: 3003523923,
  Weapons: 4046403665,
  General: 138197802,
};

const bucketHashToSort: { [bucketHash: number]: D1BucketCategory } = {};
for (const [category, bucketHashes] of Object.entries(D1Categories)) {
  for (const bucketHash of bucketHashes) {
    bucketHashToSort[bucketHash] = category as D1BucketCategory;
  }
}

export function getBuckets(defs: D1ManifestDefinitions) {
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
      category: BucketCategory.Item,
      capacity: Number.MAX_SAFE_INTEGER,
      sort: 'Unknown',
      accountWide: false,
    },
    setHasUnknown() {
      this.byCategory[this.unknown.sort!] = [this.unknown];
    },
  };
  for (const def of Object.values(defs.InventoryBucket.getAll())) {
    if (def.enabled) {
      const sort = bucketHashToSort[def.hash] ?? vaultTypes[def.hash];
      const bucket: InventoryBucket = {
        description: def.bucketDescription,
        name: def.bucketName,
        hash: def.hash,
        equippable: def.category === BucketCategory.Equippable,
        hasTransferDestination: def.hasTransferDestination,
        capacity: def.itemCount,
        accountWide: false,
        category: BucketCategory.Item,
        sort,
      };
      if (sort) {
        // Add an easy helper property like "inPostmaster"
        bucket[`in${sort}`] = true;
      }
      buckets.byHash[bucket.hash] = bucket;
    }
  }
  for (const bucket of Object.values(buckets.byHash)) {
    if (bucket.sort && sortToVault[bucket.sort] && sortToVault[bucket.sort] !== bucket.hash) {
      bucket.vaultBucket = buckets.byHash[sortToVault[bucket.sort]!];
    }
  }
  for (const [category, bucketHashes] of Object.entries(D1Categories)) {
    buckets.byCategory[category] = filterMap(
      bucketHashes,
      (bucketHash) => buckets.byHash[bucketHash],
    );
  }
  return buckets;
}
