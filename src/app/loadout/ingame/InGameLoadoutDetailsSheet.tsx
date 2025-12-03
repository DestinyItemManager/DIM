import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import ItemIcon from 'app/inventory/ItemIcon';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { DimStore } from 'app/inventory/store-types';
import Socket from 'app/item-popup/Socket';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { convertInGameLoadoutToDimLoadout } from 'app/loadout/loadout-type-converters';
import { InGameLoadout, Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getSocketsByCategoryHashes, socketContainsIntrinsicPlug } from 'app/utils/socket-utils';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { keyBy, partition } from 'es-toolkit';
import React from 'react';
import { useSelector } from 'react-redux';
import Sheet from '../../dim-ui/Sheet';
import { allItemsSelector, bucketsSelector } from '../../inventory/selectors';
import * as styles from './InGameLoadoutDetailsSheet.m.scss';
import { InGameLoadoutIconWithIndex } from './InGameLoadoutIcon';
import { applyInGameLoadout, deleteInGameLoadout } from './ingame-loadout-apply';
import { gameLoadoutCompatibleBuckets, useItemsFromInGameLoadout } from './ingame-loadout-utils';

export function InGameLoadoutDetails({
  store,
  loadout,
  onShare,
  onEdit,
  onClose,
}: {
  store: DimStore;
  loadout: InGameLoadout;
  onShare: (loadout: Loadout) => void;
  onEdit: (loadout: InGameLoadout) => void;
  onClose: () => void;
}) {
  const dispatch = useThunkDispatch();
  const buckets = useSelector(bucketsSelector)!;
  const resolvedItems = useItemsFromInGameLoadout(loadout);
  const itemsByBucketHash = keyBy(resolvedItems, (i) => i.item.bucket.hash);
  const allItems = useSelector(allItemsSelector);
  const handleSaveAsDIM = () => {
    const dimLoadout = convertInGameLoadoutToDimLoadout(loadout, store.classType, allItems);
    editLoadout(dimLoadout, store.id);
  };

  const handleShare = () => {
    const dimLoadout = convertInGameLoadoutToDimLoadout(loadout, store.classType, allItems);
    onShare(dimLoadout);
  };
  const header = (
    <div className={styles.header}>
      <InGameLoadoutIconWithIndex loadout={loadout} />
      <h1>{loadout.name}</h1>
    </div>
  );

  return (
    <Sheet onClose={onClose} header={header} sheetClassName={styles.sheet} allowClickThrough>
      <div className={styles.controls}>
        <button
          type="button"
          className="dim-button"
          onClick={() => dispatch(applyInGameLoadout(loadout))}
        >
          {t('LoadoutBuilder.EquipItems')}
        </button>
        <button
          type="button"
          className="dim-button"
          onClick={() => dispatch(applyInGameLoadout(loadout, false))}
        >
          {t('InGameLoadout.PrepareEquip')}
        </button>
        <button type="button" className="dim-button" onClick={() => onEdit(loadout)}>
          {t('InGameLoadout.EditIdentifiers')}
        </button>
        <button type="button" className="dim-button" onClick={handleSaveAsDIM}>
          {t('Loadouts.SaveAsDIM')}
        </button>
        <button type="button" className="dim-button" onClick={handleShare}>
          {t('Loadouts.ShareLoadout')}
        </button>
        <ConfirmButton danger onClick={() => dispatch(deleteInGameLoadout(loadout))}>
          {t('InGameLoadout.ClearSlot', { index: loadout.index + 1 })}
        </ConfirmButton>
      </div>
      <div className={styles.itemGroups}>
        {partition(gameLoadoutCompatibleBuckets, (h) => buckets.byHash[h].sort !== 'Armor').map(
          (group) => (
            <div key={group[0]} className={styles.loadoutGrid}>
              {group.map((h) => {
                const resolvedItem = itemsByBucketHash[h];
                return (
                  resolvedItem && (
                    <InGameLoadoutItemDetail
                      key={resolvedItem.item.id}
                      resolvedItem={resolvedItem}
                    />
                  )
                );
              })}
            </div>
          ),
        )}
      </div>
    </Sheet>
  );
}

// Note that the item has already had socket overrides applied by useItemsFromInGameLoadout
function InGameLoadoutItemDetail({
  resolvedItem: { item, loadoutItem },
}: {
  resolvedItem: ResolvedLoadoutItem;
}) {
  // We can't just go off the plugItemHashes because they can contain UNSET_PLUG_HASH for
  // perks with a single option
  const validSockets = item.sockets?.allSockets.filter(
    (s) =>
      loadoutItem.socketOverrides?.[s.socketIndex] ||
      (s.isPerk &&
        !socketContainsIntrinsicPlug(s) &&
        !isKillTrackerSocket(s) &&
        s.plugged?.plugDef.displayProperties.name),
  );

  const cosmeticSockets = getSocketsByCategoryHashes(item.sockets, [
    SocketCategoryHashes.ArmorCosmetics,
    SocketCategoryHashes.WeaponCosmetics,
  ]);

  const subclassAbilitySockets = getSocketsByCategoryHashes(item.sockets, [
    SocketCategoryHashes.Abilities_Abilities,
    SocketCategoryHashes.Abilities_Abilities_Ikora,
  ]);

  const [smallSockets, bigSockets] = partition(
    validSockets ?? [],
    (s) =>
      // Shaders and ornaments should be small
      cosmeticSockets.includes(s) ||
      // subclass mods that aren't super/aspect/fragment should be small (Grenade, jump, etc)
      subclassAbilitySockets.includes(s),
  );
  return (
    <React.Fragment key={item.id}>
      <div className={styles.itemImage}>
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <div ref={ref} className="item" onClick={onClick}>
              <ItemIcon item={item} />
            </div>
          )}
        </ItemPopupTrigger>
      </div>
      {bigSockets.map((socket) => (
        <Socket key={socket.socketIndex} item={item} socket={socket} pluggedOnly />
      ))}
      <div className={styles.smallSockets}>
        {smallSockets.map((socket) => (
          <Socket key={socket.socketIndex} item={item} socket={socket} pluggedOnly />
        ))}
      </div>
    </React.Fragment>
  );
}
