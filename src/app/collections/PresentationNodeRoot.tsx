import React, { useState } from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import PresentationNode from './PresentationNode';
import {
  DestinyProfileResponse,
  DestinyCollectibleState,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import { getCollectibleState } from './Collectible';
import { count } from '../utils/util';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import PlugSet from './PlugSet';
import _ from 'lodash';
import Record, { getRecordComponent } from './Record';
import { getMetricComponent } from './Metric';
import { itemsForPlugSet } from './plugset-helpers';
import { TRIUMPHS_ROOT_NODE } from 'app/search/d2-known-values';

interface Props {
  presentationNodeHash: number;
  openedPresentationHash?: number;
  ownedItemHashes?: Set<number>;
  profileResponse: DestinyProfileResponse;
  buckets?: InventoryBuckets;
  defs: D2ManifestDefinitions;

  /** Whether to show extra plugsets */
  showPlugSets?: boolean;
}

/**
 * The root for an expandable presentation node tree.
 */
export default function PresentationNodeRoot({
  presentationNodeHash,
  openedPresentationHash,
  defs,
  buckets,
  profileResponse,
  ownedItemHashes,
  showPlugSets,
}: Props) {
  const [nodePath, setNodePath] = useState<number[]>([]);

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

  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || undefined;

  const plugSetCollections = [
    // Emotes
    { hash: 1155321287, displayItem: 3960522253 },
    // Projections
    { hash: 499268600, displayItem: 2544954628 },
  ];

  return (
    <>
      {presentationNodeHash === TRIUMPHS_ROOT_NODE && trackedRecordHash !== undefined && (
        <div className="progress-for-character">
          <div className="records">
            <Record
              recordHash={trackedRecordHash}
              defs={defs}
              profileResponse={profileResponse}
              completedRecordsHidden={false}
              redactedRecordsRevealed={true}
            />
          </div>
        </div>
      )}

      <PresentationNode
        collectionCounts={collectionCounts}
        presentationNodeHash={presentationNodeHash}
        defs={defs}
        profileResponse={profileResponse}
        buckets={buckets}
        ownedItemHashes={ownedItemHashes}
        path={fullNodePath}
        onNodePathSelected={setNodePath}
        parents={[]}
      />

      {buckets &&
        showPlugSets &&
        plugSetCollections.map((plugSetCollection) => (
          <PlugSet
            key={plugSetCollection.hash}
            defs={defs}
            buckets={buckets}
            plugSetCollection={plugSetCollection}
            items={itemsForPlugSet(profileResponse, Number(plugSetCollection.hash))}
            path={fullNodePath}
            onNodePathSelected={setNodePath}
          />
        ))}
    </>
  );
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
  if (presentationNodeDef.children.collectibles?.length) {
    const collectibleDefs = presentationNodeDef.children.collectibles.map((c) =>
      defs.Collectible.get(c.collectibleHash)
    );

    // TODO: class based on displayStyle
    const visibleCollectibles = count(collectibleDefs, (c) => {
      const collectibleState = c && getCollectibleState(c, profileResponse);
      return Boolean(
        collectibleState !== undefined &&
          !(collectibleState & DestinyCollectibleState.Invisible) &&
          !c.redacted
      );
    });
    const acquiredCollectibles = count(collectibleDefs, (c) => {
      const collectibleState = c && getCollectibleState(c, profileResponse);
      return Boolean(
        collectibleState !== undefined &&
          !(collectibleState & DestinyCollectibleState.NotAcquired) &&
          !c.redacted
      );
    });

    // add an entry for self and return
    return {
      [node]: {
        acquired: acquiredCollectibles,
        visible: visibleCollectibles,
      },
    };
  } else if (presentationNodeDef.children.records?.length) {
    const recordDefs = presentationNodeDef.children.records.map((c) =>
      defs.Record.get(c.recordHash)
    );

    // TODO: class based on displayStyle
    const visibleCollectibles = count(recordDefs, (c) => {
      const record = c && getRecordComponent(c, profileResponse);
      return Boolean(
        record !== undefined && !(record.state & DestinyRecordState.Invisible) && !c.redacted
      );
    });
    const acquiredCollectibles = count(recordDefs, (c) => {
      const record = c && getRecordComponent(c, profileResponse);
      return Boolean(
        record !== undefined && record.state & DestinyRecordState.RecordRedeemed && !c.redacted
      );
    });

    // add an entry for self and return
    return {
      [node]: {
        acquired: acquiredCollectibles,
        visible: visibleCollectibles,
      },
    };
  } else if (presentationNodeDef.children.metrics?.length) {
    const metricDefs = presentationNodeDef.children.metrics.map((c) =>
      defs.Metric.get(c.metricHash)
    );

    // TODO: class based on displayStyle
    const visible = count(metricDefs, (m) => {
      const metric = m && getMetricComponent(m, profileResponse);
      return Boolean(metric !== undefined && !metric.invisible);
    });
    const acquired = count(metricDefs, (m) => {
      const metric = m && getMetricComponent(m, profileResponse);
      return Boolean(
        metric !== undefined && !metric.invisible && metric.objectiveProgress.complete
      );
    });
    return {
      [node]: {
        acquired,
        visible,
      },
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
        visible,
      },
    });
    return ret;
  }
}
