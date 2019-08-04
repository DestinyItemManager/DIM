import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { makeItem } from '../inventory/store/d2-item-factory.service';
import {
  DestinyProfileResponse,
  ItemBindStatus,
  ItemLocation,
  TransferStatuses,
  ItemState,
  DestinyScope,
  DestinyCollectibleState,
  DestinyCollectibleDefinition
} from 'bungie-api-ts/destiny2';
import './Collectible.scss';
import { VendorItemDisplay } from 'app/d2-vendors/VendorItemComponent';

interface Props {
  collectibleHash: number;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
  ownedItemHashes?: Set<number>;
}

export default class Collectible extends React.Component<Props> {
  render() {
    const { collectibleHash, defs, buckets, profileResponse, ownedItemHashes } = this.props;
    const collectibleDef = defs.Collectible.get(collectibleHash);
    if (!collectibleDef) {
      return null;
    }
    const state = getCollectibleState(collectibleDef, profileResponse);
    if (
      state === undefined ||
      state & DestinyCollectibleState.Invisible ||
      collectibleDef.redacted
    ) {
      return null;
    }

    const owned = ownedItemHashes && ownedItemHashes.has(collectibleDef.itemHash);
    const acquired = !(state & DestinyCollectibleState.NotAcquired);

    const item = makeItem(
      defs,
      buckets,
      new Set(),
      new Set(),
      undefined,
      profileResponse.itemComponents,
      {
        itemHash: collectibleDef.itemHash,
        itemInstanceId: collectibleDef.itemHash.toString(),
        quantity: 1,
        bindStatus: ItemBindStatus.NotBound,
        location: ItemLocation.Vendor,
        bucketHash: 0,
        transferStatus: TransferStatuses.NotTransferrable,
        lockable: false,
        state: ItemState.None,
        isWrapper: false
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
        owned={owned}
        unavailable={!acquired}
        extraData={{ collectible: collectibleDef, owned, acquired }}
      />
    );
  }
}

export function getCollectibleState(
  collectibleDef: DestinyCollectibleDefinition,
  profileResponse: DestinyProfileResponse
) {
  return collectibleDef.scope === DestinyScope.Character
    ? profileResponse.characterCollectibles.data
      ? Object.values(profileResponse.characterCollectibles.data)[0].collectibles[
          collectibleDef.hash
        ].state
      : undefined
    : profileResponse.profileCollectibles.data
    ? profileResponse.profileCollectibles.data.collectibles[collectibleDef.hash].state
    : undefined;
}
