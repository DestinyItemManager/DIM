import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { ItemFilter } from 'app/search/filter-types';
import { count } from 'app/utils/util';
import {
  DestinyCollectibleDefinition,
  DestinyCollectibleState,
  DestinyCraftableComponent,
  DestinyDisplayPropertiesDefinition,
  DestinyMetricComponent,
  DestinyMetricDefinition,
  DestinyPresentationNodeCollectibleChildEntry,
  DestinyPresentationNodeCraftableChildEntry,
  DestinyPresentationNodeDefinition,
  DestinyPresentationNodeMetricChildEntry,
  DestinyPresentationNodeRecordChildEntry,
  DestinyProfileResponse,
  DestinyRecordComponent,
  DestinyRecordDefinition,
  DestinyRecordState,
  DestinyScope,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';

export interface DimPresentationNodeLeaf {
  records?: DimRecord[];
  collectibles?: DimCollectible[];
  metrics?: DimMetric[];
  craftables?: DimCraftable[];
}

export interface DimPresentationNode extends DimPresentationNodeLeaf {
  nodeDef: DestinyPresentationNodeDefinition;
  visible: number;
  acquired: number;
  childPresentationNodes?: DimPresentationNode[];
}

export interface DimRecord {
  recordComponent: DestinyRecordComponent;
  recordDef: DestinyRecordDefinition;
  trackedInGame: boolean;
}

export interface DimMetric {
  metricComponent: DestinyMetricComponent;
  metricDef: DestinyMetricDefinition;
}

export interface DimCollectible {
  state: DestinyCollectibleState;
  collectibleDef: DestinyCollectibleDefinition;
  item: DimItem;
}

export interface DimCraftable {
  // to-do: determine what interesting information we can share about a craftable
  item: DimItem;
  canCraftThis: boolean;
  canCraftAllPlugs: boolean;
}

export interface DimPresentationNodeSearchResult extends DimPresentationNodeLeaf {
  /** The sequence of nodes from outside to inside ending in the leaf node that contains our matching records/collectibles/metrics */
  path: DimPresentationNode[];
}

/** Process the live data into DIM types that collect everything in one place and can be filtered/searched. */
export function toPresentationNodeTree(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets | undefined,
  profileResponse: DestinyProfileResponse,
  node: number
): DimPresentationNode | null {
  const presentationNodeDef = defs.PresentationNode.get(node);
  if (presentationNodeDef.redacted) {
    return null;
  }
  if (buckets && presentationNodeDef.children.collectibles?.length) {
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
      Boolean(r.recordComponent.state & DestinyRecordState.RecordRedeemed)
    );

    // add an entry for self and return
    return {
      nodeDef: presentationNodeDef,
      visible,
      acquired,
      records,
    };
  } else if (buckets && presentationNodeDef.children.craftables?.length) {
    const craftables = toCraftables(
      defs,
      buckets,
      profileResponse,
      presentationNodeDef.children.craftables
    );

    const visible = craftables.length;

    const acquired = count(craftables, (c) => c.canCraftThis);

    // add an entry for self and return
    return {
      nodeDef: presentationNodeDef,
      visible,
      acquired,
      craftables,
    };
  } else if (presentationNodeDef.children.metrics?.length) {
    const metrics = toMetrics(defs, profileResponse, presentationNodeDef.children.metrics);

    // TODO: class based on displayStyle
    const visible = metrics.length;
    const acquired = count(metrics, (m) => Boolean(m.metricComponent.objectiveProgress.complete));
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

// TODO: how to flatten this down to individual category trees
// TODO: how to handle simple searches plus bigger queries
// TODO: this uses the entire search field as one big string search. no "and". no fun.
export function filterPresentationNodesToSearch(
  node: DimPresentationNode,
  searchQuery: string,
  filterItems: ItemFilter,
  completedRecordsHidden: boolean,
  path: DimPresentationNode[] = [],
  defs: D2ManifestDefinitions
): DimPresentationNodeSearchResult[] {
  // If the node itself matches
  if (searchDisplayProperties(node.nodeDef.displayProperties, searchQuery)) {
    // Return this whole node
    return [
      {
        path: [...path, node],
      },
    ];
  }

  if (node.childPresentationNodes) {
    // TODO: build up the tree?
    return node.childPresentationNodes.flatMap((c) =>
      filterPresentationNodesToSearch(
        c,
        searchQuery,
        filterItems,
        completedRecordsHidden,
        [...path, node],
        defs
      )
    );
  }

  if (node.collectibles) {
    const collectibles = node.collectibles.filter((c) => filterItems(c.item));

    return collectibles.length
      ? [
          {
            path: [...path, node],
            collectibles,
          },
        ]
      : [];
  }

  if (node.records) {
    const records = node.records.filter(
      (r) =>
        !(
          completedRecordsHidden &&
          Boolean(r.recordComponent.state & DestinyRecordState.RecordRedeemed)
        ) &&
        (searchDisplayProperties(r.recordDef.displayProperties, searchQuery) ||
          searchRewards(r.recordDef, searchQuery, defs))
    );

    return records.length
      ? [
          {
            path: [...path, node],
            records,
          },
        ]
      : [];
  }

  if (node.metrics) {
    const metrics = node.metrics.filter((r) =>
      searchDisplayProperties(r.metricDef.displayProperties, searchQuery)
    );

    return metrics.length
      ? [
          {
            path: [...path, node],
            metrics,
          },
        ]
      : [];
  }

  if (node.craftables) {
    const craftables = node.craftables.filter((c) => filterItems(c.item));

    return craftables.length
      ? [
          {
            path: [...path, node],
            craftables,
          },
        ]
      : [];
  }

  return [];
}

export function searchDisplayProperties(
  displayProperties: DestinyDisplayPropertiesDefinition,
  searchQuery: string
) {
  return (
    displayProperties.name.toLowerCase().includes(searchQuery) ||
    displayProperties.description.toLowerCase().includes(searchQuery)
  );
}
export function searchRewards(
  record: DestinyRecordDefinition,
  searchQuery: string,
  defs: D2ManifestDefinitions
) {
  return record.rewardItems.some((ri) =>
    searchDisplayProperties(defs.InventoryItem.get(ri.itemHash).displayProperties, searchQuery)
  );
}

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
        collectibleDef.itemHash,
        undefined,
        undefined,
        undefined,
        profileResponse.profileRecords.data
      );
      if (!item) {
        return null;
      }
      item.missingSockets = false;
      return {
        state,
        collectibleDef,
        item,
        owned: false,
      };
    })
  );
}

