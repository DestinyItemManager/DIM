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
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import checkMark from '../../images/check.svg';
import classNames from 'classnames';
import './Collectible.scss';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';

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
    if (state & DestinyCollectibleState.Invisible || collectibleDef.redacted) {
      return null;
    }

    const owned = ownedItemHashes && ownedItemHashes.has(collectibleDef.itemHash);
    const acquired = !Boolean(state & DestinyCollectibleState.NotAcquired);

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

    item.missingSockets = false;

    return (
      <div
        className={classNames('vendor-item', {
          owned,
          unavailable: !acquired
        })}
      >
        {owned && <img className="owned-icon" src={checkMark} />}
        <ItemPopupTrigger item={item} extraData={{ collectible: collectibleDef, owned, acquired }}>
          <ConnectedInventoryItem item={item} allowFilter={true} />
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
