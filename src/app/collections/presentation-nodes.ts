import {
  DestinyPresentationNodeDefinition,
  DestinyRecordDefinition,
  DestinyRecordComponent,
  DestinyMetricDefinition,
  DestinyMetricComponent,
  DestinyCollectibleState,
  DestinyCollectibleDefinition,
  DestinyProfileResponse,
  DestinyScope,
  DestinyPresentationNodeCollectibleChildEntry,
  DestinyPresentationNodeRecordChildEntry,
  DestinyRecordState,
  DestinyPresentationNodeMetricChildEntry,
} from 'bungie-api-ts/destiny2';
import { DimItem } from 'app/inventory/item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import _ from 'lodash';
import { count } from 'app/utils/util';

export interface DimPresentationNode {
  nodeDef: DestinyPresentationNodeDefinition;
  visible: number;
  acquired: number;
  childPresentationNodes?: DimPresentationNode[];
  records?: DimRecord[];
  collectibles?: DimCollectible[];
  metrics?: DimMetric[];
}

export const enum TrackedRecordState {
  Untracked,
  TrackedInGame,
  TrackedInDim,
}

export interface DimRecord {
  record: DestinyRecordComponent;
  recordDef: DestinyRecordDefinition;
  tracked: TrackedRecordState; // TODO: not needed here?
}

export interface DimMetric {
  metric: DestinyMetricComponent;
  metricDef: DestinyMetricDefinition;
}

export interface DimCollectible {
  state: DestinyCollectibleState;
  collectibleDef: DestinyCollectibleDefinition;
  item: DimItem;
  owned: boolean; // TODO: not needed here?
}

export interface DimPresentationNodeSearchResult {
  /** The sequence of nodes from outside to inside ending in the leaf node that contains our matching records/collectibles/metrics */
  path: DimPresentationNode[];
  records?: DimRecord[];
  collectibles?: DimCollectible[];
  metrics?: DimMetric[];
}

/** Process the live data into DIM types that collect everything in one place and can be filtered/searched. */
export function toPresentationNodeTree(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileResponse: DestinyProfileResponse,
  node: number
): DimPresentationNode | null {
  const presentationNodeDef = defs.PresentationNode.get(node);
  if (presentationNodeDef.redacted) {
    return null;
  }
  if (presentationNodeDef.children.collectibles?.length) {
    const collectibles = toCollectibles(
      defs,
      buckets,
      profileResponse,
      presentationNodeDef.children.collectibles
    );
    const visible = collectibles.length;
    const acquired = count(collectibles, (c) => !(c.state & DestinyCollectibleState.NotAcquired));

    // add an entry for self and return
    return {
      nodeDef: presentationNodeDef,
      visible,
      acquired,
      collectibles,
    };
  } else if (presentationNodeDef.children.records?.length) {
    const records = toRecords(defs, profileResponse, presentationNodeDef.children.records);
    const visible = records.length;
    const acquired = count(records, (r) =>
      Boolean(r.record.state & DestinyRecordState.RecordRedeemed)
    );

    // add an entry for self and return
    return {
      nodeDef: presentationNodeDef,
      visible,
      acquired,
      records,
    };
  } else if (presentationNodeDef.children.metrics?.length) {
    const metrics = toMetrics(defs, profileResponse, presentationNodeDef.children.metrics);

    // TODO: class based on displayStyle
    const visible = metrics.length;
    const acquired = count(metrics, (m) => Boolean(m.metric.objectiveProgress.complete));
    return {
      nodeDef: presentationNodeDef,
      visible,
      acquired,
      metrics,
    };
  } else {
    // call for all children, then add 'em up
    const children: DimPresentationNode[] = [];
    let acquired = 0;
    let visible = 0;
    for (const presentationNode of presentationNodeDef.children.presentationNodes) {
      const subnode = toPresentationNodeTree(
        defs,
        buckets,
        profileResponse,
        presentationNode.presentationNodeHash
      );
      if (subnode) {
        acquired += subnode.acquired;
        visible += subnode.visible;
        children.push(subnode);
      }
    }
    return {
      nodeDef: presentationNodeDef,
      visible,
      acquired,
      childPresentationNodes: children,
    };
  }
}

