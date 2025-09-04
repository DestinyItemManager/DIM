import { useCallback, useState } from 'react';

export interface ColumnSort {
  readonly columnId: string;
  readonly sort: SortDirection;
}

export const enum SortDirection {
  ASC,
  DESC,
}

export function useTableColumnSorts(defaultSorts: ColumnSort[]) {
  const [columnSorts, setColumnSorts] = useState<ColumnSort[]>(defaultSorts);

  // Toggle sorting of columns. If shift is held (the additive param), adds this column to the sort.
  const toggleColumnSort = useCallback(
    (columnId: string, additive: boolean, defaultDirection: SortDirection = SortDirection.ASC) =>
      () =>
        setColumnSorts((sorts) => {
          const newColumnSorts = additive
            ? Array.from(sorts) // start with a copy of the existing sorts
            : sorts.filter((s) => s.columnId === columnId); // otherwise just this column
          const index = newColumnSorts.findIndex((s) => s.columnId === columnId);
          if (index >= 0) {
            // This column is already in the sort, flip the direction
            const columnSort = newColumnSorts[index];
            if (columnSort.sort === defaultDirection || !additive) {
              newColumnSorts[index] = {
                ...columnSort,
                sort:
                  columnSort.sort === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC,
              };
            } else {
              newColumnSorts.splice(index, 1); // remove the column from the sort
            }
          } else {
            // Add the column to the sort
            newColumnSorts.push({
              columnId: columnId,
              sort: defaultDirection,
            });
          }
          return newColumnSorts;
        }),
    [],
  );

  return [columnSorts, toggleColumnSort] as const;
}
