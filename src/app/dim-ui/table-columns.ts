import { useCallback, useState } from 'react';

export interface ColumnSort {
  columnId: string;
  sort: SortDirection;
}

export const enum SortDirection {
  ASC,
  DESC,
}

export function useTableColumnSorts(defaultSorts: ColumnSort[]) {
  const [columnSorts, setColumnSorts] = useState<ColumnSort[]>(defaultSorts);

  // Toggle sorting of columns. If shift is held, adds this column to the sort.
  const toggleColumnSort = useCallback(
    (columnId: string, inverted: boolean, defaultDirection?: SortDirection) => () => {
      setColumnSorts((sorts) => {
        const newColumnSorts = inverted
          ? Array.from(sorts)
          : sorts.filter((s) => s.columnId === columnId);
        let found = false;
        let index = 0;
        for (const columnSort of newColumnSorts) {
          if (columnSort.columnId === columnId) {
            newColumnSorts[index] = {
              ...columnSort,
              sort: columnSort.sort === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC,
            };
            found = true;
            break;
          }
          index++;
        }
        if (!found) {
          newColumnSorts.push({
            columnId: columnId,
            sort: defaultDirection || SortDirection.ASC,
          });
        }
        return newColumnSorts;
      });
    },
    [],
  );

  return [columnSorts, toggleColumnSort] as const;
}