/*
// TODO: how to flatten this down to individual category trees
// TODO: how to handle simple searches plus bigger queries
export function filterPresentationNodesToSearch(
  presentationNodeRoot: DimPresentationNode,
  searchQuery: string,
  filterItems: (item: DimItem) => boolean
): DimPresentationNodeSearchResult[] {
  return vendorGroups
    .map((group) => ({
      ...group,
      vendors: group.vendors
        .map((vendor) => ({
          ...vendor,
          items: vendor.def.displayProperties.name.toLowerCase().includes(searchQuery.toLowerCase())
            ? vendor.items
            : vendor.items.filter((i) => i.item && filterItems(i.item)),
        }))
        .filter((v) => v.items.length),
    }))
    .filter((g) => g.vendors.length);
}
*/

function toCollectibles(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileResponse: DestinyProfileResponse,
  collectibleHashes: DestinyPresentationNodeCollectibleChildEntry[]
): DimCollectible[] {
  return _.compact(
    collectibleHashes.map(({ collectibleHash }) => {
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
      const item = makeFakeItem(
        defs,
        buckets,
        profileResponse.itemComponents,
        collectibleDef.itemHash
      );
      return (
        item && {
          state,
          collectibleDef,
          item,
          owned: false,
        }
      );
    })
  );
}

function toRecords(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse,
  recordHashes: DestinyPresentationNodeRecordChildEntry[]
): DimRecord[] {
  return _.compact(
    recordHashes.map(({ recordHash }) => {
      const recordDef = defs.Record.get(recordHash);
      if (!recordDef) {
        return null;
      }
      const record = getRecordComponent(recordDef, profileResponse);

      if (
        record === undefined ||
        record.state & DestinyRecordState.Invisible ||
        recordDef.redacted
      ) {
        return null;
      }

      // TODO: incorporate dim sync data?
      const tracked =
        profileResponse?.profileRecords?.data?.trackedRecordHash === recordHash
          ? TrackedRecordState.TrackedInGame
          : TrackedRecordState.Untracked;

      return {
        record,
        recordDef,
        tracked,
      };
    })
  );
}

function toMetrics(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse,
  metricHashes: DestinyPresentationNodeMetricChildEntry[]
): DimMetric[] {
  return _.compact(
    metricHashes.map(({ metricHash }) => {
      const metricDef = defs.Metric.get(metricHash);
      if (!metricDef) {
        return null;
      }
      const metric = getMetricComponent(metricDef, profileResponse);

      if (!metric || metric.invisible) {
        return null;
      }

      return {
        metric,
        metricDef,
      };
    })
  );
}

export function getRecordComponent(
  recordDef: DestinyRecordDefinition,
  profileResponse: DestinyProfileResponse
): DestinyRecordComponent | undefined {
  return recordDef.scope === DestinyScope.Character
    ? profileResponse.characterRecords.data
      ? Object.values(profileResponse.characterRecords.data)[0].records[recordDef.hash]
      : undefined
    : profileResponse.profileRecords.data
    ? profileResponse.profileRecords.data.records[recordDef.hash]
    : undefined;
}

export function getCollectibleState(
  collectibleDef: DestinyCollectibleDefinition,
  profileResponse: DestinyProfileResponse
) {
  return collectibleDef.scope === DestinyScope.Character
    ? profileResponse.characterCollectibles.data
      ? _.minBy(
          // Find the version of the collectible that's unlocked, if any
          Object.values(profileResponse.characterCollectibles.data)
            .map((c) => c.collectibles[collectibleDef.hash].state)
            .filter((s) => s !== undefined),
          (state) => state & DestinyCollectibleState.NotAcquired
        )
      : undefined
    : profileResponse.profileCollectibles.data
    ? profileResponse.profileCollectibles.data.collectibles[collectibleDef.hash].state
    : undefined;
}

export function getMetricComponent(
  metricDef: DestinyMetricDefinition,
  profileResponse: DestinyProfileResponse
): DestinyMetricComponent | undefined {
  return profileResponse.metrics.data?.metrics[metricDef.hash];
}
