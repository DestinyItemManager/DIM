import { t } from 'app/i18next-t';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout/loadout-types';
import { D1CharacterStats } from 'app/store-stats/D1CharacterStats';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { filterMap } from 'app/utils/collections';
import { BucketHashes } from 'data/d2/generated-enums';
import { useState } from 'react';
import { D1Item } from '../../inventory/item-types';
import { DimStore } from '../../inventory/store-types';
import ItemTalentGrid from '../../item-popup/ItemTalentGrid';
import { convertToLoadoutItem, newLoadout } from '../../loadout-drawer/loadout-utils';
import { AppIcon, faMinusSquare, faPlusSquare } from '../../shell/icons';
import { d1ArmorTypes } from './D1LoadoutBuilder';
import * as styles from './GeneratedSet.m.scss';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import { ArmorSet, ArmorTypes, SetType } from './types';

interface Props {
  store: DimStore;
  setType: SetType;
  activesets: string;
  excludeItem: (item: D1Item) => void;
}

export default function GeneratedSet({ setType, store, activesets, excludeItem }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const dispatch = useThunkDispatch();
  const subclass = findItemsByBucket(store, BucketHashes.Subclass).find((i) => i.equipped);

  const toggle = () => setCollapsed((collapsed) => !collapsed);

  const makeLoadoutFromSet = (set: ArmorSet): Loadout => {
    const items = filterMap(d1ArmorTypes, (bucketHash) => set.armor[bucketHash]?.item);

    const loadout = newLoadout(
      '',
      items.map((i) => convertToLoadoutItem(i, true)),
      store.classType,
    );
    return loadout;
  };

  const makeNewLoadout = (set: ArmorSet) => {
    editLoadout(makeLoadoutFromSet(set), store.id, {
      showClass: false,
    });
  };
  const equipItems = (set: ArmorSet) =>
    dispatch(applyLoadout(store, makeLoadoutFromSet(set), { allowUndo: true }));

  return (
    <div key={setType.set.setHash} className={styles.loadout}>
      <div className={styles.controls}>
        {setType.set.includesVendorItems ? (
          <span>{t('LB.ContainsVendorItems')}</span>
        ) : (
          <>
            <button
              type="button"
              className="dim-button"
              onClick={() => makeNewLoadout(setType.set)}
            >
              {t('Loadouts.Create')}
            </button>
            <button type="button" className="dim-button" onClick={() => equipItems(setType.set)}>
              {t('LB.Equip', { character: store.name })}
            </button>
          </>
        )}
        <div className={styles.dimStats}>
          <D1CharacterStats stats={setType.tiers[activesets].stats} subclassHash={subclass?.hash} />
        </div>
      </div>
      <div className={styles.set}>
        {Object.entries(setType.set.armor).map(([type, armorpiece]) => (
          <div key={type} className={styles.setItem}>
            <LoadoutBuilderItem shiftClickCallback={excludeItem} item={armorpiece.item} />
            <ItemTalentGrid item={armorpiece.item} className={styles.talentGrid} perksOnly={true} />
            <div className={styles.label}>
              {setType.tiers[activesets].configs[0][armorpiece.item.bucket.hash as ArmorTypes] ===
              'int'
                ? t('Stats.Intellect')
                : setType.tiers[activesets].configs[0][
                      armorpiece.item.bucket.hash as ArmorTypes
                    ] === 'dis'
                  ? t('Stats.Discipline')
                  : setType.tiers[activesets].configs[0][
                        armorpiece.item.bucket.hash as ArmorTypes
                      ] === 'str'
                    ? t('Stats.Strength')
                    : t('Stats.NoBonus')}
            </div>
            {setType.tiers[activesets].configs.map(
              (config, i) =>
                i > 0 &&
                !collapsed && (
                  <div key={i} className={styles.label}>
                    {config[armorpiece.item.bucket.hash as ArmorTypes] === 'int'
                      ? t('Stats.Intellect')
                      : config[armorpiece.item.bucket.hash as ArmorTypes] === 'dis'
                        ? t('Stats.Discipline')
                        : config[armorpiece.item.bucket.hash as ArmorTypes] === 'str'
                          ? t('Stats.Strength')
                          : t('Stats.NoBonus')}
                  </div>
                ),
            )}
          </div>
        ))}
      </div>
      {setType.tiers[activesets].configs.length > 1 && (
        <div className={styles.expandConfigs} onClick={toggle}>
          {!collapsed ? (
            <>
              <AppIcon icon={faMinusSquare} title={t('LB.HideConfigs')} />
              {t('LB.HideAllConfigs')}
            </>
          ) : (
            <>
              <AppIcon icon={faPlusSquare} title={t('LB.ShowConfigs')} />
              {t('LB.ShowAllConfigs')}
            </>
          )}
        </div>
      )}
    </div>
  );
}
