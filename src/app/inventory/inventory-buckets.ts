import { D1BucketTypes } from 'app/destiny1/d1-buckets';
import type { D2AdditionalBucketTypes, D2BucketTypes } from 'app/destiny2/d2-buckets';
import { BucketCategory } from 'bungie-api-ts/destiny2';

export interface InventoryBucket {
  readonly description: string;
  readonly name: string;
  readonly hash: number;
  readonly hasTransferDestination: boolean;
  readonly capacity: number;
  readonly accountWide: boolean;
  readonly category: BucketCategory;
  readonly type?: DimBucketType;
  readonly sort?: D2BucketCategory | D1BucketCategory | 'Unknown';
  /**
   * The corresponding vault bucket where these items would go if they were placed in the vault.
   */
  vaultBucket?: InventoryBucket;
  // TODO: how to handle inPostmaster, etc? should probably be a function
  inPostmaster?: boolean;
  inWeapons?: boolean;
  inArmor?: boolean;
  inGeneral?: boolean;
  inProgress?: boolean;
}

/** The major toplevel sections of the inventory. "Progress" is only in D1. */
export type D2BucketCategory =
  | 'Postmaster'
  | 'Weapons'
  | 'Armor'
  | 'Class'
  | 'General'
  | 'Inventory';
export type D1BucketCategory = 'Postmaster' | 'Weapons' | 'Armor' | 'General' | 'Progress';
export type DimBucketType = D2BucketTypes | D2AdditionalBucketTypes | D1BucketTypes;

export interface InventoryBuckets {
  byHash: { [hash: number]: InventoryBucket };
  byType: { [type: string]: InventoryBucket };
  byCategory: { [category: string]: InventoryBucket[] };
  unknown: InventoryBucket; // TODO: get rid of this?
  setHasUnknown(): void;
}
