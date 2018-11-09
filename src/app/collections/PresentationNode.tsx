import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './PresentationNode.scss';
import Collectible, { getCollectibleState } from './Collectible';
import {
  DestinyProfileResponse,
  DestinyCollectibleState,
  DestinyPresentationScreenStyle
} from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { count } from '../util';
import BungieImage from '../dim-ui/BungieImage';
import classNames from 'classnames';
import { expandIcon, collapseIcon, AppIcon } from '../shell/icons';

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
  private headerRef = React.createRef<HTMLDivElement>();

  componentDidUpdate() {
    if (
      this.headerRef.current &&
      this.props.path[this.props.path.length - 1] === this.props.presentationNodeHash
    ) {
      this.headerRef.current!.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
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

    // TODO: class based on displayStyle
    const { visible, acquired } = collectionCounts[presentationNodeHash];

    if (!visible && !acquired) {
      return null;
    }

    const parents = [...this.props.parents, presentationNodeHash];

    const defaultExpanded =
      parents.length >=
      (parents.some(
        (p) =>
          defs.PresentationNode.get(p).screenStyle === DestinyPresentationScreenStyle.CategorySets
      )
        ? 5
        : 4);

    const childrenExpanded =
      defaultExpanded ||
      path.includes(presentationNodeHash) ||
      rootNodes.includes(presentationNodeHash);

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

    const nodeStyle = {
      0: 'Default',
      1: 'Category',
      2: 'Collectibles',
      3: 'Records'
    };

    const title = (
      <span className="node-name">
        {presentationNodeDef.displayProperties.icon && (
          <BungieImage src={presentationNodeDef.displayProperties.icon} />
        )}{' '}
        {presentationNodeDef.displayProperties.name}
      </span>
    );

    return (
      <div
        className={classNames(
          'presentation-node',
          `display-style-${displayStyle[presentationNodeDef.displayStyle]}`,
          `screen-style-${screenStyle[presentationNodeDef.screenStyle]}`,
          `node-style-${nodeStyle[presentationNodeDef.nodeType]}`,
          `level-${parents.length}`
        )}
      >
        {!rootNodes.includes(presentationNodeHash) && (
          <div
            className={defaultExpanded ? 'leaf-node' : 'title'}
            onClick={this.expandChildren}
            ref={this.headerRef}
          >
            {defaultExpanded ? (
              title
            ) : (
              <span className="collapse-handle">
                <AppIcon className="collapse" icon={childrenExpanded ? collapseIcon : expandIcon} />{' '}
                {title}
              </span>
            )}
            <span className="node-progress">
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
        {childrenExpanded && visible > 0 && (
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
