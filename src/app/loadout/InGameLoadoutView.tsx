import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styles from './InGameLoadoutView.m.scss';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

export function getItemsFromLoadout(
  loadoutItems: DestinyLoadoutItemComponent[],
  allItems: DimItem[]
): DimItem[] {
  const itemIds = new Set([...loadoutItems.map((li) => li.itemInstanceId)]);
  return allItems.filter((i) => (i.bucket.inWeapons || i.bucket.inArmor) && itemIds.has(i.id));
}

/**
 * A presentational component for a single in-game loadout.
 */
export default function InGameLoadoutView({
  loadout,
  store,
  actionButtons,
}: {
  loadout: InGameLoadout;
  store: DimStore;
  actionButtons: ReactNode[];
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);

  // Turn loadout items into real DimItems
  const items = useMemo(
    () => getItemsFromLoadout(loadout.items, allItems),
    [loadout.items, allItems]
  );

  const categories = _.groupBy(items, (item) => item.bucket.sort);
  const power = loadoutPower(store, categories);

  const name = defs.LoadoutName.get(loadout.nameHash)?.name ?? 'Unknown';
  const color = defs.LoadoutColor.get(loadout.colorHash)?.colorImagePath ?? '';
  const icon = defs.LoadoutIcon.get(loadout.iconHash)?.iconImagePath ?? '';

  return (
    <div className={styles.loadout} id={`ingame-${loadout.index}`}>
      <div className={styles.title}>
        <h2>
          <BungieImage
            className={styles.icon}
            style={bungieBackgroundStyle(color)}
            src={icon}
            height={32}
            width={32}
          />
          {name}
          {power !== 0 && (
            <div className={styles.power}>
              <AppIcon icon={powerActionIcon} />
              <span>{power}</span>
            </div>
          )}
        </h2>
        <div className={styles.actions}>{actionButtons}</div>
      </div>
      <div className={styles.contents}>
        {items.length > 0 &&
          (['Weapons', 'Armor'] as const).map((category) => (
            <div key={category} className={clsx(styles.itemCategory, categoryStyles[category])}>
              {categories[category] ? (
                <div className={styles.itemsInCategory}>
                  {categories[category]?.map((item) => (
                    <DraggableInventoryItem item={item} key={item.id}>
                      <ItemPopupTrigger item={item}>
                        {(ref, onClick) => (
                          <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />
                        )}
                      </ItemPopupTrigger>
                    </DraggableInventoryItem>
                  ))}
                </div>
              ) : (
                <div className={clsx(styles.placeholder, `category-${category}`)}>
                  {t(`Bucket.${category}`, { metadata: { keys: 'buckets' } })}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export function loadoutPower(store: DimStore, categories: _.Dictionary<DimItem[]>) {
  const showPower =
    (categories.Weapons ?? []).length === 3 && (categories.Armor ?? []).length === 5;
  const power = showPower
    ? Math.floor(getLight(store, [...categories.Weapons, ...categories.Armor]))
    : 0;

  return power;
}
