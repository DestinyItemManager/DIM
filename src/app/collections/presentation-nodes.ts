import {
  DestinyPresentationNodeDefinition,
  DestinyRecordDefinition,
  DestinyRecordComponent,
  DestinyMetricDefinition,
  DestinyMetricComponent,
  DestinyCollectibleState,
  DestinyCollectibleDefinition,
} from 'bungie-api-ts/destiny2';
import { DimItem } from 'app/inventory/item-types';

export interface DimPresentationNode {
  nodeDef: DestinyPresentationNodeDefinition;
  visible: number;
  acquired: number;
  childPresentationNodes: DimPresentationNode[];
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
  record?: DestinyRecordComponent;
  recordDef: DestinyRecordDefinition;
  tracked: TrackedRecordState;
}

export interface DimMetric {
  metric?: DestinyMetricComponent;
  metricDef: DestinyMetricDefinition;
}

export interface DimCollectible {
  state?: DestinyCollectibleState;
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
export function toPresentationNodeTree(): DimPresentationNode {}

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
