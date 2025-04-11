import { PressTip } from 'app/dim-ui/PressTip';
import { useDynamicStringReplacer } from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { ColumnSort, SortDirection } from 'app/dim-ui/table-columns';
import { t } from 'app/i18next-t';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { moveItemTo } from 'app/inventory/move-item';
import { currentStoreSelector, notesSelector } from 'app/inventory/selectors';
import ActionButton from 'app/item-actions/ActionButton';
import { LockActionButton, TagActionButton } from 'app/item-actions/ActionButtons';
import { useD2Definitions } from 'app/manifest/selectors';
import { ColumnDefinition, Row, TableContext } from 'app/organizer/table-types';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { noop } from 'app/utils/functions';
import { useSetCSSVarToHeight, useShiftHeld } from 'app/utils/hooks';
import clsx from 'clsx';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem, DimSocket } from '../inventory/item-types';
import {
  AppIcon,
  faAngleLeft,
  faAngleRight,
  faArrowCircleDown,
  shoppingCart,
} from '../shell/icons';
import styles from './CompareItem.m.scss';

export default memo(function CompareItem({
  item,
  row,
  tableCtx,
  filteredColumns,
  itemClick,
  remove,
  setHighlight,
  isInitialItem,
}: {
  item: DimItem;
  row: Row;
  tableCtx: TableContext;
  filteredColumns: ColumnDefinition[];
  itemClick: (item: DimItem) => void;
  remove: (item: DimItem) => void;
  setHighlight: (value?: string | number) => void;
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
  isInitialItem: boolean;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  useSetCSSVarToHeight(headerRef, '--compare-item-height');
  const itemNotes = useSelector(notesSelector(item));
  const dispatch = useThunkDispatch();
  const currentStore = useSelector(currentStoreSelector)!;
  const pullItem = useCallback(() => {
    dispatch(moveItemTo(item, currentStore, false));
  }, [currentStore, dispatch, item]);

  const { pathname } = useLocation();
  const isFindable = !item.vendor && pathname.endsWith('/inventory');

  const itemHeader = useMemo(
    () => (
      <div ref={headerRef} className={styles.headerContainer}>
        <div className={styles.itemActions}>
          {item.vendor ? (
            <VendorItemWarning item={item} />
          ) : (
            <ActionButton title={t('Hotkey.Pull')} onClick={pullItem}>
              <AppIcon icon={faArrowCircleDown} />
            </ActionButton>
          )}
          {item.lockable ? <LockActionButton item={item} noHotkey /> : <div />}
          {item.taggable ? <TagActionButton item={item} label={false} hideKeys={true} /> : <div />}
          <button type="button" className={styles.close} onClick={() => remove(item)} />
        </div>
        <ItemPopupTrigger item={item} noCompare={true}>
          {(ref, onClick) => (
            <div className={styles.itemAside} ref={ref} onClick={onClick}>
              <PressTip minimal tooltip={itemNotes}>
                <ConnectedInventoryItem item={item} />
              </PressTip>
            </div>
          )}
        </ItemPopupTrigger>
      </div>
    ),
    [item, pullItem, remove, itemNotes],
  );

  const handleRowClick = (row: Row, column: ColumnDefinition) => {
    if (column.id === 'name' && isFindable) {
      return () => itemClick(row.item);
    }
    return undefined;
  };

  return (
    // <div
    //   className={clsx(styles.compareItem, {
    //     'compare-initial': isInitialItem,
    //     'compare-findable': isFindable,
    //   })}
    // >
    <>
      {itemHeader}
      {filteredColumns.map((column, i) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          key={column.id}
          onClick={handleRowClick(row, column)}
          className={clsx(
            column.className,
            column.id === 'name' && {
              'compare-initial': isInitialItem,
              'compare-findable': isFindable,
            },
            i === filteredColumns.length - 1 && styles.lastRow,
          )}
          role="cell"
          onPointerEnter={() => setHighlight(column.id)}
        >
          {column.cell
            ? column.cell(row.values[column.id], row.item, tableCtx.minMaxValues[column.id])
            : row.values[column.id]}
        </div>
      ))}
      <div className={styles.separator} />
    </>
  );
});

function VendorItemWarning({ item }: { item: DimItem }) {
  const defs = useD2Definitions()!;
  const replacer = useDynamicStringReplacer(item.owner);
  return item.vendor ? (
    <PressTip
      elementType="span"
      tooltip={() => {
        const vendorName =
          replacer(defs.Vendor.get(item.vendor!.vendorHash)?.displayProperties?.name) || '--';
        return <>{t('Compare.IsVendorItem', { vendorName })}</>;
      }}
    >
      <ActionButton onClick={noop} disabled>
        <AppIcon icon={shoppingCart} />
      </ActionButton>
    </PressTip>
  ) : null;
}

/** The row headers that appear on the left of the compare window */
export function CompareHeaders({
  columnSorts,
  highlight,
  setHighlight,
  toggleColumnSort,
  filteredColumns,
}: {
  columnSorts: ColumnSort[];
  highlight: string | number | undefined;
  setHighlight: React.Dispatch<React.SetStateAction<string | number | undefined>>;
  toggleColumnSort: (columnId: string, shiftHeld: boolean, sort?: SortDirection) => () => void;
  filteredColumns: ColumnDefinition[];
}) {
  const isShiftHeld = useShiftHeld();
  return (
    <>
      <div className={styles.header} />
      {filteredColumns.map((column, i) => {
        const columnSort = !column.noSort && columnSorts.find((c) => c.columnId === column.id);
        return (
          <div
            key={column.id}
            className={clsx(
              styles.header,
              column.headerClassName,
              columnSort
                ? columnSort.sort === SortDirection.ASC
                  ? styles.sortDesc
                  : styles.sortAsc
                : undefined,
              i === filteredColumns.length - 1 && styles.lastRow,
            )}
            onPointerEnter={() => setHighlight(column.id)}
            onClick={
              column.noSort
                ? undefined
                : toggleColumnSort(column.id, isShiftHeld, column.defaultSort)
            }
            role="rowheader"
            aria-sort={
              columnSort
                ? columnSort.sort === SortDirection.ASC
                  ? 'ascending'
                  : 'descending'
                : 'none'
            }
          >
            {column.header}
            {columnSort && (
              <AppIcon icon={columnSort.sort === SortDirection.ASC ? faAngleRight : faAngleLeft} />
            )}
            {column.id === highlight && <div className={styles.highlightBar} />}
          </div>
        );
      })}
    </>
  );
}
