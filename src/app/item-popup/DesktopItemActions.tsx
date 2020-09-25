import { t } from 'app/i18next-t';
import { amountOfItem, getStore } from 'app/inventory/stores-helpers';
import { ThunkDispatchProp } from 'app/store/types';
import clsx from 'clsx';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showInfuse } from '../infuse/infuse';
import { DimItem } from '../inventory/item-types';
import { consolidate, distribute, moveItemTo } from '../inventory/move-item';
import { sortedStoresSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import styles from './DesktopItemActions.m.scss';
import { hideItemPopup } from './item-popup';
import ItemActionButton, { ItemActionButtonGroup } from './ItemActionButton';
import ItemMoveAmount from './ItemMoveAmount';
import ItemMoveLocation from './ItemMoveLocation';

export default function DesktopItemActions({ item }: { item: DimItem }) {
  const [amount, setAmount] = useState(item.amount);
  const stores = useSelector(sortedStoresSelector);
  const store = getStore(stores, item.owner);
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  // If the item can't be transferred (or is unique) don't show the move amount slider
  const maximum = useMemo(
    () =>
      !store || item.maxStackSize <= 1 || item.notransfer || item.uniqueStack
        ? 1
        : amountOfItem(store, item),
    [store, item]
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
    if (store) {
      dispatch(consolidate(item, store));
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

  if (!store) {
    return null;
  }

  const canConsolidate =
    !item.notransfer && item.location.hasTransferDestination && item.maxStackSize > 1;
  const canDistribute = item.destinyVersion === 1 && !item.notransfer && item.maxStackSize > 1;

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
        {stores.map((buttonStore) => (
          <ItemMoveLocation
            key={buttonStore.id}
            item={item}
            store={buttonStore}
            itemOwnerStore={store}
            vertical={true}
            moveItemTo={onMoveItemTo}
          />
        ))}

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
          <ItemActionButtonGroup vertical={true}>
            <ItemActionButton
              className={clsx(styles.infusePerk, {
                [styles.destiny2]: item.destinyVersion === 2,
                [styles.weapons]: item.bucket.sort === 'Weapons',
                [styles.armor]: item.bucket.sort === 'Armor',
              })}
              onClick={infuse}
              title={t('Infusion.Infusion')}
              label={t('MovePopup.Infuse')}
            />
          </ItemActionButtonGroup>
        )}
      </div>
    </>
  );
}
