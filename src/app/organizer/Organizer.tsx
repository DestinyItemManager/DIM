/* eslint-disable react/jsx-key */
import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { DimItem } from 'app/inventory/item-types';
import { RootState } from 'app/store/reducers';
import { useTable, Column } from 'react-table';
import { D2StoresService } from 'app/inventory/d2-stores';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { useSubscription } from 'app/utils/hooks';
import { queueAction } from 'app/inventory/action-queue';
import { refresh$ } from 'app/shell/refresh';
import { Loading } from 'app/dim-ui/Loading';
import { createSelector } from 'reselect';
import { storesSelector } from 'app/inventory/reducer';
import BungieImage from 'app/dim-ui/BungieImage';
import { AppIcon, powerIndicatorIcon } from 'app/shell/icons';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  items: DimItem[];
}

function mapStateToProps() {
  const allItemsSelector = createSelector(storesSelector, (stores) =>
    stores.flatMap((s) => s.items).filter((i) => i.comparable && i.primStat)
  );
  return (state: RootState): StoreProps => ({
    items: allItemsSelector(state)
  });
}

type Props = ProvidedProps & StoreProps;

function Organizer({ account, items }: Props) {
  // https://github.com/tannerlinsley/react-table/blob/master/docs/api.md
  const columns: Column<DimItem>[] = useMemo(
    () => [
      {
        Header: 'Icon',
        accessor: 'icon',
        Cell: ({ cell: { value } }) => <BungieImage src={value} />
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

  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data: items
  });

  useEffect(() => {
    if (!items.length) {
      D2StoresService.getStoresStream(account);
    }
  });

  useSubscription(() =>
    refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores()))
  );

  if (!items.length) {
    return <Loading />;
  }

  // Render the UI for your table
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
              {row.cells.map((cell) => {
                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default connect<StoreProps>(mapStateToProps)(Organizer);
