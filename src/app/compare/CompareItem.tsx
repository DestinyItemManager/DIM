import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { itemNoteSelector } from 'app/inventory/dim-item-info';
import { moveItemTo } from 'app/inventory/move-item';
import { currentStoreSelector } from 'app/inventory/selectors';
import ActionButton from 'app/item-popup/item-actions/ActionButton';
import { LockActionButton, TagActionButton } from 'app/item-popup/item-actions/ActionButtons';
import ItemPopupTrigger from 'app/item-popup/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/item/ConnectedInventoryItem';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useSetCSSVarToHeight } from 'app/utils/hooks';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { DimItem, DimSocket } from '../inventory/item-types';
import ItemSockets from '../item-popup/ItemSockets';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';
import { AppIcon, faArrowCircleDown, searchIcon, shoppingCart } from '../shell/icons';
import { StatInfo } from './Compare';
import styles from './CompareItem.m.scss';
import CompareStat from './CompareStat';

export default function CompareItem({
  item,
  stats,
  compareBaseStats,
  itemClick,
  remove,
  setHighlight,
  onPlugClicked,
  isInitialItem,
}: {
  item: DimItem;
  stats: StatInfo[];
  compareBaseStats?: boolean;
  itemClick(item: DimItem): void;
  remove(item: DimItem): void;
  setHighlight?(value?: string | number): void;
  onPlugClicked(value: { item: DimItem; socket: DimSocket; plugHash: number }): void;
  isInitialItem: boolean;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  useSetCSSVarToHeight(headerRef, '--compare-item-height');
  const itemNotes = useSelector(itemNoteSelector(item));
  const dispatch = useThunkDispatch();
  const currentStore = useSelector(currentStoreSelector)!;
  const pullItem = useCallback(() => {
    dispatch(moveItemTo(item, currentStore, false));
  }, [currentStore, dispatch, item]);

  const { pathname } = useLocation();
  const isFindable = !item.vendor && pathname.endsWith('/inventory');

  const itemHeader = useMemo(
    () => (
      <div ref={headerRef}>
        <div className={styles.header}>
          {item.vendor ? (
            <VendorItemWarning item={item} />
          ) : (
            <ActionButton title={t('Hotkey.Pull')} onClick={pullItem}>
              <AppIcon icon={faArrowCircleDown} />
            </ActionButton>
          )}
          {item.lockable ? <LockActionButton item={item} /> : <div />}
          {item.taggable ? <TagActionButton item={item} label={false} hideKeys={true} /> : <div />}
          <div className={styles.close} onClick={() => remove(item)} role="button" tabIndex={0} />
        </div>
        <div
          className={clsx(styles.itemName, {
            [styles.initialItem]: isInitialItem,
            [styles.isFindable]: isFindable,
          })}
          onClick={() => itemClick(item)}
        >
          <span title={isInitialItem ? t('Compare.InitialItem') : undefined}>{item.name}</span>{' '}
          {isFindable && <AppIcon icon={searchIcon} />}
        </div>
        <ItemPopupTrigger item={item} noCompare={true}>
          {(ref, onClick) => (
            <div className={styles.itemAside} ref={ref} onClick={onClick}>
              <PressTip className={styles.itemAside} tooltip={itemNotes}>
                <ConnectedInventoryItem item={item} />
              </PressTip>
            </div>
          )}
        </ItemPopupTrigger>
      </div>
    ),
    [isInitialItem, item, itemClick, pullItem, remove, itemNotes, isFindable]
  );

  return (
    <div className="compare-item">
      {itemHeader}
      {stats.map((stat) => (
        <CompareStat
          key={stat.id}
          item={item}
          stat={stat}
          setHighlight={setHighlight}
          compareBaseStats={compareBaseStats}
        />
      ))}
      {item.talentGrid && <ItemTalentGrid item={item} perksOnly={true} />}
      {item.missingSockets && (
        <div className="item-details warning">{t('MovePopup.MissingSockets')}</div>
      )}
      {item.sockets && <ItemSockets item={item} minimal={true} onPlugClicked={onPlugClicked} />}
    </div>
  );
}

function VendorItemWarning({ item }: { item: DimItem }) {
  const defs = useD2Definitions()!;
  return item.vendor ? (
    <PressTip
      elementType="span"
      tooltip={() => {
        const vendorName = defs.Vendor.get(item.vendor!.vendorHash).displayProperties.name;
        return (
          <>
            {t('Compare.IsVendorItem')}
            <br />
            {t('Compare.SoldBy', { vendorName })}
          </>
        );
      }}
    >
      <ActionButton onClick={_.noop} disabled title={t('Hotkey.Pull')}>
        <AppIcon icon={shoppingCart} />
      </ActionButton>
    </PressTip>
  ) : null;
}
