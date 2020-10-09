import styles from 'app/active-mode/Views/FarmingView.m.scss';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { startFarming, stopFarming } from 'app/farming/actions';
import { t } from 'app/i18next-t';
import InventoryItem from 'app/inventory/InventoryItem';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

interface ProvidedProps {
  store: DimStore;
}

interface StoreProps {
  newItems: DimItem[];
}

const newItemsToShow = 8;

function mapStateToProps(state: RootState): StoreProps {
  const newItems = allItemsSelector(state).sort((a, b) => (a.id > b.id ? -1 : 1));
  newItems.length = newItemsToShow;

  return {
    newItems,
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function FarmingView({ store, newItems, dispatch }: Props) {
  const [isFarming, setIsFarming] = useState(false);

  useEffect(() => {
    dispatch((isFarming ? startFarming : stopFarming)(store.id));
  }, [dispatch, store, isFarming]);

  return (
    <CollapsibleTitle
      title={t('ActiveMode.Farming')}
      sectionId={'active-farming'}
      defaultCollapsed={true}
    >
      <div className="dim-button bucket-button" onClick={() => setIsFarming(!isFarming)}>
        {!isFarming ? t('ActiveMode.FarmingStart') : t('ActiveMode.FarmingStart')}
      </div>
      <div className={styles.newItems}>
        {newItems.map((item) => (
          <ItemPopupTrigger key={item.id} item={item}>
            {(ref, onClick) => <InventoryItem item={item} innerRef={ref} onClick={onClick} />}
          </ItemPopupTrigger>
        ))}
      </div>
    </CollapsibleTitle>
  );
}

export default connect<StoreProps>(mapStateToProps)(FarmingView);
