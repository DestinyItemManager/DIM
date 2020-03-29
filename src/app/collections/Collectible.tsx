import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { makeFakeItem } from '../inventory/store/d2-item-factory';
import {
  DestinyProfileResponse,
  DestinyScope,
  DestinyCollectibleState,
  DestinyCollectibleDefinition
} from 'bungie-api-ts/destiny2';
import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';

interface Props {
  collectibleHash: number;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
  ownedItemHashes?: Set<number>;
}

export default function Collectible({
  collectibleHash,
  defs,
  buckets,
  profileResponse,
  ownedItemHashes
}: Props) {
  const collectibleDef = defs.Collectible.get(collectibleHash);
  if (!collectibleDef) {
    return null;
  }
  const state = getCollectibleState(collectibleDef, profileResponse);
  if (state === undefined || state & DestinyCollectibleState.Invisible || collectibleDef.redacted) {
    return null;
  }

  const owned = ownedItemHashes?.has(collectibleDef.itemHash);
  const acquired = !(state & DestinyCollectibleState.NotAcquired);

  const item = makeFakeItem(defs, buckets, profileResponse.itemComponents, collectibleDef.itemHash);
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
