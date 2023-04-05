import { D1BucketTypes } from 'app/destiny1/d1-buckets';
import type { D2AdditionalBucketTypes, D2BucketTypes } from 'app/destiny2/d2-buckets';
import { BucketCategory } from 'bungie-api-ts/destiny2';

/** The major toplevel sections of the inventory. "Progress" is only in D1. */
export type D2BucketCategory = 'Postmaster' | 'Weapons' | 'Armor' | 'General' | 'Inventory';
export type D1BucketCategory = 'Postmaster' | 'Weapons' | 'Armor' | 'General' | 'Progress';
export type DimBucketType = D2BucketTypes | D2AdditionalBucketTypes | D1BucketTypes;
export type BucketSortType = D2BucketCategory | D1BucketCategory | 'Unknown';

export type InventoryBucket = {
  readonly description: string;
  readonly name: string;
  readonly hash: number;
  readonly hasTransferDestination: boolean;
  readonly capacity: number;
  readonly accountWide: boolean;
  readonly category: BucketCategory;
  readonly type?: DimBucketType;
  readonly sort?: BucketSortType;
  /**
   * The corresponding vault bucket where these items would go if they were placed in the vault.
   */
  vaultBucket?: InventoryBucket;
} & {
  // inPostmaster, inArmor, etc
  [C in BucketSortType as `in${C}`]?: boolean;
};

export interface InventoryBuckets {
  byHash: { [hash: number]: InventoryBucket };
  byCategory: { [category: string]: InventoryBucket[] };
  unknown: InventoryBucket; // TODO: get rid of this?
  setHasUnknown: () => void;
}
