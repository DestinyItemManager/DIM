import { act, renderHook } from '@testing-library/react';
import { SortDirection, useTableColumnSorts } from './table-columns';

describe('useTableColumnSorts', () => {
  it('use cases', () => {
    const { result } = renderHook(() => useTableColumnSorts([]));

    // Toggle on one column
    act(() => {
      const [_columnSorts, toggleColumnSort] = result.current;
      toggleColumnSort('one', false, SortDirection.ASC)();
    });

    let [columnSorts] = result.current;
    expect(columnSorts).toEqual([{ columnId: 'one', sort: SortDirection.ASC }]);

    // Now toggle that same column
    act(() => {
      const [_columnSorts, toggleColumnSort] = result.current;
      toggleColumnSort('one', false, SortDirection.ASC)();
    });

    // Now we should see the sort inverted
    [columnSorts] = result.current;
    expect(columnSorts).toEqual([{ columnId: 'one', sort: SortDirection.DESC }]);

    // Now toggle another column
    act(() => {
      const [_columnSorts, toggleColumnSort] = result.current;
      toggleColumnSort('two', false, SortDirection.ASC)();
    });

    // Now we should see only the second column
    [columnSorts] = result.current;
    expect(columnSorts).toEqual([{ columnId: 'two', sort: SortDirection.ASC }]);

    // Toggle the first column, but with additive=true
    act(() => {
      const [_columnSorts, toggleColumnSort] = result.current;
      toggleColumnSort('one', true, SortDirection.ASC)();
    });

    // Now we should see both columns
    [columnSorts] = result.current;
    expect(columnSorts).toEqual([
      { columnId: 'two', sort: SortDirection.ASC },
      { columnId: 'one', sort: SortDirection.ASC },
    ]);

    // Toggle a third column with additive=false, but this one has a different default sort
    act(() => {
      const [_columnSorts, toggleColumnSort] = result.current;
      toggleColumnSort('three', false, SortDirection.DESC)();
    });

    // Now we should see only the third column, but with its default sort
    [columnSorts] = result.current;
    expect(columnSorts).toEqual([{ columnId: 'three', sort: SortDirection.DESC }]);
  });
});
