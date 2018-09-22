import * as React from 'react';
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
import InventoryItem from '../inventory/InventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import dialogTemplate from './collectible-popup.html';
import checkMark from '../../images/check.svg';
import './Collectible.scss';

interface Props {
  collectibleHash: number;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
  ownedItemHashes: Set<number>;
  // TODO: choose character
}

export default class Collectible extends React.Component<Props> {
  render() {
    const { collectibleHash, defs, buckets, profileResponse, ownedItemHashes } = this.props;
    const collectibleDef = defs.Collectible.get(collectibleHash);
    const state = getCollectibleState(collectibleDef, profileResponse);
    /*
    if (state & DestinyCollectibleState.Obscured) {
      console.log(collectibleDef.displayProperties.name, state, collectibleDef);
    }
    */
    if (state & DestinyCollectibleState.Invisible) {
      return null;
    }

    const owned = ownedItemHashes.has(collectibleDef.itemHash);
    const acquired = Boolean(state & DestinyCollectibleState.NotAcquired);

    // TODO: memoize
    // TODO: show perks

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
        state: ItemState.None
      },
      undefined,
      undefined // reviewData
    );

    if (!item) {
      return null;
    }

    return (
      <div className="vendor-item">
        {acquired && <div className="locked-overlay" />}
        {owned && <img className="owned-icon" src={checkMark} />}
        <ItemPopupTrigger
          item={item}
          alternateTemplate={dialogTemplate}
          extraData={{ collectible: collectibleDef, owned, checkMark, acquired }}
        >
          <InventoryItem item={item} />
        </ItemPopupTrigger>
      </div>
    );
  }
}

export function getCollectibleState(
  collectibleDef: DestinyCollectibleDefinition,
  profileResponse: DestinyProfileResponse
) {
  return collectibleDef.scope === DestinyScope.Character
    ? Object.values(profileResponse.characterCollectibles.data)[0].collectibles[collectibleDef.hash]
        .state
    : profileResponse.profileCollectibles.data.collectibles[collectibleDef.hash].state;
}
