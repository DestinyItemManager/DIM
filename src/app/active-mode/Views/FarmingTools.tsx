import { startFarming, stopFarming } from 'app/farming/actions';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import MaxlightButton from 'app/loadout/MaxlightButton';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

type Props = {
  store: DimStore;
};

const hasClassifiedSelector = createSelector(allItemsSelector, (allItems) =>
  allItems.some(
    (i) =>
      i.classified &&
      (i.location.sort === 'Weapons' || i.location.sort === 'Armor' || i.type === 'Ghost')
  )
);

export default function FarmingTools({ store }: Props) {
  const [isFarming, setIsFarming] = useState(false);

  const allItems = useSelector(allItemsSelector);
  const hasClassified = useSelector(hasClassifiedSelector);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch((isFarming ? startFarming : stopFarming)(store.id));
  }, [dispatch, store, isFarming]);

  return (
    <>
      <div className="dim-button bucket-button">
        <MaxlightButton
          allItems={allItems}
          dimStore={store}
          hasClassified={hasClassified}
          hideIcon={true}
        />
      </div>
      <div className="dim-button bucket-button" onClick={() => setIsFarming(!isFarming)}>
        {isFarming ? t('ActiveMode.FarmingStop') : t('ActiveMode.FarmingStart')}
      </div>
    </>
  );
}