function toRecords(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse,
  recordHashes: DestinyPresentationNodeRecordChildEntry[]
): DimRecord[] {
  return _.compact(
    recordHashes.map(({ recordHash }) => toRecord(defs, profileResponse, recordHash))
  );
}

export function toRecord(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse,
  recordHash: number
) {
  const recordDef = defs.Record.get(recordHash);
  if (!recordDef) {
    return null;
  }
  const record = getRecordComponent(recordDef, profileResponse);

  if (record === undefined || record.state & DestinyRecordState.Invisible || recordDef.redacted) {
    return null;
  }

  const trackedInGame = profileResponse?.profileRecords?.data?.trackedRecordHash === recordHash;

  return {
    recordComponent: record,
    recordDef,
    trackedInGame,
  };
}

function toCraftables(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileResponse: DestinyProfileResponse,
  craftableChildren: DestinyPresentationNodeCraftableChildEntry[]
): DimCraftable[] {
  return _.compact(
    _.sortBy(craftableChildren, (c) => c.nodeDisplayPriority).map((c) =>
      toCraftable(defs, buckets, profileResponse, c.craftableItemHash)
    )
  );
}

function toCraftable(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileResponse: DestinyProfileResponse,
  itemHash: number
): DimCraftable | undefined {
  const item = makeFakeItem(defs, buckets, profileResponse.itemComponents, itemHash);

  if (!item) {
    return;
  }

  const info = getCraftableInfo(item.hash, profileResponse);
  if (!info?.visible) {
    return;
  }

  const canCraftThis = info.failedRequirementIndexes.length === 0;
  const canCraftAllPlugs = info.sockets.every((s) =>
    s.plugs.every((p) => p.failedRequirementIndexes.length === 0)
  );

  return { item, canCraftThis, canCraftAllPlugs };
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

      if (!metric || metric.invisible || metricDef.redacted) {
        return null;
      }

      return {
        metricComponent: metric,
        metricDef,
      };
    })
  );
}

function getRecordComponent(
  recordDef: DestinyRecordDefinition,
  profileResponse: DestinyProfileResponse
): DestinyRecordComponent | undefined {
  return recordDef.scope === DestinyScope.Character
    ? profileResponse.characterRecords?.data
      ? Object.values(profileResponse.characterRecords.data)[0].records[recordDef.hash]
      : undefined
    : profileResponse.profileRecords?.data?.records[recordDef.hash];
}

function getCraftableInfo(itemHash: number, profileResponse: DestinyProfileResponse) {
  if (!profileResponse.characterCraftables?.data) {
    return;
  }
  const allCharCraftables: (DestinyCraftableComponent | undefined)[] = Object.values(
    profileResponse.characterCraftables.data
  ).map((d) => d.craftables[itemHash]);

  // try to find a character on whom this item is visible
  return allCharCraftables.find((c) => c?.visible === true) ?? allCharCraftables[0];
}

export function getCollectibleState(
  collectibleDef: DestinyCollectibleDefinition,
  profileResponse: DestinyProfileResponse
) {
  return collectibleDef.scope === DestinyScope.Character
    ? profileResponse.characterCollectibles?.data
      ? _.minBy(
          // Find the version of the collectible that's unlocked, if any
          Object.values(profileResponse.characterCollectibles.data)
            .map((c) => c.collectibles[collectibleDef.hash].state)
            .filter((s) => s !== undefined),
          (state) => state & DestinyCollectibleState.NotAcquired
        )
      : undefined
    : profileResponse.profileCollectibles?.data?.collectibles[collectibleDef.hash]?.state;
}

function getMetricComponent(
  metricDef: DestinyMetricDefinition,
  profileResponse: DestinyProfileResponse
): DestinyMetricComponent | undefined {
  return profileResponse.metrics?.data?.metrics[metricDef.hash];
}
