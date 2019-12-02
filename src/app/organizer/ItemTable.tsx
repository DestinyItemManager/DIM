/* eslint-disable react/jsx-key, react/prop-types */
import React, { useMemo, useState } from 'react';
import { DimItem } from 'app/inventory/item-types';
import {
  useTable,
  Column,
  useSortBy,
  ColumnInstance,
  UseSortByColumnProps,
  useRowSelect,
  Row,
  UseRowSelectRowProps,
  TableInstance,
  UseRowSelectInstanceProps
} from 'react-table';
import BungieImage from 'app/dim-ui/BungieImage';
import {
  AppIcon,
  powerIndicatorIcon,
  lockIcon,
  thumbsUpIcon,
  thumbsDownIcon
} from 'app/shell/icons';
import styles from './ItemTable.m.scss';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { SelectionTreeNode } from './ItemTypeSelector';
import _ from 'lodash';
import { getTag, DimItemInfo, getNotes, tagConfig } from 'app/inventory/dim-item-info';
import TagIcon from 'app/inventory/TagIcon';
import { source } from 'app/inventory/spreadsheets';
import ElementIcon from 'app/inventory/ElementIcon';
import { D2SeasonInfo } from 'app/inventory/d2-season-info';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { getRating } from 'app/item-review/reducer';
import { DtrRating } from 'app/item-review/dtr-api-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import { statWhiteList } from 'app/inventory/store/stats';
import { compareBy } from 'app/utils/comparators';
import { rarity } from 'app/shell/filters';
import ItemSockets from 'app/item-popup/ItemSockets';
import { faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import RatingIcon from 'app/inventory/RatingIcon';
import { loadingTracker } from 'app/shell/loading-tracker';
import { setItemState as d1SetItemState } from '../bungie-api/destiny1-api';
import { setLockState as d2SetLockState } from '../bungie-api/destiny2-api';
import { showNotification } from 'app/notifications/notifications';
import { t } from 'app/i18next-t';

const initialState = {
  sortBy: [{ id: 'name' }]
};

const getRowID = (item: DimItem) => item.id;

function ItemTable({
  items,
  selection,
  itemInfos,
  ratings,
  wishList
}: {
  items: DimItem[];
  selection: SelectionTreeNode[];
  itemInfos: { [key: string]: DimItemInfo };
  ratings: { [key: string]: DtrRating };
  wishList: {
    [key: string]: InventoryWishListRoll;
  };
}) {
  // TODO: Indicate equipped/owner? Not sure it's necessary.
  // TODO: maybe implement my own table component

  const terminal = Boolean(_.last(selection)?.terminal);
  items = useMemo(() => {
    const categoryHashes = selection.map((s) => s.itemCategoryHash).filter((h) => h > 0);
    return terminal
      ? items.filter((item) => categoryHashes.every((h) => item.itemCategoryHashes.includes(h)))
      : [];
  }, [items, terminal, selection]);

  // TODO: save in settings
  const [enabledColumns, setEnabledColumns] = useState([
    'selection',
    'icon',
    'name',
    'dmg',
    'power',
    'locked',
    'tag',
    'wishList',
    'rating',
    'stats',
    'notes'
  ]);

  // TODO: drop wishlist columns if no wishlist loaded
  // TODO: d1/d2 columns
  // TODO: special stat display? recoil, bars, etc

  // TODO: really gotta pass these in... need to figure out data dependencies
  // https://github.com/tannerlinsley/react-table/blob/master/docs/api.md
  const columns: Column<DimItem>[] = useMemo(() => {
    const hasWishList = !_.isEmpty(wishList);

    const statHashes: { [statHash: number]: DestinyDisplayPropertiesDefinition } = {};
    for (const item of items) {
      if (item.stats) {
        for (const stat of item.stats) {
          statHashes[stat.statHash] = stat.displayProperties;
        }
      }
    }

    const statColumns = _.sortBy(
      _.map(statHashes, (displayProperties, statHashStr) => {
        const statHash = parseInt(statHashStr, 10);
        return {
          id: `stat_${statHash}`,
          Header: () =>
            displayProperties.hasIcon ? (
              <BungieImage src={displayProperties.icon} />
            ) : (
              displayProperties.name
            ),
          statHash,
          accessor: (item: DimItem) => item.stats?.find((s) => s.statHash === statHash)?.value,
          sortType: 'basic',
          sortDescFirst: true
        };
      }),
      (s) => statWhiteList.indexOf(s.statHash)
    );

    const baseStatColumns = statColumns.map((column) => ({
      ...column,
      id: `base_${column.statHash}`,
      accessor: (item: DimItem) => item.stats?.find((s) => s.statHash === column.statHash)?.base
    }));

    const columns = [
      // Let's make a column for selection
      {
        id: 'selection',
        // The header can use the table's getToggleAllRowsSelectedProps method
        // to render a checkbox
        Header: ({ getToggleAllRowsSelectedProps }: UseRowSelectInstanceProps<DimItem>) => (
          <div>
            <input type="checkbox" {...getToggleAllRowsSelectedProps()} />
          </div>
        ),
        // The cell can use the individual row's getToggleRowSelectedProps method
        // to the render a checkbox
        Cell: ({ row }: { row: Row<DimItem> & UseRowSelectRowProps<DimItem> }) => (
          <div>
            <input type="checkbox" {...row.getToggleRowSelectedProps()} />
          </div>
        )
      },
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
        ),
        disableSortBy: true
      },
      {
        Header: 'Name',
        accessor: 'name'
      },
      {
        Header: 'Damage',
        accessor: 'dmg',
        Cell: ({ cell: { value } }) =>
          value ? <ElementIcon className={styles.element} element={value} /> : null
      },
      {
        id: 'power',
        Header: () => <AppIcon icon={powerIndicatorIcon} />,
        accessor: (item) => item.primStat?.value,
        sortDescFirst: true
      },
      {
        Header: () => <AppIcon icon={lockIcon} />,
        accessor: 'locked',
        Cell: ({ cell: { value } }) => (value ? <AppIcon icon={lockIcon} /> : null),
        sortType: 'basic',
        sortDescFirst: true
      },
      {
        id: 'tag',
        Header: 'Tag',
        accessor: (item) => getTag(item, itemInfos),
        Cell: ({ cell: { value } }) => <TagIcon tag={value} />,
        sortType: compareBy(({ values: { tag } }) =>
          tag && tagConfig[tag] ? tagConfig[tag].sortOrder : 1000
        )
      },
      hasWishList && {
        id: 'wishList',
        Header: 'Wish List',
        accessor: (item) => {
          const roll = wishList?.[item.id];
          return roll ? (roll.isUndesirable ? false : true) : null;
        },
        Cell: ({ cell: { value } }) =>
          value !== null ? <AppIcon icon={value ? thumbsUpIcon : thumbsDownIcon} /> : null,
        sortType: compareBy(({ values: { wishList } }) =>
          wishList === null ? 0 : wishList === true ? -1 : 1
        )
      },
      {
        Header: 'Tier',
        accessor: 'tier',
        sortType: compareBy(({ original: item }) => rarity(item))
      },
      {
        Header: 'Source',
        accessor: source
      },
      {
        id: 'year',
        Header: 'Year',
        accessor: (item) =>
          item.isDestiny1() ? item.year : item.isDestiny2() ? D2SeasonInfo[item.season].year : null,
        sortType: 'basic'
      },
      {
        Header: 'Season',
        accessor: 'season',
        sortType: 'basic'
      },
      {
        id: 'event',
        Header: 'Event',
        accessor: (item) => (item.isDestiny2() && item.event ? D2EventInfo[item.event].name : null)
      },
      {
        id: 'rating',
        Header: 'Rating',
        accessor: (item) => ratings && getRating(item, ratings)?.overallScore,
        Cell: ({ cell: { value: overallScore } }) => (
          <>
            <RatingIcon rating={overallScore} uiWishListRoll={undefined} />{' '}
            {overallScore.toFixed(1)}
          </>
        ),
        sortType: 'basic'
      },
      {
        id: 'stats',
        Header: 'Stats',
        columns: statColumns
      },
      {
        id: 'basestats',
        Header: 'Base Stats',
        columns: baseStatColumns,
        show: false
      },
      {
        id: 'masterworkTier',
        Header: 'Masterwork Tier',
        accessor: (item) => (item.isDestiny2() ? item.masterworkInfo?.tier : null),
        sortType: 'basic',
        sortDescFirst: true
      },
      {
        id: 'masterworkStat',
        Header: 'Masterwork Stat',
        accessor: (item) => (item.isDestiny2() ? item.masterworkInfo?.statName : null)
      },
      {
        id: 'perks',
        Header: 'Perks',
        accessor: () => false,
        // TODO: textual perks
        Cell: ({ row: { original: item } }) =>
          item.isDestiny2() ? <ItemSockets item={item} minimal={true} /> : null
      },
      {
        id: 'notes',
        Header: 'Notes',
        accessor: (item) => getNotes(item, itemInfos)
      },
      hasWishList && {
        id: 'wishListNote',
        Header: 'Wish List Note',
        accessor: (item) => wishList?.[item.id]?.notes
      }
    ] as Column<DimItem>[];

    for (const column of columns) {
      if (!column.id) {
        column.id = column.accessor?.toString();
      }
      column.show = enabledColumns.includes(column.id!);
    }

    return _.compact(columns);
  }, [itemInfos, ratings, wishList, items, enabledColumns]);

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    selectedFlatRows
  } = useTable(
    {
      columns,
      data: items,
      initialState,
      getRowID,
      // TODO: probably should reset on query changes too?
      getResetSelectedRowPathsDeps: () => [selection]
    } as any,
    useSortBy,
    useRowSelect
  ) as TableInstance<DimItem> & UseRowSelectInstanceProps<DimItem>;

  if (!terminal) {
    return <div>No items match the current filters.</div>;
  }

  const onChangeEnabledColumn: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = e.target.checked;
    const name = e.target.name;
    setEnabledColumns((columns) =>
      checked ? [...columns, name] : columns.filter((c) => c !== name)
    );
  };

  // TODO: Extract column selector, use a Reach dropdown or something
  // TODO: stolen from SearchFilter, should probably refactor into a shared thing
  const onLock = loadingTracker.trackPromise(async (e) => {
    const selectedTag = e.currentTarget.name;
    const items = selectedFlatRows?.map((d) => d.original);

    const state = selectedTag === 'lock';
    try {
      for (const item of items) {
        const store =
          item.owner === 'vault'
            ? item.getStoresService().getActiveStore()!
            : item.getStoresService().getStore(item.owner)!;

        if (item.isDestiny2()) {
          await d2SetLockState(store, item, state);
        } else if (item.isDestiny1()) {
          await d1SetItemState(item, store, state, 'lock');
        }

        // TODO: Gotta do this differently in react land
        item.locked = state;
      }
      showNotification({
        type: 'success',
        title: state
          ? t('Filter.LockAllSuccess', { num: items.length })
          : t('Filter.UnlockAllSuccess', { num: items.length })
      });
    } catch (e) {
      showNotification({
        type: 'error',
        title: state ? t('Filter.LockAllFailed') : t('Filter.UnlockAllFailed'),
        body: e.message
      });
    } finally {
      // Touch the stores service to update state
      if (items.length) {
        items[0].getStoresService().touch();
      }
    }
  });

  return (
    <>
      <div className={styles.enabledColumns}>
        {columns.map(
          (c) =>
            c.id !== 'selection' && (
              <label key={c.id} className={styles.checkButton}>
                <input
                  name={c.id}
                  type="checkbox"
                  checked={enabledColumns.includes(c.id!)}
                  onChange={onChangeEnabledColumn}
                />{' '}
                {_.isFunction(c.Header) ? c.Header({} as any) : c.Header}
              </label>
            )
        )}
      </div>
      <div className={styles.bulkActions}>
        Bulk actions:
        <button
          className="dim-button"
          disabled={selectedFlatRows.length === 0}
          name="lock"
          onClick={onLock}
        >
          Lock <AppIcon icon={lockIcon} />
        </button>
        <button
          className="dim-button"
          disabled={selectedFlatRows.length === 0}
          name="unlock"
          onClick={onLock}
        >
          Unlock <AppIcon icon={lockIcon} />
        </button>
        <button className="dim-button" disabled={selectedFlatRows.length === 0}>
          Tag
        </button>
        <button className="dim-button" disabled={selectedFlatRows.length === 0}>
          Move To
        </button>
      </div>
      <table className={styles.table} {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(
                (column: ColumnInstance<DimItem> & UseSortByColumnProps<DimItem>) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className={styles[column.id]}
                  >
                    {column.render('Header')}
                    {column.isSorted && (
                      <AppIcon icon={column.isSortedDesc ? faCaretUp : faCaretDown} />
                    )}
                  </th>
                )
              )}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()} className={styles[cell.column.id]}>
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <pre>
        <code>
          {JSON.stringify(
            selectedFlatRows?.map((d) => d.original.name),
            null,
            2
          )}
        </code>
      </pre>
    </>
  );
}

export default React.memo(ItemTable);
