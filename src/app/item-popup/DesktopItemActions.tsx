import { CompareService } from 'app/compare/compare.service';
import { t } from 'app/i18next-t';
import { amountOfItem, getStore } from 'app/inventory/stores-helpers';
import { AppIcon, faClone } from 'app/shell/icons';
import { ThunkDispatchProp } from 'app/store/types';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import d2Infuse from '../../images/d2infuse.png';
import { showInfuse } from '../infuse/infuse';
import { DimItem } from '../inventory/item-types';
import { consolidate, distribute, moveItemTo } from '../inventory/move-item';
import { sortedStoresSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import styles from './DesktopItemActions.m.scss';
import { hideItemPopup } from './item-popup';
import ItemActionButton from './ItemActionButton';
import ItemMoveAmount from './ItemMoveAmount';
import { canShowStore, canShowVault } from './ItemMoveLocation';

export default function DesktopItemActions({ item }: { item: DimItem }) {
  const [amount, setAmount] = useState(item.amount);
  const stores = useSelector(sortedStoresSelector);
  const itemOwner = getStore(stores, item.owner);
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  // If the item can't be transferred (or is unique) don't show the move amount slider
  const maximum = useMemo(
    () =>
      !itemOwner || item.maxStackSize <= 1 || item.notransfer || item.uniqueStack
        ? 1
        : amountOfItem(itemOwner, item),
    [itemOwner, item]
  );

  const onMoveItemTo = (store: DimStore, equip = false) => {
    dispatch(moveItemTo(item, store, equip, amount));
    hideItemPopup();
  };

  /*
   * Open up the dialog for infusion by passing
   * the selected item
   */
  const infuse = () => {
    showInfuse(item);
    hideItemPopup();
  };

  const onConsolidate = () => {
    if (itemOwner) {
      dispatch(consolidate(item, itemOwner));
      hideItemPopup();
    }
  };

  const onDistribute = () => {
    dispatch(distribute(item));
    hideItemPopup();
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const reposition = () => {
      if (containerRef.current) {
        let parent = containerRef.current.parentElement;
        while (parent && !parent.classList.contains('item-popup')) {
          parent = parent.parentElement;
        }
        const arrow = parent?.querySelector('.arrow') as HTMLDivElement;
        if (!arrow || !parent) {
          return;
        }
        const arrowRect = arrow.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const containerHeight = containerRef.current.clientHeight;
        const offset = arrowRect.top - parentRect.top + 2.5;

        const top = Math.min(
          Math.max(0, offset - containerHeight / 2),
          parent.clientHeight - containerHeight
        );

        console.log({
          arrowRect: arrowRect.top,
          parentRect: parentRect.top,
          parent,
          arrow,
          containerHeight,
          offset,
        });

        containerRef.current.style.transform = `translateY(${Math.round(top)}px)`;
        console.log('transform', `translateY(${Math.round(top)}px)`);
      }
    };

    reposition();
    setTimeout(reposition, 10);
  });

  const onAmountChanged = setAmount;

  if (!itemOwner) {
    return null;
  }

  const canConsolidate =
    !item.notransfer && item.location.hasTransferDestination && item.maxStackSize > 1;
  const canDistribute = item.destinyVersion === 1 && !item.notransfer && item.maxStackSize > 1;

  const openCompare = () => {
    hideItemPopup();
    CompareService.addItemsToCompare([item], true);
  };

  // TODO: move itemMoveAmount... elsewhere?
  return (
    <>
      {maximum > 1 && (
        <ItemMoveAmount
          amount={amount}
          maximum={maximum}
          maxStackSize={item.maxStackSize}
          onAmountChanged={onAmountChanged}
        />
      )}
      <div className={styles.interaction} ref={containerRef}>
        {stores.map((store) => (
          <>
            {canShowVault(store, itemOwner, item) && (
              <div
                className={styles.actionButton}
                onClick={() => onMoveItemTo(store)}
                role="button"
                tabIndex={-1}
              >
                <img
                  src={store.icon}
                  height="32"
                  width="32"
                  style={{
                    backgroundColor: store.color
                      ? `rgb(${Math.round(store.color.red)}, ${Math.round(
                          store.color.green
                        )}, ${Math.round(store.color.blue)}`
                      : 'black',
                  }}
                />{' '}
                {t('MovePopup.Vault')}
              </div>
            )}
            {!(item.owner === store.id && item.equipped) && itemCanBeEquippedBy(item, store) && (
              <div
                className={styles.actionButton}
                onClick={() => onMoveItemTo(store, true)}
                role="button"
                tabIndex={-1}
              >
                <img
                  src={store.icon}
                  height="32"
                  width="32"
                  style={{
                    backgroundColor: store.color
                      ? `rgb(${Math.round(store.color.red)}, ${Math.round(
                          store.color.green
                        )}, ${Math.round(store.color.blue)}`
                      : 'black',
                  }}
                />{' '}
                {t('MovePopup.Equip')}
              </div>
            )}
            {canShowStore(store, itemOwner, item) && (
              <div
                className={styles.actionButton}
                onClick={() => onMoveItemTo(store)}
                role="button"
                tabIndex={-1}
              >
                <img
                  src={store.icon}
                  height="32"
                  width="32"
                  style={{
                    backgroundColor: store.color
                      ? `rgb(${Math.round(store.color.red)}, ${Math.round(
                          store.color.green
                        )}, ${Math.round(store.color.blue)}`
                      : 'black',
                  }}
                />{' '}
                {t('MovePopup.Store')}
              </div>
            )}
          </>
        ))}
        {item.comparable && (
          <div className={styles.actionButton} onClick={openCompare} role="button" tabIndex={-1}>
            <AppIcon icon={faClone} /> Compare
          </div>
        )}
        {canConsolidate && (
          <ItemActionButton
            className={styles.moveConsolidate}
            title={t('MovePopup.Consolidate')}
            onClick={onConsolidate}
            label={t('MovePopup.Take')}
          />
        )}
        {canDistribute && (
          <ItemActionButton
            className={styles.moveDistribute}
            title={t('MovePopup.DistributeEvenly')}
            onClick={onDistribute}
            label={t('MovePopup.Split')}
          />
        )}
        {item.infusionFuel && (
          <div className={styles.actionButton} onClick={infuse} role="button" tabIndex={-1}>
            <img src={d2Infuse} height="32" width="32" /> {t('MovePopup.Infuse')}
          </div>
        )}
      </div>
    </>
  );
}
