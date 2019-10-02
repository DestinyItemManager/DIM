import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { makeItem } from '../inventory/store/d2-item-factory';
import {
  ItemBindStatus,
  ItemLocation,
  TransferStatuses,
  ItemState,
  DestinyInventoryItemDefinition
} from 'bungie-api-ts/destiny2';
import './Collectible.scss';
import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';

interface Props {
  inventoryItem: DestinyInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  ownedItemHashes?: Set<number>;
  owned: boolean;
  onAnItem: boolean;
}

export default function Collectible({ inventoryItem, defs, buckets, owned, onAnItem }: Props) {
  if (!inventoryItem) {
    return null;
  }

  const item = makeItem(
    defs,
    buckets,
    new Set(),
    new Set(),
    undefined,
    undefined,
    {
      itemHash: inventoryItem.hash,
      itemInstanceId: inventoryItem.hash.toString(),
      quantity: 1,
      bindStatus: ItemBindStatus.NotBound,
      location: ItemLocation.Vendor,
      bucketHash: 0,
      transferStatus: TransferStatuses.NotTransferrable,
      lockable: false,
      state: ItemState.None,
      isWrapper: false,
      tooltipNotificationIndexes: []
    },
    undefined,
    undefined // reviewData
  );

  if (!item) {
    return null;
  }

  item.missingSockets = false;

  return (
    <VendorItemDisplay
      item={item}
      acquired={onAnItem}
      unavailable={!owned}
      extraData={{ acquired: onAnItem, owned, mod: true }}
    />
  );
}
