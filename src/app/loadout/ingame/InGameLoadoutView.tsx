import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import { DimItem, DimSocket, DimSocketCategory } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { loadoutConstantsSelector, useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import clsx from 'clsx';
import { t } from 'i18next';
import _ from 'lodash';
import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import PlugDef from '../loadout-ui/PlugDef';
import { useItemsFromInGameLoadout } from './ingame-loadout-utils';
import InGameLoadoutIcon from './InGameLoadoutIcon';
import styles from './InGameLoadoutView.m.scss';

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
  const defs = useD2Definitions()!;
  const loadoutConstants = useSelector(loadoutConstantsSelector);

  const itemByInstanceId = _.keyBy(loadout.items, (i) => i.itemInstanceId);

  // Turn loadout items into real DimItems
  const items = useItemsFromInGameLoadout(loadout);

  const categories = _.groupBy(items, (item) => item.bucket.sort);
  const power = loadoutPower(store, categories);

  const canDisplayCategory = (item: DimItem, category: DimSocketCategory) =>
    category.category.uiCategoryStyle !== 2251952357 &&
    getSocketsByIndexes(item.sockets!, category.socketIndexes).length > 0;

  const canDisplaySocket = (socket: DimSocket) => {
    const socketTypeHash = socket.socketDefinition.socketTypeHash;
    const socketType = defs.SocketType.get(socketTypeHash);
    console.log({ socketType, socketTypeHash });
    return (
      !loadoutConstants?.loadoutPreviewFilterOutSocketTypeHashes.includes(socketTypeHash) &&
      !loadoutConstants?.loadoutPreviewFilterOutSocketCategoryHashes.includes(
        socketType.socketCategoryHash
      )
    );
  };

  const getPluggedItem = (item: DimItem, socket: DimSocket) => {
    const pluggedItemHashes = itemByInstanceId[item.id]?.plugItemHashes ?? [];
    // TODO: Not sure if the plugItemHashes are by socket index or what. If not, we have to do a weird assignment dance to handle 2x of the same mod.
    return socket.plugOptions.find((p) => pluggedItemHashes.includes(p.plugDef.hash));
  };

  return (
    <div className={styles.loadout} id={loadout.id}>
      <div className={styles.title}>
        <h2>
          <InGameLoadoutIcon className={styles.icon} loadout={loadout} />
          {loadout.name}
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
                    <div className={styles.item} key={item.id}>
                      <DraggableInventoryItem item={item}>
                        <ItemPopupTrigger item={item}>
                          {(ref, onClick) => (
                            <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />
                          )}
                        </ItemPopupTrigger>
                      </DraggableInventoryItem>
                      {item.sockets?.categories.map(
                        (c) =>
                          canDisplayCategory(item, c) &&
                          getSocketsByIndexes(item.sockets!, c.socketIndexes).map((s) => {
                            if (canDisplaySocket(s)) {
                              const plugItem = getPluggedItem(item, s);
                              if (plugItem) {
                                // TODO: can do a better plug?
                                return (
                                  <PlugDef
                                    key={s.socketIndex}
                                    plug={plugItem.plugDef}
                                    onClick={() =>
                                      console.log(
                                        s,
                                        defs.SocketType.get(s.socketDefinition.socketTypeHash)
                                      )
                                    }
                                  />
                                );
                              }
                            }
                          })
                      )}
                    </div>
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
