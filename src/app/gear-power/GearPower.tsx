import BungieImage from 'app/dim-ui/BungieImage';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import RadioButtons from 'app/dim-ui/RadioButtons';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { t } from 'app/i18next-t';
import { locateItem } from 'app/inventory/locate-item';
import { powerLevelSelector } from 'app/inventory/store/selectors';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { LookupTable } from 'app/utils/util-types';
import clsx from 'clsx';
import rarityIcons from 'data/d2/engram-rarity-icons.json';
import { BucketHashes } from 'data/d2/generated-enums';
import { useState } from 'react';
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

  const [whichGear, setWhichGear] = useState<'drop' | 'equip'>('drop');

  if (!selectedStore || !powerLevel) {
    return null;
  }

  const header = (
    <div className={styles.gearPowerHeader}>
      <img src={selectedStore.icon} />
      <h1>{selectedStore.name}</h1>
    </div>
  );

  const powerFloor = Math.floor(
    whichGear === 'drop' ? powerLevel.dropPower : powerLevel.maxEquippableGearPower,
  );
  const items =
    whichGear === 'drop' ? powerLevel.dropCalcItems : powerLevel.maxEquippablePowerItems;
  return (
    <Sheet onClose={reset} header={header} sheetClassName={styles.gearPowerSheet}>
      <RadioButtons
        className={styles.toggle}
        value={whichGear}
        onChange={setWhichGear}
        options={[
          {
            label: (
              <div className={styles.powerToggleButton}>
                <span>{t('Stats.EquippableGear')}</span>
                <span className={styles.powerLevel}>
                  <AppIcon icon={powerActionIcon} />
                  <FractionalPowerLevel power={powerLevel.maxEquippableGearPower} />
                </span>
              </div>
            ),
            tooltip: t('Stats.MaxGearPowerOneExoticRule'),
            value: 'equip',
          },
          {
            label: (
              <div className={styles.powerToggleButton}>
                <span>{t('Stats.DropLevel')}</span>
                <span className={styles.powerLevel}>
                  <BungieImage src={rarityIcons.Legendary} />
                  <FractionalPowerLevel power={powerLevel.dropPower} />
                </span>
              </div>
            ),
            tooltip: t('Stats.DropLevelExplanation1'),
            value: 'drop',
          },
        ]}
      />
      <div className={styles.gearPowerSheetContent}>
        <div className={styles.gearGrid}>
          {items.map((i) => {
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
        <div className={styles.footNote}>
          {whichGear === 'equip' ? (
            t('Stats.MaxGearPowerOneExoticRule')
          ) : (
            <>
              <p>{t('Stats.DropLevelExplanation1')}</p>
              <p>{t('Stats.DropLevelExplanation2')}</p>
            </>
          )}
        </div>
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

// t('Loadouts.OnWrongCharacterWarning') and t('Loadouts.OnWrongCharacterAdvice') and t('Loadouts.EquippableDifferent1') and t('Loadouts.EquippableDifferent2')
// used to live in this file
