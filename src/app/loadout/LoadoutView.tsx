import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { getLight, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { ReactNode, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import LoadoutItemCategorySection from './loadout-ui/LoadoutItemCategorySection';
import LoadoutSubclassSection from './loadout-ui/LoadoutSubclassSection';
import PlugDef from './loadout-ui/PlugDef';
import styles from './LoadoutView.m.scss';
import ModAssignmentDrawer from './mod-assignment-drawer/ModAssignmentDrawer';
import { createGetModRenderKey } from './mod-utils';

/**
 * A presentational component for a single loadout.
 *
 * The only functionality this provides outside of
 * rendering is the ability to show the mod assignment drawer. If mods are present on the loadout a
 * button will by present under the mods section to activate the drawer.
 */
export default function LoadoutView({
  loadout,
  store,
  actionButtons,
  hideOptimizeArmor,
}: {
  loadout: Loadout;
  store: DimStore;
  actionButtons: ReactNode[];
  hideOptimizeArmor?: boolean;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const getModRenderKey = createGetModRenderKey();
  const [showModAssignmentDrawer, setShowModAssignmentDrawer] = useState(false);

  // Turn loadout items into real DimItems, filtering out unequippable items
  const [items, subclass, warnitems] = useMemo(() => {
    const [items, warnitems] = getItemsFromLoadoutItems(loadout.items, defs, buckets, allItems);
    let subclass: DimLoadoutItem | undefined;
    for (const storeItem of items) {
      if (storeItem.bucket.hash === BucketHashes.Subclass) {
        const loadoutItem = items.find((loadoutItem) => loadoutItem.hash === storeItem.hash);
        if (loadoutItem) {
          subclass = { ...storeItem, socketOverrides: loadoutItem.socketOverrides };
          break;
        }
      }
    }
    let equippableItems = items.filter((i) => itemCanBeEquippedBy(i, store, true));
    if (subclass) {
      equippableItems = equippableItems.filter((i) => i.hash !== subclass!.hash);
    }
    return [equippableItems, subclass, warnitems];
  }, [loadout.items, defs, buckets, allItems, store]);

  const savedMods = getModsFromLoadout(defs, loadout);
  const equippedItemIds = new Set(loadout.items.filter((i) => i.equipped).map((i) => i.id));

  const categories = _.groupBy(items.concat(warnitems), (i) => i.bucket.sort);

  const showPower = categories.Weapons?.length === 3 && categories.Armor?.length === 5;
  const power = showPower
    ? Math.floor(getLight(store, [...categories.Weapons, ...categories.Armor]))
    : 0;

  return (
    <div className={styles.loadout} id={loadout.id}>
      <div className={styles.title}>
        <h2>
          <ClassIcon className={styles.classIcon} classType={loadout.classType} />
          {loadout.name}
          {warnitems.length > 0 && (
            <span className={styles.missingItems}>
              <AppIcon className="warning-icon" icon={faExclamationTriangle} />
              {t('Loadouts.MissingItemsWarning')}
            </span>
          )}
        </h2>
        <div className={styles.actions}>{actionButtons}</div>
      </div>
      {loadout.notes && <div className={styles.loadoutNotes}>{loadout.notes}</div>}
      <div className={styles.contents}>
        {(items.length > 0 || subclass || savedMods.length > 0) && (
          <>
            <div>
              <LoadoutSubclassSection defs={defs} subclass={subclass} power={power} />
            </div>
            {['Weapons', 'Armor', 'General'].map((category) => (
              <LoadoutItemCategorySection
                key={category}
                category={category}
                subclass={subclass}
                items={categories[category]}
                savedMods={savedMods}
                equippedItemIds={equippedItemIds}
                loadout={loadout}
                hideOptimizeArmor={hideOptimizeArmor}
              />
            ))}
            {savedMods.length > 0 ? (
              <div className={styles.mods}>
                <div className={styles.modsGrid}>
                  {savedMods.map((mod) => (
                    <PlugDef key={getModRenderKey(mod)} plug={mod} />
                  ))}
                </div>
                <button
                  className={clsx('dim-button', styles.showModPlacementButton)}
                  type="button"
                  title="Show mod placement"
                  onClick={() => setShowModAssignmentDrawer(true)}
                >
                  {t('Loadouts.ShowModPlacement')}
                </button>
              </div>
            ) : (
              <div className={styles.modsPlaceholder}>{t('Loadouts.Mods')}</div>
            )}
          </>
        )}
      </div>
      {showModAssignmentDrawer &&
        ReactDOM.createPortal(
          <ModAssignmentDrawer
            loadout={loadout}
            onClose={() => setShowModAssignmentDrawer(false)}
          />,
          document.body
        )}
    </div>
  );
}
