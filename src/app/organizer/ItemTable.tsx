/* eslint-disable react/jsx-key, react/prop-types */
import React, { useMemo } from 'react';
import { DimItem } from 'app/inventory/item-types';
import { useTable, Column } from 'react-table';
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
import { getTag, DimItemInfo, getNotes } from 'app/inventory/dim-item-info';
import TagIcon from 'app/inventory/TagIcon';
import { source } from 'app/inventory/spreadsheets';
import ElementIcon from 'app/inventory/ElementIcon';
import { D2SeasonInfo } from 'app/inventory/d2-season-info';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { getRating } from 'app/item-review/reducer';
import { DtrRating } from 'app/item-review/dtr-api-types';
import ExpandedRating from 'app/item-popup/ExpandedRating';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import { statWhiteList } from 'app/inventory/store/stats';

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
  const terminal = Boolean(_.last(selection)?.terminal);
  const categoryHashes = selection.map((s) => s.itemCategoryHash).filter((h) => h > 0);
  items = terminal
    ? items.filter((item) => categoryHashes.every((h) => item.itemCategoryHashes.includes(h)))
    : [];

  // https://github.com/tannerlinsley/react-table/blob/master/docs/api.md
  const columns: Column<DimItem>[] = useMemo(() => {
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
          accessor: (item: DimItem) => item.stats?.find((s) => s.statHash === statHash)?.value
        };
      }),
      (s) => statWhiteList.indexOf(s.statHash)
    );

    const baseStatColumns = statColumns.map((column) => ({
      ...column,
      id: `base_${column.statHash}`,
      accessor: (item: DimItem) => item.stats?.find((s) => s.statHash === column.statHash)?.base
    }));

    return [
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
        Header: 'Damage',
        accessor: 'dmg',
        Cell: ({ cell: { value } }) => (value ? <ElementIcon element={value} /> : null)
      },
      {
        id: 'power',
        Header: () => <AppIcon icon={powerIndicatorIcon} />,
        accessor: (item) => item.primStat?.value
      },
      {
        Header: 'Tag',
        accessor: (item) => getTag(item, itemInfos),
        Cell: ({ cell: { value } }) => <TagIcon tag={value} />
      },
      {
        Header: () => <AppIcon icon={lockIcon} />,
        accessor: 'locked',
        Cell: ({ cell: { value } }) => (value ? <AppIcon icon={lockIcon} /> : null)
      },
      {
        Header: 'Tier',
        accessor: 'tier'
      },
      {
        Header: 'Notes',
        accessor: (item) => getNotes(item, itemInfos)
      },
      {
        Header: 'Source',
        accessor: source
      },
      {
        Header: 'Year',
        accessor: (item) =>
          item.isDestiny1() ? item.year : item.isDestiny2() ? D2SeasonInfo[item.season].year : null
      },
      {
        Header: 'Season',
        accessor: 'season'
      },
      {
        Header: 'Event',
        accessor: (item) => (item.isDestiny2() && item.event ? D2EventInfo[item.event].name : null)
      },

      {
        Header: 'Rating',
        accessor: (item) => ratings && getRating(item, ratings)?.overallScore,
        Cell: ({ row: { original: item } }) => <ExpandedRating item={item} />
      },

      {
        Header: 'Wish List',
        accessor: (item) => {
          const roll = wishList?.[item.id];
          return roll ? (roll.isUndesirable ? false : true) : null;
        },
        Cell: ({ cell: { value } }) =>
          value !== null ? <AppIcon icon={value ? thumbsUpIcon : thumbsDownIcon} /> : null
      },
      {
        Header: 'Wish List Note',
        accessor: (item) => wishList?.[item.id]?.notes
      },
      {
        Header: 'Stats',
        columns: statColumns
      },
      {
        Header: 'Base Stats',
        columns: baseStatColumns,
        show: false
      },
      {
        Header: 'Masterwork Tier',
        accessor: (item) => (item.isDestiny2() ? item.masterworkInfo?.tier : null)
      },
      {
        Header: 'Masterwork Stat',
        accessor: (item) => (item.isDestiny2() ? item.masterworkInfo?.statName : null)
      }
      /*
      {
        Header: 'Perks',
        accessor: () => false,
        Cell: ({ row: { original: item } }) =>
          item.isDestiny2() ? <ItemSockets item={item} minimal={true} /> : null
      },
      */
    ];
  }, [itemInfos, ratings, wishList, items]);

  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data: items
  });

  if (!terminal) {
    return <div>Nothing to see here</div>;
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
