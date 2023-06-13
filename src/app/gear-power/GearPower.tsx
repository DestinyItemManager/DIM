import { AlertIcon } from 'app/dim-ui/AlertIcon';
import BungieImage from 'app/dim-ui/BungieImage';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import { SetFilterButton } from 'app/dim-ui/SetFilterButton';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { t } from 'app/i18next-t';
import { locateItem } from 'app/inventory/locate-item';
import { powerLevelSelector } from 'app/inventory/store/selectors';
import { classFilter } from 'app/search/search-filters/known-values';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { LookupTable } from 'app/utils/util-types';
import { clsx } from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import { useSubscription } from 'use-subscription';
import Sheet from '../dim-ui/Sheet';
import { storesSelector } from '../inventory/selectors';
import styles from './GearPower.m.scss';
import { showGearPower$ } from './gear-power';

const bucketClassNames: LookupTable<BucketHashes, string> = {
  [BucketHashes.KineticWeapons]: styles.kinetic,
  [BucketHashes.EnergyWeapons]: styles.energy,
  [BucketHashes.PowerWeapons]: styles.power,
  [BucketHashes.Helmet]: styles.helmet,
  [BucketHashes.Gauntlets]: styles.gauntlets,
  [BucketHashes.ChestArmor]: styles.chest,
  [BucketHashes.LegArmor]: styles.leg,
  [BucketHashes.ClassArmor]: styles.classItem,
};

export default function GearPower() {
  const stores = useSelector(storesSelector);
  const reset = () => {
    showGearPower$.next(undefined);
  };

  const selectedStoreId = useSubscription(showGearPower$);
  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  const powerLevel = useSelector((state: RootState) => powerLevelSelector(state, selectedStoreId));

  if (!selectedStore || !powerLevel) {
    return null;
  }

  const header = (
    <div className={styles.gearPowerHeader}>
      <img src={selectedStore.icon} />
      <div>
        <h1>{selectedStore.name}</h1>
        <h1 className={styles.powerLevel}>
          <AppIcon icon={powerActionIcon} />
          <FractionalPowerLevel power={powerLevel.maxGearPower} />
        </h1>
      </div>
    </div>
  );

  const exampleItem = powerLevel.highestPowerItems.find(
    (i) => i.classType === selectedStore.classType
  );
  const powerFloor = Math.floor(powerLevel.maxGearPower);
  const classFilterString = exampleItem && classFilter.fromItem!(exampleItem);
  const maxItemsSearchString = classFilterString && `${classFilterString} is:maxpower`;

  return (
    <Sheet onClose={reset} header={header} sheetClassName={styles.gearPowerSheet}>
      <div className={styles.gearPowerSheetContent}>
        <div className={styles.gearGrid}>
          {powerLevel.highestPowerItems.map((i) => {
            const powerDiff = (powerFloor - i.power) * -1;
            const diffSymbol = powerDiff >= 0 ? '+' : '';
            const diffClass =
              powerDiff > 0 ? styles.positive : powerDiff < 0 ? styles.negative : styles.neutral;
            return (
              <div
                key={i.id}
                className={clsx(bucketClassNames[i.bucket.hash as BucketHashes], styles.gearItem)}
              >
                <div onClick={() => locateItem(i)}>
                  <BungieImage src={i.icon} className={styles.itemImage} />
                </div>
                <div className={styles.gearItemInfo}>
                  <div className={styles.power}>{i.power}</div>
                  <div className={styles.statMeta}>
                    <BucketIcon className={styles.bucketImage} bucketHash={i.bucket.hash} />
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
        {powerLevel.problems.notOnStore && (
          <div className={styles.notes}>
            <AlertIcon /> {t('Loadouts.OnWrongCharacterWarning')}
            {maxItemsSearchString && (
              <p>
                <SetFilterButton filter={maxItemsSearchString} />{' '}
                {t('Loadouts.OnWrongCharacterAdvice')}
              </p>
            )}
          </div>
        )}
        {powerLevel.problems.notEquippable && (
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
