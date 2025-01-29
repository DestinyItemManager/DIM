import { t } from 'app/i18next-t';
import { statsMs } from 'app/inventory/store/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import {
  D2PlugCategoryByStatHash,
  weaponMasterworkY2SocketTypeHash,
} from 'app/search/d2-known-values';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, faGrid, faList } from 'app/shell/icons';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getSocketsByIndexes, getWeaponSockets } from 'app/utils/socket-utils';
import { LookupTable } from 'app/utils/util-types';
import clsx from 'clsx';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import { maxBy } from 'es-toolkit';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { DimItem, DimSocket } from '../inventory/item-types';
import { wishListSelector } from '../wishlists/selectors';
import ArchetypeSocket, { ArchetypeRow } from './ArchetypeSocket';
import ItemPerksList from './ItemPerksList';
import { ItemSocketsList, PlugClickHandler } from './ItemSockets';
import styles from './ItemSocketsWeapons.m.scss';
import Socket from './Socket';
import SocketDetails from './SocketDetails';

export default function ItemSocketsWeapons({
  item,
  minimal,
  grid: forceGrid,
  onPlugClicked,
}: {
  item: DimItem;
  /** minimal style used for compare. suppresses the archetype/mods row */
  minimal?: boolean;
  /** Force grid style */
  grid?: boolean;
  onPlugClicked: PlugClickHandler;
}) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));
  const [listPerksSetting, setListPerks] = useSetting('perkList');
  const listPerks = forceGrid === undefined ? listPerksSetting : !forceGrid;

  if (!item.sockets || !defs) {
    return null;
  }

  if (item.crafted) {
    const y2MasterworkSocket = item.sockets?.allSockets.find(
      (socket) => socket.socketDefinition.socketTypeHash === weaponMasterworkY2SocketTypeHash,
    );
    const plugSet = y2MasterworkSocket?.plugSet;
    if (y2MasterworkSocket && plugSet) {
      // const plug = y2MasterworkSocket?.plugSet?.plugs.find(
      //   (p) => p.plugDef.plug.plugCategoryHash === PlugCategoryHashes.V400PlugsWeaponsMasterworks,
      // );
      const mwHash = item.masterworkInfo?.stats?.find((s) => s.isPrimary)?.hash || 0;
      const newCategory =
        mwHash in D2PlugCategoryByStatHash
          ? D2PlugCategoryByStatHash[mwHash as keyof typeof D2PlugCategoryByStatHash]
          : null;
      let fullMasterworkPlug = newCategory
        ? maxBy(
            plugSet.plugs.filter((p) => p.plugDef.plug.plugCategoryHash === newCategory),
            (plugOption) => plugOption.plugDef.investmentStats[0]?.value,
          )
        : null;
      if (fullMasterworkPlug) {
        fullMasterworkPlug = {
          ...fullMasterworkPlug,
          plugDef: { ...fullMasterworkPlug.plugDef, iconWatermark: '', investmentStats: [] },
        };
        y2MasterworkSocket.plugged = fullMasterworkPlug;
        y2MasterworkSocket.plugOptions = [fullMasterworkPlug];
        y2MasterworkSocket.visibleInGame = true;
        y2MasterworkSocket.reusablePlugItems = [];
        y2MasterworkSocket.isPerk = true;
      }
    }
  }

  // Separate out perks from sockets.
  const { intrinsicSocket, perks, modSocketsByCategory } = getWeaponSockets(item)!;

  // Improve this when we use iterator-helpers
  const mods = [...modSocketsByCategory.values()].flat();

  const keyStats =
    item.stats &&
    !item.itemCategoryHashes.includes(ItemCategoryHashes.Sword) &&
    !item.itemCategoryHashes.includes(ItemCategoryHashes.LinearFusionRifles) &&
    item.stats
      .slice(0, 2)
      .filter((s) => !statsMs.includes(s.statHash) && s.statHash !== StatHashes.BlastRadius);

  // Some stat labels are long. This lets us replace them with i18n
  const statLabels: LookupTable<StatHashes, string> = {
    [StatHashes.RoundsPerMinute]: t('Organizer.Stats.RPM'),
  };

  const renderSocket = (socketInfo: DimSocket) => (
    <Socket
      key={socketInfo.socketIndex}
      item={item}
      socket={socketInfo}
      wishlistRoll={wishlistRoll}
      onClick={onPlugClicked}
    />
  );

  return (
    <>
      {!minimal && (intrinsicSocket?.plugged || mods.length > 0) && (
        <ArchetypeRow isWeapons className={styles.archetype}>
          {intrinsicSocket?.plugged && (
            <ArchetypeSocket archetypeSocket={intrinsicSocket} item={item}>
              {keyStats && keyStats.length > 0 && (
                <div className={styles.stats}>
                  {keyStats
                    ?.map(
                      (s) =>
                        `${s.value} ${(
                          statLabels[s.statHash as StatHashes] || s.displayProperties.name
                        ).toLowerCase()}`,
                    )
                    ?.join(' / ')}
                </div>
              )}
            </ArchetypeSocket>
          )}
          {mods.length > 0 && <ItemSocketsList>{mods.map(renderSocket)}</ItemSocketsList>}
        </ArchetypeRow>
      )}
      {perks &&
        (listPerks ? (
          <div className={styles.perks}>
            {!forceGrid && (
              <button
                className={styles.displayStyleButton}
                type="button"
                title={t('Sockets.GridStyle')}
                onClick={() => setListPerks(false)}
              >
                <AppIcon icon={faGrid} />
              </button>
            )}
            <ItemPerksList item={item} perks={perks} onClick={onPlugClicked} />
          </div>
        ) : (
          <div className={clsx(styles.perks, styles.grid, { [styles.gridLines]: !minimal })}>
            {!forceGrid && (
              <button
                className={styles.displayStyleButton}
                type="button"
                title={t('Sockets.ListStyle')}
                onClick={() => setListPerks(true)}
              >
                <AppIcon icon={faList} />
              </button>
            )}
            {getSocketsByIndexes(item.sockets, perks.socketIndexes).map(
              (socketInfo) =>
                !isKillTrackerSocket(socketInfo) && (
                  <Socket
                    key={socketInfo.socketIndex}
                    item={item}
                    socket={socketInfo}
                    wishlistRoll={wishlistRoll}
                    onClick={onPlugClicked}
                  />
                ),
            )}
          </div>
        ))}
    </>
  );
}

