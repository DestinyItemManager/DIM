import { DimItem } from 'app/inventory/item-types';
import React from 'react';

export const enum SortDirection {
  ASC,
  DESC,
}

export type Value = string | number | boolean | undefined | null;

/**
 * Columns can optionally belong to a column group - if so, they're shown/hidden as a group.
 */
export interface ColumnGroup {
  id: string;
  header: React.ReactNode;
  dropdownLabel?: React.ReactNode;
}

// TODO: column groupings?
// TODO: custom configs like the total column?
// prop methods make this invariant over V, so disable the rule here
/* eslint-disable @typescript-eslint/method-signature-style */
export interface ColumnDefinition<V extends Value = Value> {
  /** Unique ID for this column. */
  id: string;
  /** Whether to start with descending or ascending sort. Default: 'asc' */
  defaultSort?: SortDirection;
  /** This column can't be hidden. Default: false (column can be hidden). */
  noHide?: boolean;
  /** This column can't be sorted. Default: false (column can be sorted). */
  noSort?: boolean;
  /** A CSS grid expression for the width of the cell. Default: min-content. */
  gridWidth?: string;
  /** Header renderer */
  header: React.ReactNode;
  /**
   * If the column-toggler dropdown needs a more verbose label when the header is only an icon `e.g.Power or Locked`, that label content goes here
   */
  dropdownLabel?: React.ReactNode;
  /** Columns can optionally belong to a column group - if so, they're shown/hidden as a group. */
  columnGroup?: ColumnGroup;
  /** The raw value of the column for this item. */
  value(item: DimItem): V;
  /** Renderer for the cell. Default: value */
  cell?(value: V, item: DimItem): React.ReactNode;
  /** A generator for search terms matching this item. Default: No filtering. */
  filter?(value: V, item: DimItem): string | undefined;
  /** A custom sort function. Default: Something reasonable. */
  sort?(firstValue: V, secondValue: V): 0 | 1 | -1;
}

export interface Row {
  item: DimItem;
  values: { [columnId: string]: Value };
}

export interface ColumnSort {
  columnId: string;
  sort: SortDirection;
}

export type ColumnWithStat = ColumnDefinition & { statHash: number };
