import { AlertIcon } from 'app/dim-ui/AlertIcon';
import BungieImage from 'app/dim-ui/BungieImage';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import { SetFilterButton } from 'app/dim-ui/SetFilterButton';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { t } from 'app/i18next-t';
import { locateItem } from 'app/inventory/locate-item';
import { maxLightItemSet } from 'app/loadout-drawer/auto-loadouts';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { classFilter } from 'app/search/search-filters/known-values';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import { useSubscription } from 'use-subscription';
import Sheet from '../dim-ui/Sheet';
import { allItemsSelector, storesSelector } from '../inventory/selectors';
import { showGearPower$ } from './gear-power';
import styles from './GearPower.m.scss';

const bucketClassNames: Partial<Record<BucketHashes, string>> = {
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
  const allItems = useSelector(allItemsSelector);
  const reset = () => {
    showGearPower$.next(undefined);
  };

  const selectedStoreId = useSubscription(showGearPower$);
  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  if (!selectedStore) {
    return null;
  }

  const { unrestricted, equippable } = maxLightItemSet(allItems, selectedStore);
  const maxBasePower = getLight(selectedStore, unrestricted);
  const equippableMaxBasePower = getLight(selectedStore, equippable);
  const powerFloor = Math.floor(maxBasePower);
  const header = (
    <div className={styles.gearPowerHeader}>
      <img src={selectedStore.icon} />
      <div>
        <h1>{selectedStore.name}</h1>
        <h1 className={styles.powerLevel}>
          <AppIcon icon={powerActionIcon} />
          <FractionalPowerLevel power={maxBasePower} />
        </h1>
      </div>
    </div>
  );

  const exampleItem = equippable.find((i) => i.classType === selectedStore.classType);
  const classFilterString = exampleItem && classFilter.fromItem!(exampleItem);
  const maxItemsSearchString = classFilterString && `${classFilterString} is:maxpower`;

  return (
    <Sheet onClose={reset} header={header} sheetClassName={styles.gearPowerSheet}>
      <div className={styles.gearPowerSheetContent}>
        <div className={styles.gearGrid}>
          {unrestricted.map((i) => {
            const powerDiff = (powerFloor - i.power) * -1;
            const diffSymbol = powerDiff >= 0 ? '+' : '';
            const diffClass =
              powerDiff > 0 ? styles.positive : powerDiff < 0 ? styles.negative : styles.neutral;
            return (
              <div key={i.id} className={clsx(bucketClassNames[i.bucket.hash], styles.gearItem)}>
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
        {selectedStore.stats.maxGearPower?.statProblems?.notOnStore && (
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
