import { t } from 'app/i18next-t';
import { getStore } from 'app/inventory/stores-helpers';
import { showItemPopup } from 'app/item-popup/item-popup';
import { ThunkDispatchProp } from 'app/store/types';
import clsx from 'clsx';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showInfuse } from '../infuse/infuse';
import { DimItem } from '../inventory/item-types';
import { consolidate, distribute, moveItemTo } from '../inventory/move-item';
import { sortedStoresSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { hideItemPopup } from './item-popup';
import ItemActionButton, { ItemActionButtonGroup } from './ItemActionButton';
import styles from './ItemActions.m.scss';
import ItemMoveLocation from './ItemMoveLocation';

export default function ItemActions({
  item,
  mobileInspect,
}: {
  item: DimItem;
  mobileInspect?: boolean;
}) {
  const stores = useSelector(sortedStoresSelector);
  const store = getStore(stores, item.owner);
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  const onMoveItemTo = (store: DimStore, equip = false) => {
    dispatch(moveItemTo(item, store, equip));
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

  if (!store) {
    return null;
  }

  const canConsolidate =
    !item.notransfer && item.location.hasTransferDestination && item.maxStackSize > 1;
  const canDistribute = item.destinyVersion === 1 && !item.notransfer && item.maxStackSize > 1;

  return (
    <>
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
          <ItemActionButtonGroup vertical={Boolean(mobileInspect)}>
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
