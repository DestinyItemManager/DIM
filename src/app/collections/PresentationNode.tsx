import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './PresentationNode.scss';
import Collectible, { getCollectibleState } from './Collectible';
import { DestinyProfileResponse, DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { count } from '../util';
import BungieImage from '../dim-ui/BungieImage';
import classNames from 'classnames';
import { router } from '../../router';

interface Props {
  presentationNodeHash: number;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
  ownedItemHashes: Set<number>;
  path: number[];
}

const rootNodes = [3790247699];

export default class PresentationNode extends React.Component<Props> {
  render() {
    const {
      presentationNodeHash,
      defs,
      profileResponse,
      buckets,
      ownedItemHashes,
      path
    } = this.props;
    const presentationNodeDef = defs.PresentationNode.get(presentationNodeHash);
    if (!presentationNodeDef) {
      return (
        <div className="dim-error">
          <h2>Bad presentation node</h2>
          <div>This isn't real {presentationNodeHash}</div>
        </div>
      );
    }
    console.log(presentationNodeDef);

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
    const childrenExpanded = path.includes(presentationNodeHash);

    // console.log({ childrenExpanded, path, presentationNodeHash });

    const displayStyle = {
      /** Display the item as a category, through which sub-items are filtered. */
      0: 'Category',
      1: 'Badge',
      2: 'Medals',
      3: 'Collectible',
      4: 'Record'
    };

    const screenStyle = {
      0: 'Default',
      1: 'CategorySets',
      2: 'Badge'
    };

    return (
      <div
        className={classNames(
          'presentation-node',
          `display-style-${displayStyle[presentationNodeDef.displayStyle]}`,
          `screen-style-${screenStyle[presentationNodeDef.screenStyle]}`
        )}
      >
        {!rootNodes.includes(presentationNodeHash) && (
          <h3 onClick={this.expandChildren}>
            <BungieImage src={presentationNodeDef.displayProperties.icon} />
            {presentationNodeDef.displayProperties.name} {acquiredCollectibles} /{' '}
            {visibleCollectibles}
          </h3>
        )}
        {childrenExpanded &&
          presentationNodeDef.children.presentationNodes.map((node) => (
            <PresentationNode
              key={node.presentationNodeHash}
              presentationNodeHash={node.presentationNodeHash}
              defs={defs}
              profileResponse={profileResponse}
              buckets={buckets}
              ownedItemHashes={ownedItemHashes}
              path={path}
            />
          ))}
        {childrenExpanded &&
          visibleCollectibles > 0 && (
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

  private expandChildren = () => {
    const { presentationNodeHash } = this.props;
    router.stateService.go(router.stateService.$current.name, { presentationNodeHash });
    return false;
  };
}

/*
function countCollectibles(presentationNodeDef, profileResponse) {

}
*/
