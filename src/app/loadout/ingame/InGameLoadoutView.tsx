import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { convertInGameLoadoutPlugItemHashesToSocketOverrides } from 'app/loadout-drawer/loadout-type-converters';
import { InGameLoadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { t } from 'i18next';
import _ from 'lodash';
import { ReactNode, useMemo } from 'react';
import LoadoutSubclassSection from '../loadout-ui/LoadoutSubclassSection';
import PlugDef from '../loadout-ui/PlugDef';
import { createGetModRenderKey, isInsertableArmor2Mod } from '../mod-utils';
import InGameLoadoutIcon from './InGameLoadoutIcon';
import styles from './InGameLoadoutView.m.scss';
import { useItemsFromInGameLoadout } from './ingame-loadout-utils';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
};

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
  // Turn loadout items into real DimItems
  const items = useItemsFromInGameLoadout(loadout);

  const categories = _.groupBy(items, (item) => item.bucket.sort);
  const power = loadoutPower(store, categories);

  const subclassItem = categories['General']?.[0];
  const subclassInGameLoadoutItem = loadout.items.find((i) => i.itemInstanceId === subclassItem.id);
  const subclass: ResolvedLoadoutItem | undefined = subclassItem && {
    item: subclassItem,
    loadoutItem: {
      hash: subclassItem.hash,
      id: subclassItem.id,
      amount: 1,
      equip: true,
      socketOverrides:
        subclassInGameLoadoutItem &&
        convertInGameLoadoutPlugItemHashesToSocketOverrides(
          subclassInGameLoadoutItem.plugItemHashes
        ),
    },
  };

  return (
    <div className={styles.loadout} id={loadout.id}>
      <div className={styles.title}>
        <h2>
          <InGameLoadoutIcon className={styles.icon} loadout={loadout} />
          {loadout.name}
          <span className={styles.loadoutSlot}>
            {t('InGameLoadout.LoadoutSlotNum', { index: loadout.index + 1 })}
          </span>
        </h2>
        <div className={styles.actions}>{actionButtons}</div>
      </div>
      <div className={styles.contents}>
        {subclass && <LoadoutSubclassSection subclass={subclass} power={power} />}
        {items.length > 0 &&
          (['Weapons', 'Armor'] as const).map((category) => (
            <div key={category} className={clsx(styles.itemCategory, categoryStyles[category])}>
              {categories[category] ? (
                <div className={styles.itemsInCategory}>
                  {categories[category]?.map((item) => (
                    <InGameLoadoutItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className={clsx(styles.placeholder, `category-${category}`)}>
                  {t(`Bucket.${category}`, { metadata: { keys: 'buckets' } })}
                </div>
              )}
            </div>
          ))}
        <InGameLoadoutMods items={items} classType={store.classType} />
      </div>
    </div>
  );
}

function InGameLoadoutItem({ item }: { item: DimItem }) {
  // TODO: we should show plugged sockets eventually
  return (
    <div>
      <DraggableInventoryItem item={item}>
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />
          )}
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    </div>
  );
}

function InGameLoadoutMods({ items, classType }: { items: DimItem[]; classType: DestinyClass }) {
  const mods = useMemo(() => {
    const mods: PluggableInventoryItemDefinition[] = [];

    // I don't believe we need to handle mods that have been "upgraded" like DIM loadouts as these are
    // pulled directly from the items themselves.
    for (const item of items) {
      for (const socket of getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorMods)) {
        if (socket.plugged && isInsertableArmor2Mod(socket.plugged.plugDef)) {
          mods.push(socket.plugged.plugDef);
        }
      }
    }

    return mods;
  }, [items]);

  const getModRenderKey = useMemo(() => createGetModRenderKey(), []);
  return (
    <div className={styles.modsGrid}>
      {mods.map((mod) => (
        <PlugDef key={getModRenderKey(mod)} plug={mod} forClassType={classType} />
      ))}
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
