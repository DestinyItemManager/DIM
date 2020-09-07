import { t } from 'app/i18next-t';
import { getStore } from 'app/inventory/stores-helpers';
import { showItemPopup } from 'app/item-popup/item-popup';
import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { showInfuse } from '../infuse/infuse';
import { DimItem } from '../inventory/item-types';
import { consolidate, distribute, moveItemTo } from '../inventory/move-item';
import { sortedStoresSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { hideItemPopup } from './item-popup';
import ItemActionButton, { ItemActionButtonGroup } from './ItemActionButton';
import styles from './ItemActions.m.scss';
import ItemMoveAmount from './ItemMoveAmount';
import ItemMoveLocation from './ItemMoveLocation';

export default function ItemActions({
  item,
  mobileInspect,
}: {
  item: DimItem;
  mobileInspect?: boolean;
}) {
  const [amount, setAmount] = useState(item.amount);
  const stores = useSelector(sortedStoresSelector);
  const store = getStore(stores, item.owner);

  // If the item can't be transferred (or is unique) don't show the move amount slider
  const maximum = useMemo(
    () =>
      !store || item.maxStackSize <= 1 || item.notransfer || item.uniqueStack
        ? 1
        : store.amountOfItem(item),
    [store, item]
  );

  const onMoveItemTo = (store: DimStore, equip = false) => {
    moveItemTo(item, store, equip, amount);
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
      consolidate(item, store);
      hideItemPopup();
    }
  };

  const onDistribute = () => {
    distribute(item);
    hideItemPopup();
  };

  const onAmountChanged = setAmount;

  if (!store) {
    return null;
  }

  const canConsolidate =
    !item.notransfer && item.location.hasTransferDestination && item.maxStackSize > 1;
  const canDistribute = item.isDestiny1() && !item.notransfer && item.maxStackSize > 1;

  return (
    <>
      {maximum > 1 && !mobileInspect && (
        <ItemMoveAmount
          amount={amount}
          maximum={maximum}
          maxStackSize={item.maxStackSize}
          onAmountChanged={onAmountChanged}
        />
      )}
      <div className={styles.interaction}>
        {stores.map((buttonStore) => (
          <ItemMoveLocation
            key={buttonStore.id}
            item={item}
            store={buttonStore}
            itemOwnerStore={store}
            vertical={Boolean(mobileInspect)}
            moveItemTo={onMoveItemTo}
          />
        ))}

        {canConsolidate && (
          <ItemActionButton
            className={styles.moveDistribute}
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
          <ItemActionButtonGroup vertical={Boolean(mobileInspect)}>
            <ItemActionButton
              className={clsx(styles.infusePerk, {
                [styles.destiny2]: item.isDestiny2(),
                [styles.weapons]: item.bucket.sort === 'Weapons',
                [styles.armor]: item.bucket.sort === 'Armor',
              })}
              onClick={infuse}
              title={t('Infusion.Infusion')}
              label={t('MovePopup.Infuse')}
            />
            {mobileInspect && (
              <ItemActionButton
                onClick={() => showItemPopup(item)}
                title={t('MovePopup.ItemDetailSheet')}
                label={t('MovePopup.Details')}
              />
            )}
          </ItemActionButtonGroup>
        )}
      </div>
    </>
  );
}
