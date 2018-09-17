import { BucketCategory } from 'bungie-api-ts/destiny2';

export interface InventoryBucket {
  /** @deprecated */
  readonly id: string; // stringified hash
  readonly description: string;
  readonly name: string;
  readonly hash: number;
  readonly hasTransferDestination: boolean;
  readonly capacity: number;
  readonly accountWide: boolean;
  readonly category: BucketCategory;
  readonly type?: string;
  readonly sort?: string;
  vaultBucket?: InventoryBucket;
  // TODO: how to handle inPostmaster, etc? should probably be a function
  inPostmaster?: boolean;
  inWeapons?: boolean;
  inArmor?: boolean;
  inGeneral?: boolean;
  inProgress?: boolean;
}

export interface InventoryBuckets {
  byHash: { [hash: number]: InventoryBucket };
  byType: { [type: string]: InventoryBucket };
  /** @deprecated */
  byId: { [hash: number]: InventoryBucket };
  byCategory: { [category: string]: InventoryBucket[] };
  unknown: InventoryBucket; // TODO: get rid of this?
  setHasUnknown();
}
