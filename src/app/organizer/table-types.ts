import { SortDirection } from 'app/dim-ui/table-columns';
import { DimItem } from 'app/inventory/item-types';
import { CsvValue } from 'app/utils/csv';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React from 'react';

export { SortDirection, type ColumnSort } from 'app/dim-ui/table-columns';

export type Value = string | number | boolean | undefined;

/**
 * Columns can optionally belong to a column group - if so, they're shown/hidden as a group.
 */
export interface ColumnGroup {
  id: string;
  header: React.ReactNode;
  dropdownLabel?: React.ReactNode;
}

export type CSVColumn = [name: string, value: CsvValue];

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
  /** Renderer for the cell. Default: value. If the value is numeric we may pass max and min in. */
  cell?(value: V, item: DimItem, context?: { max?: number; min?: number }): React.ReactNode;
  /** A generator for search terms matching this item. Default: No filtering. */
  filter?(value: V, item: DimItem): string | undefined;
  /** A custom sort function. Default: Something reasonable. */
  sort?(this: void, firstValue: V, secondValue: V): 0 | 1 | -1;
  /**
   * a column def needs to exist all the time, so enabledness setting is aware of it,
   * but sometimes a custom stat should be limited to only displaying for a certain class
   */
  limitToClass?: DestinyClass;

  /** An optional class name to apply to the cell. */
  className?: string;
  /** An optional class name to apply to the header. */
  headerClassName?: string;

  /**
   * A name for this column when it is output as CSV. This will reuse the value
   * function as-is. We could reuse the header, but that's localized, while
   * historically our CSV column names haven't been.
   *
   * Alternately, provide a function to override both the column name and the
   * value, or emit multiple columns at once. This is mostly to achieve
   * compatibility with the existing CSV format, but sometimes it's used to
   * output complex data for CSV. For example, perks are output as multiple
   * columns.
   */
  csv?:
    | string
    | {
        bivarianceHack(value: V, item: DimItem, spreadsheetContext: SpreadsheetContext): CSVColumn;
      }['bivarianceHack'];
}

export interface SpreadsheetContext {
  storeNamesById: { [key: string]: string };
}

/**
 * A row is the calculated values for a single item, for all columns.
 */
export interface Row {
  item: DimItem;
  values: { [columnId: string]: Value };
}

/**
 * Additional context about the table as a whole (all the rows in it.)
 */
export interface TableContext {
  /**
   * For numeric-valued columns, the min and max values across all rows.
   */
  minMaxValues: { [columnId: string]: { max: number; min: number } | undefined };
}

export type ColumnWithStat = ColumnDefinition & { statHash: number };
