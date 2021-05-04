import { DimPlug } from 'app/inventory/item-types';

export interface DimAdjustedItemPlug {
  /** A plug selected for stat comparison */
  [socketIndex: number]: DimPlug;
}

export interface DimAdjustedPlugs {
  /** A collection of selected plugs for comparison, keyed by item instance ID */
  [itemId: string]: DimAdjustedItemPlug;
}

export interface DimAdjustedItemStat {
  /** An updated stat value when plug effects are being compared */
  [statHash: number]: number;
  [statId: string]: number;
}

export interface DimAdjustedStats {
  /** A collection of adjusted stat values, keyed by item instance ID */
  [itemId: string]: DimAdjustedItemStat;
}
