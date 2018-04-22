import { D1InventoryBucket, D1InventoryBuckets } from "../destiny1/d1-buckets.service";
import { D2InventoryBucket, D2InventoryBuckets } from "../destiny2/d2-buckets.service";

/** A bucket type for code that can handle both D1 and D2 */
export type DimInventoryBucket = D1InventoryBucket | D2InventoryBucket;
/** A buckets type for code that can handle both D1 and D2 */
export type DimInventoryBuckets = D1InventoryBuckets | D2InventoryBuckets;
