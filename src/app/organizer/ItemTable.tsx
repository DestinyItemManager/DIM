/* eslint-disable react/jsx-key, react/prop-types */
import React, { useMemo } from 'react';
import { DimItem } from 'app/inventory/item-types';
import { useTable, Column } from 'react-table';
import BungieImage from 'app/dim-ui/BungieImage';
import { AppIcon, powerIndicatorIcon } from 'app/shell/icons';
import styles from './ItemTable.m.scss';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { SelectionTreeNode } from './ItemTypeSelector';
import _ from 'lodash';

function ItemTable({ items, selection }: { items: DimItem[]; selection: SelectionTreeNode[] }) {
  // https://github.com/tannerlinsley/react-table/blob/master/docs/api.md
  const columns: Column<DimItem>[] = useMemo(
    () => [
      {
        Header: 'Icon',
        accessor: 'icon',
        Cell: ({ cell: { value }, row: { original: item } }) => (
          <ItemPopupTrigger item={item}>
            {(ref, onClick) => (
              <div ref={ref} onClick={onClick}>
                <BungieImage src={value} className={styles.icon} />
              </div>
            )}
          </ItemPopupTrigger>
        )
      },
      {
        Header: 'Name',
        accessor: 'name'
      },
      {
        Header: 'Type',
        accessor: 'typeName'
      },
      {
        id: 'power',
        Header: () => (
          <>
            <AppIcon icon={powerIndicatorIcon} />
            Power
          </>
        ),
        accessor: (item) => item.primStat?.value
      }
    ],
    []
  );

  const terminal = Boolean(_.last(selection)?.terminal);
  const categoryHashes = selection.map((s) => s.itemCategoryHash).filter((h) => h > 0);
  items = terminal
    ? items.filter((item) => categoryHashes.every((h) => item.itemCategoryHashes.includes(h)))
    : [];

  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data: items
  });

  if (!terminal) {
    return null;
  }

  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default React.memo(ItemTable);
