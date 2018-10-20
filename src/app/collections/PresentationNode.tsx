import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './PresentationNode.scss';
import Collectible, { getCollectibleState } from './Collectible';
import { DestinyProfileResponse, DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { count } from '../util';
import BungieImage from '../dim-ui/BungieImage';
import classNames from 'classnames';

interface Props {
  presentationNodeHash: number;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
  ownedItemHashes: Set<number>;
  path: number[];
  parents: number[];
  collectionCounts: {
    [nodeHash: number]: {
      acquired: number;
      visible: number;
    };
  };
  onNodePathSelected(nodePath: number[]);
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
      path,
      collectionCounts,
      onNodePathSelected
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
    const { visible, acquired } = collectionCounts[presentationNodeHash];

    if (!visible && !acquired) {
      return null;
    }

    // TODO: look at how companion and in-game shows it!
    const childrenExpanded =
      path.includes(presentationNodeHash) || rootNodes.includes(presentationNodeHash);

    const parents = [...this.props.parents, presentationNodeHash];

    // console.log({ childrenExpanded, path, presentationNodeHash });

    // TODO: count up owned items and total items at the root!

    // TODO: hey, the image for the heavy/special/primary categories is the icon!

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

    // TODO: each child node gets a path separate from the selected path?

    return (
      <div
        className={classNames(
          'presentation-node',
          `display-style-${displayStyle[presentationNodeDef.displayStyle]}`,
          `screen-style-${screenStyle[presentationNodeDef.screenStyle]}`
        )}
      >
        {!rootNodes.includes(presentationNodeHash) && (
          <div className="title" onClick={this.expandChildren}>
            <span className="collapse-handle">
              <i
                className={classNames(
                  'fa collapse',
                  childrenExpanded ? 'fa-minus-square-o' : 'fa-plus-square-o'
                )}
              />{' '}
              {presentationNodeDef.displayProperties.icon && (
                <BungieImage src={presentationNodeDef.displayProperties.icon} />
              )}{' '}
              {presentationNodeDef.displayProperties.name}
            </span>
            <span>
              {acquired} / {visible}
            </span>
          </div>
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
              parents={parents}
              onNodePathSelected={onNodePathSelected}
              collectionCounts={collectionCounts}
            />
          ))}
        {childrenExpanded &&
          visible > 0 && (
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
    const { presentationNodeHash, parents, path } = this.props;
    const childrenExpanded =
      path.includes(presentationNodeHash) || rootNodes.includes(presentationNodeHash);
    this.props.onNodePathSelected(childrenExpanded ? parents : [...parents, presentationNodeHash]);
    return false;
  };
}

/**
 * Recursively count how many items are in the tree, and how many we have. This computes a map
 * indexed by node hash for the entire tree.
 */
export function countCollectibles(
  defs: D2ManifestDefinitions,
  node: number,
  profileResponse: DestinyProfileResponse
) {
  const presentationNodeDef = defs.PresentationNode.get(node);
  if (
    presentationNodeDef.children.collectibles &&
    presentationNodeDef.children.collectibles.length
  ) {
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

    // add an entry for self and return
    return {
      [node]: {
        acquired: acquiredCollectibles,
        visible: visibleCollectibles
      }
    };
  } else {
    // call for all children, then add 'em up
    const ret = {};
    let acquired = 0;
    let visible = 0;
    for (const presentationNode of presentationNodeDef.children.presentationNodes) {
      const subnode = countCollectibles(
        defs,
        presentationNode.presentationNodeHash,
        profileResponse
      );
      const subnodeValue = subnode[presentationNode.presentationNodeHash];
      acquired += subnodeValue.acquired;
      visible += subnodeValue.visible;
      Object.assign(ret, subnode);
    }
    Object.assign(ret, {
      [node]: {
        acquired,
        visible
      }
    });
    return ret;
  }
}
