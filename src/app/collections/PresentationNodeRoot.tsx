import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import PresentationNode from './PresentationNode';
import {
  DestinyProfileResponse,
  DestinyCollectibleState,
  DestinyRecordState
} from 'bungie-api-ts/destiny2';
import { getCollectibleState } from './Collectible';
import { count } from '../util';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import PlugSet from './PlugSet';
import * as _ from 'lodash';
import { getRecordComponent } from './Record';

interface Props {
  presentationNodeHash: number;
  openedPresentationHash?: number;
  ownedItemHashes?: Set<number>;
  profileResponse: DestinyProfileResponse;
  buckets?: InventoryBuckets;
  defs: D2ManifestDefinitions;

  // This is a hack because emotes aren't in the Collections
  plugSetHashes?: Set<string>;
}

interface State {
  nodePath: number[];
}

/**
 * The root for an expandable presentation node tree.
 */
export default class PresentationNodeRoot extends React.Component<Props, State> {
  state: State = { nodePath: [] };

  render() {
    const {
      presentationNodeHash,
      openedPresentationHash,
      defs,
      buckets,
      profileResponse,
      ownedItemHashes,
      plugSetHashes
    } = this.props;
    const { nodePath } = this.state;

    let fullNodePath = nodePath;
    if (nodePath.length === 0 && openedPresentationHash) {
      let currentHash = openedPresentationHash;
      fullNodePath = [currentHash];
      let node = defs.PresentationNode.get(currentHash);
      while (node.parentNodeHashes.length) {
        nodePath.unshift(node.parentNodeHashes[0]);
        currentHash = node.parentNodeHashes[0];
        node = defs.PresentationNode.get(currentHash);
      }
      fullNodePath.unshift(presentationNodeHash);
    }

    const collectionCounts = countCollectibles(defs, presentationNodeHash, profileResponse);

    return (
      <>
        <PresentationNode
          collectionCounts={collectionCounts}
          presentationNodeHash={presentationNodeHash}
          defs={defs}
          profileResponse={profileResponse}
          buckets={buckets}
          ownedItemHashes={ownedItemHashes}
          path={fullNodePath}
          onNodePathSelected={this.onNodePathSelected}
          parents={[]}
        />

        {buckets &&
          plugSetHashes &&
          Array.from(plugSetHashes).map((plugSetHash) => (
            <PlugSet
              key={plugSetHash}
              defs={defs}
              buckets={buckets}
              plugSetHash={Number(plugSetHash)}
              items={itemsForPlugSet(profileResponse, Number(plugSetHash))}
              path={fullNodePath}
              onNodePathSelected={this.onNodePathSelected}
            />
          ))}
      </>
    );
  }

  // TODO: onNodeDeselected!
  private onNodePathSelected = (nodePath: number[]) => {
    this.setState({
      nodePath
    });
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
  if (presentationNodeDef.redacted) {
    return { [node]: { acquired: 0, visible: 0 } };
  }
  if (
    presentationNodeDef.children.collectibles &&
    presentationNodeDef.children.collectibles.length
  ) {
    const collectibleDefs = presentationNodeDef.children.collectibles.map((c) =>
      defs.Collectible.get(c.collectibleHash)
    );

    // TODO: class based on displayStyle
    const visibleCollectibles = count(
      collectibleDefs,
      (c) =>
        c &&
        !(getCollectibleState(c, profileResponse) & DestinyCollectibleState.Invisible) &&
        !c.redacted
    );
    const acquiredCollectibles = count(
      collectibleDefs,
      (c) =>
        c &&
        !(getCollectibleState(c, profileResponse) & DestinyCollectibleState.NotAcquired) &&
        !c.redacted
    );

    // add an entry for self and return
    return {
      [node]: {
        acquired: acquiredCollectibles,
        visible: visibleCollectibles
      }
    };
  } else if (presentationNodeDef.children.records && presentationNodeDef.children.records.length) {
    const recordDefs = presentationNodeDef.children.records.map((c) =>
      defs.Record.get(c.recordHash)
    );

    // TODO: class based on displayStyle
    const visibleCollectibles = count(
      recordDefs,
      (c) =>
        c &&
        !(getRecordComponent(c, profileResponse).state & DestinyRecordState.Invisible) &&
        !c.redacted
    );
    const acquiredCollectibles = count(
      recordDefs,
      (c) =>
        c &&
        Boolean(getRecordComponent(c, profileResponse).state & DestinyRecordState.RecordRedeemed) &&
        !c.redacted
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

function itemsForPlugSet(profileResponse: DestinyProfileResponse, plugSetHash: number) {
  return profileResponse.profilePlugSets.data.plugs[plugSetHash].concat(
    Object.values(profileResponse.characterPlugSets.data).flatMap((d) => d.plugs[plugSetHash])
  );
}
