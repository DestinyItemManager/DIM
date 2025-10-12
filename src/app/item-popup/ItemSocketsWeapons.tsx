import { t } from 'app/i18next-t';
import { statsMs } from 'app/inventory/store/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, faGrid, faList } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getSocketsByIndexes, getWeaponSockets } from 'app/utils/socket-utils';
import { LookupTable } from 'app/utils/util-types';
import clsx from 'clsx';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { DimItem, DimSocket } from '../inventory/item-types';
import { wishListSelector } from '../wishlists/selectors';
import ArchetypeSocket, { ArchetypeRow } from './ArchetypeSocket';
import ItemPerksList from './ItemPerksList';
import { ItemSocketsList, PlugClickHandler } from './ItemSockets';
import * as styles from './ItemSocketsWeapons.m.scss';
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
  const isPhonePortrait = useIsPhonePortrait();
  const [listPerksSetting, setListPerks] = useSetting(
    isPhonePortrait ? 'perkList' : 'perkListDesktop',
  );
  const listPerks = forceGrid === undefined ? listPerksSetting : !forceGrid;

  if (!item.sockets || !defs) {
    return null;
  }

  // Separate out perks from sockets.
  const { intrinsicSocket, perks, modSocketsByCategory } = getWeaponSockets(item, {
    includeFakeMasterwork: Boolean(item.crafted),
  })!;

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

  const renderSocketWithoutEmpties = (socketInfo: DimSocket) => {
    // Prevent empty mods from showing on craftable weapons
    const socketWithoutEmpties = {
      ...socketInfo,
      plugOptions: socketInfo.plugOptions.filter(
        (option) => option.plugDef.plug.plugCategoryIdentifier !== 'crafting.recipes.empty_socket',
      ),
    };
    return !isKillTrackerSocket(socketWithoutEmpties) && renderSocket(socketWithoutEmpties);
  };

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
            {getSocketsByIndexes(item.sockets, perks.socketIndexes).map((socketInfo) =>
              renderSocketWithoutEmpties(socketInfo),
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
  const { modSocketsByCategory } = getWeaponSockets(item, {
    includeFakeMasterwork: Boolean(item.crafted),
  })!;

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