// TODO: just pass in sockets?
export function ItemModSockets({
  item,
  onPlugClicked,
}: {
  item: DimItem;
  onPlugClicked?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));
  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);

  if (!item.sockets || !defs) {
    return null;
  }

  // Separate out perks from sockets.
  const { modSocketsByCategory } = getWeaponSockets(item)!;

  // Improve this when we use iterator-helpers
  const mods = [...modSocketsByCategory.values()].flat();

  const handlePlugClick: PlugClickHandler = (item, socket, plug, hasMenu) => {
    if (hasMenu) {
      setSocketInMenu(socket);
    } else {
      onPlugClicked?.({
        item,
        socket,
        plugHash: plug.plugDef.hash,
      });
    }
  };

  const renderSocket = (socketInfo: DimSocket) => (
    <Socket
      key={socketInfo.socketIndex}
      item={item}
      socket={socketInfo}
      wishlistRoll={wishlistRoll}
      onClick={handlePlugClick}
    />
  );

  return (
    <>
      {mods.length > 0 && <ItemSocketsList>{mods.map(renderSocket)}</ItemSocketsList>}{' '}
      {socketInMenu && (
        <SocketDetails
          key={socketInMenu.socketIndex}
          item={item}
          socket={socketInMenu}
          allowInsertPlug
          onClose={() => setSocketInMenu(null)}
          onPlugSelected={onPlugClicked}
        />
      )}
    </>
  );
}
