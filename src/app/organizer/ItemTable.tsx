/* eslint-disable react/jsx-key, react/prop-types */
import React, { useMemo, useState } from 'react';
import { DimItem, DimPlug } from 'app/inventory/item-types';
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
  UseRowSelectInstanceProps,
  UseSortByColumnOptions
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
import { statWhiteList } from 'app/inventory/store/stats';
import { compareBy } from 'app/utils/comparators';
import { rarity } from 'app/shell/filters';
import { faCaretUp, faCaretDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import RatingIcon from 'app/inventory/RatingIcon';
import { loadingTracker } from 'app/shell/loading-tracker';
import { setItemState as d1SetItemState } from '../bungie-api/destiny1-api';
import { setLockState as d2SetLockState } from '../bungie-api/destiny2-api';
import { showNotification } from 'app/notifications/notifications';
import { getItemSpecialtyModSlotDisplayName } from 'app/utils/item-utils';
import SpecialtyModSlotIcon from 'app/dim-ui/SpecialtyModSlotIcon';
import { t } from 'app/i18next-t';
import { DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import CompareStat from 'app/compare/CompareStat';
import { StatInfo } from 'app/compare/Compare';
import { filterPlugs } from 'app/loadout-builder/generated-sets/utils';
import PressTip from 'app/dim-ui/PressTip';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';
import EnabledColumns from './EnabledColumns';
import BulkActions from './BulkActions';

const initialState = {
  sortBy: [{ id: 'name' }]
};

const getRowID = (item: DimItem) => item.id;

function ItemTable({
  items,
  selection,
  itemInfos,
  ratings,
  wishList,
  defs
}: {
  items: DimItem[];
  selection: SelectionTreeNode[];
  itemInfos: { [key: string]: DimItemInfo };
  ratings: { [key: string]: DtrRating };
  wishList: {
    [key: string]: InventoryWishListRoll;
  };
  defs: D2ManifestDefinitions;
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
    'archetype',
    'perks',
    'mods',
    'notes'
  ]);

  // TODO: drop wishlist columns if no wishlist loaded
  // TODO: d1/d2 columns
  // TODO: stat ranges
  // TODO: special stat display? recoil, bars, etc

  // TODO: really gotta pass these in... need to figure out data dependencies
  // https://github.com/tannerlinsley/react-table/blob/master/docs/api.md
  const columns: Column<DimItem>[] = useMemo(() => {
    const hasWishList = !_.isEmpty(wishList);

    const statHashes: {
      [statHash: number]: StatInfo;
    } = {};
    for (const item of items) {
      if (item.stats) {
        for (const stat of item.stats) {
          if (statHashes[stat.statHash]) {
            statHashes[stat.statHash].max = Math.max(statHashes[stat.statHash].max, stat.value);
            statHashes[stat.statHash].min = Math.min(statHashes[stat.statHash].min, stat.value);
          } else {
            statHashes[stat.statHash] = {
              id: stat.statHash,
              displayProperties: stat.displayProperties,
              min: stat.value,
              max: stat.value,
              enabled: true,
              lowerBetter: stat.smallerIsBetter,
              getStat(item) {
                return item.stats
                  ? item.stats.find((s) => s.statHash === stat.statHash)
                  : undefined;
              }
            };
          }
        }
      }
    }

    const statColumns = _.sortBy(
      _.map(statHashes, (statInfo, statHashStr) => {
        const statHash = parseInt(statHashStr, 10);
        return {
          id: `stat_${statHash}`,
          Header: () =>
            statInfo.displayProperties.hasIcon ? (
              <BungieImage src={statInfo.displayProperties.icon} />
            ) : (
              statInfo.displayProperties.name
            ),
          statHash,
          accessor: (item: DimItem) => item.stats?.find((s) => s.statHash === statHash)?.value,
          Cell: ({ row: { original: item } }) => <CompareStat item={item} stat={statInfo} />,
          sortType: 'basic',
          sortDescFirst: !statInfo.lowerBetter
        };
      }),
      (s) => statWhiteList.indexOf(s.statHash)
    );

    const baseStatColumns = statColumns.map((column) => ({
      ...column,
      id: `base_${column.statHash}`,
      accessor: (item: DimItem) => item.stats?.find((s) => s.statHash === column.statHash)?.base
    }));

    // TODO: move the column function out into its own thing
    const columns: (Column<DimItem> & UseSortByColumnOptions<DimItem>)[] = _.compact([
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
        Header: items[0]?.bucket.inArmor ? 'Element' : 'Damage',
        accessor: 'dmg',
        Cell: ({ cell: { value } }) =>
          value ? <ElementIcon className={styles.inlineIcon} element={value} /> : null
      },
      items[0]?.bucket.inArmor && {
        id: 'energy',
        Header: 'Energy',
        accessor: (item) => item.isDestiny2() && item.energy?.energyCapacity,
        sortType: 'basic',
        sortDescFirst: true
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
          value !== null ? (
            <AppIcon
              icon={value ? thumbsUpIcon : thumbsDownIcon}
              className={value ? styles.positive : styles.negative}
            />
          ) : null,
        sortType: compareBy(({ values: { wishList } }) =>
          wishList === null ? 0 : wishList === true ? -1 : 1
        )
      },
      {
        Header: 'Reacquireable',
        id: 'reacquireable',
        // TODO: figure out how to reuse search filters
        accessor: (item) =>
          item.isDestiny2() &&
          item.collectibleState !== null &&
          !(item.collectibleState & DestinyCollectibleState.NotAcquired) &&
          !(item.collectibleState & DestinyCollectibleState.PurchaseDisabled),
        sortType: 'basic',
        sortDescFirst: true,
        // TODO: boolean renderer
        Cell: ({ cell: { value } }) => (value ? <AppIcon icon={faCheck} /> : null)
      },
      {
        id: 'rating',
        Header: 'Rating',
        accessor: (item) => ratings && getRating(item, ratings)?.overallScore,
        Cell: ({ cell: { value: overallScore }, row: { original: item } }) =>
          overallScore > 0 ? (
            <>
              <RatingIcon rating={overallScore} uiWishListRoll={undefined} />{' '}
              {overallScore.toFixed(1)} ({getRating(item, ratings)?.ratingCount})
            </>
          ) : null,
        sortType: 'basic',
        sortDescFirst: true
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
        Header: 'Mod Slot',
        // TODO: only show if there are mod slots
        accessor: getItemSpecialtyModSlotDisplayName, //
        Cell: ({ cell: { value }, row: { original: item } }) =>
          value && <SpecialtyModSlotIcon className={styles.modSlot} item={item} />,
        sortType: 'basic'
      },
      {
        id: 'archetype',
        Header: 'Archetype',
        accessor: (item) =>
          !item.isExotic && item.isDestiny2() && !item.energy
            ? item.sockets?.categories[0]?.sockets[0]?.plug?.plugItem.displayProperties.name
            : null,
        Cell: ({ row: { original: item } }) =>
          !item.isExotic && item.isDestiny2() && !item.energy ? (
            <div>
              {[item.sockets?.categories[0]?.sockets[0]?.plug!].map((p) => (
                <PressTip
                  key={p.plugItem.hash}
                  tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
                >
                  <div className={styles.modPerk}>
                    <BungieImage src={p.plugItem.displayProperties.icon} />{' '}
                    {p.plugItem.displayProperties.name}
                  </div>
                </PressTip>
              ))}
            </div>
          ) : null
      },
      {
        id: 'perks',
        Header: 'Perks',
        accessor: (item) =>
          item.isDestiny2() && !item.energy
            ? item.sockets?.categories[0]?.sockets
                .flatMap((s) => s.plugOptions)
                .filter(
                  (p) =>
                    item.isExotic ||
                    !p.plugItem.itemCategoryHashes?.includes(INTRINSIC_PLUG_CATEGORY)
                ) || []
            : [],
        Cell: ({ cell: { value: plugItems }, row: { original: item } }) => (
          <div className={styles.modPerks}>
            {item.isDestiny2() &&
              plugItems.map((p: DimPlug) => (
                <PressTip
                  key={p.plugItem.hash}
                  tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
                >
                  <div className={styles.modPerk}>
                    <BungieImage src={p.plugItem.displayProperties.icon} />{' '}
                    {p.plugItem.displayProperties.name}
                  </div>
                </PressTip>
              ))}
          </div>
        ),
        disableSortBy: true
      },
      {
        id: 'mods',
        Header: 'Mods',
        accessor: (item) =>
          item.isDestiny2()
            ? item.sockets?.categories[1]?.sockets
                .filter((s) => s.plug?.plugItem.collectibleHash || filterPlugs(s))
                .flatMap((s) => s.plugOptions) || []
            : [],
        Cell: ({ cell: { value: plugItems }, row: { original: item } }) => (
          <div className={styles.modPerks}>
            {item.isDestiny2() &&
              plugItems.map((p: DimPlug) => (
                <PressTip
                  key={p.plugItem.hash}
                  tooltip={<PlugTooltip item={item} plug={p} defs={defs} />}
                >
                  <div className={styles.modPerk}>
                    <BungieImage src={p.plugItem.displayProperties.icon} />{' '}
                    {p.plugItem.displayProperties.name}
                  </div>
                </PressTip>
              ))}
          </div>
        ),
        disableSortBy: true
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
        id: 'notes',
        Header: 'Notes',
        accessor: (item) => getNotes(item, itemInfos)
      },
      hasWishList && {
        id: 'wishListNote',
        Header: 'Wish List Note',
        accessor: (item) => wishList?.[item.id]?.notes
      }
    ]);

    for (const column of columns) {
      if (!column.id) {
        column.id = column.accessor?.toString();
      }
      column.show = enabledColumns.includes(column.id!);
    }

    return columns;
  }, [wishList, items, itemInfos, ratings, defs, enabledColumns]);

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
      <EnabledColumns
        columns={columns}
        enabledColumns={enabledColumns}
        onChangeEnabledColumn={onChangeEnabledColumn}
      />
      <BulkActions selectedFlatRows={selectedFlatRows} onLock={onLock} />
      <div className={styles.tableContainer}>
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
      </div>
    </>
  );
}

export default React.memo(ItemTable);
