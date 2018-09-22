import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './PresentationNode.scss';
import Collectible, { getCollectibleState } from './Collectible';
import { DestinyProfileResponse, DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { count } from '../util';
import BungieImage from '../dim-ui/BungieImage';

interface Props {
  presentationNodeHash: number;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
  ownedItemHashes: Set<number>;
}

export default class PresentationNode extends React.Component<Props> {
  render() {
    const { presentationNodeHash, defs, profileResponse, buckets, ownedItemHashes } = this.props;
    const presentationNodeDef = defs.PresentationNode.get(presentationNodeHash);
    // TODO: class based on displayStyle
    const visibleCollectibles = count(
      presentationNodeDef.children.collectibles,
      (c) =>
        !(
          getCollectibleState(defs.Collectible.get(c.collectibleHash), profileResponse) &
          DestinyCollectibleState.Invisible
        )
    );
    const acquiredCollectibles = count(
      presentationNodeDef.children.collectibles,
      (c) =>
        !(
          getCollectibleState(defs.Collectible.get(c.collectibleHash), profileResponse) &
          DestinyCollectibleState.NotAcquired
        )
    );

    if (!visibleCollectibles && !presentationNodeDef.children.presentationNodes.length) {
      return null;
    }

    // TODO: look at how companion and in-game shows it!

    return (
      <div className="presentation-node">
        <h3>
          <BungieImage src={presentationNodeDef.displayProperties.icon} />
          {presentationNodeDef.displayProperties.name} {acquiredCollectibles} /{' '}
          {visibleCollectibles}
        </h3>
        {presentationNodeDef.children.presentationNodes.map((node) => (
          <PresentationNode
            key={node.presentationNodeHash}
            presentationNodeHash={node.presentationNodeHash}
            defs={defs}
            profileResponse={profileResponse}
            buckets={buckets}
            ownedItemHashes={ownedItemHashes}
          />
        ))}
        {visibleCollectibles > 0 && (
          <div className="collectibles">
            {presentationNodeDef.children.collectibles.map((collectible) => (
              <Collectible
                key={collectible.collectibleHash}
                collectibleHash={collectible.collectibleHash}
                defs={defs}
                profileResponse={profileResponse}
                buckets={buckets}
                ownedItemHashes={ownedItemHashes}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}

/*
function countCollectibles(presentationNodeDef, profileResponse) {

}
*/
