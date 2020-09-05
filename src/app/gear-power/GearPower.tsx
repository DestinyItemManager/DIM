import BungieImage from 'app/dim-ui/BungieImage';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import { itemPop } from 'app/dim-ui/scroll';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { t } from 'app/i18next-t';
import { maxLightItemSet } from 'app/loadout/auto-loadouts';
import { getLight } from 'app/loadout/loadout-utils';
import { RootState } from 'app/store/types';
import { useSubscription } from 'app/utils/hooks';
import clsx from 'clsx';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Sheet from '../dim-ui/Sheet';
import { storesSelector } from '../inventory/selectors';
import { D2Store } from '../inventory/store-types';
import { showGearPower$ } from './gear-power';
import styles from './GearPower.m.scss';

const bucketClassNames = {
  Kinetic: styles.kinetic,
  Energy: styles.energy,
  Power: styles.power,
  Helmet: styles.helmet,
  Gauntlets: styles.gauntlets,
  Chest: styles.chest,
  Leg: styles.leg,
  ClassItem: styles.classItem,
};

export default function GearPower() {
  const stores = useSelector<RootState, D2Store[]>((state) => storesSelector(state) as D2Store[]);
  const [selectedStore, setSelectedStore] = useState<D2Store | undefined>();
  const reset = () => {
    setSelectedStore(undefined);
  };

  useSubscription(() =>
    showGearPower$.subscribe(({ selectedStoreId }) => {
      setSelectedStore(stores.find((s) => s.id === selectedStoreId));
    })
  );

  if (!selectedStore) {
    return null;
  }

  const { unrestricted, equippable } = maxLightItemSet(stores, selectedStore);
  const maxBasePower = getLight(selectedStore, unrestricted);
  const equippableMaxBasePower = getLight(selectedStore, equippable);
  const powerFloor = Math.floor(maxBasePower);
  const header = (
    <div className={styles.gearPowerHeader}>
      <img src={selectedStore.icon} />
      <div>
        <h1>{selectedStore.name}</h1>
        <h1>
          <FractionalPowerLevel power={maxBasePower} />
        </h1>
      </div>
    </div>
  );
  return (
    <Sheet onClose={reset} header={header} sheetClassName={styles.gearPowerSheet}>
      <div className={styles.gearPowerSheetContent}>
        <div className={styles.gearGrid}>
          {unrestricted.map((i) => {
            const powerDiff = (powerFloor - (i.primStat?.value ?? 0)) * -1;
            const diffSymbol = powerDiff >= 0 ? '+' : '';
            const diffClass =
              powerDiff > 0 ? styles.positive : powerDiff < 0 ? styles.negative : styles.neutral;
            return (
              <div key={i.id} className={clsx(bucketClassNames[i.type], styles.gearItem)}>
                <div onClick={() => itemPop(i)}>
                  <BungieImage src={i.icon} className={styles.itemImage} />
                </div>
                <div className={styles.gearItemInfo}>
                  <div className={styles.primStat}>{i.primStat?.value}</div>
                  <div className={styles.statMeta}>
                    <BucketIcon className={styles.bucketImage} item={i} />
                    <div className={diffClass}>
                      {diffSymbol}
                      {powerDiff}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {maxBasePower !== equippableMaxBasePower && (
          <>
            <div className={styles.footNote}>* {t('Loadouts.EquippableDifferent1')}</div>
            <div className={styles.footNote}>{t('Loadouts.EquippableDifferent2')}</div>
          </>
        )}
      </div>
    </Sheet>
  );
}

// implement this once item popup & sheet coexist more peacefully
//
// import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
// <ItemPopupTrigger item={i}>
// {(ref, onClick) => (
//   <span ref={ref} onClick={onClick}>
//     <BungieImage src={i.icon} />
//   </span>
// )}
// </ItemPopupTrigger>
