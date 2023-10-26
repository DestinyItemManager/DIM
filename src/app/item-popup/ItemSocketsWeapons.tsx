import { t } from 'app/i18next-t';
import { statsMs } from 'app/inventory/store/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, faGrid, faList } from 'app/shell/icons';
import { getSocketsByIndexes, getWeaponSockets } from 'app/utils/socket-utils';
import { LookupTable } from 'app/utils/util-types';
import clsx from 'clsx';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import { DimItem, DimSocket } from '../inventory/item-types';
import { wishListSelector } from '../wishlists/selectors';
import ArchetypeSocket, { ArchetypeRow } from './ArchetypeSocket';
import ItemPerksList from './ItemPerksList';
import { PlugClickHandler } from './ItemSockets';
import './ItemSockets.scss';
import styles from './ItemSocketsWeapons.m.scss';
import Socket from './Socket';

export default function ItemSocketsWeapons({
  item,
  minimal,
  grid,
  onPlugClicked,
}: {
  item: DimItem;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
  /** Force grid style */
  grid?: boolean;
  onPlugClicked: PlugClickHandler;
}) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));
  const [listPerks, setListPerks] = useSetting('perkList');

  if (!item.sockets || !defs) {
    return null;
  }

  // Separate out perks from sockets.
  const { intrinsicSocket, perks, modSocketCategories, modSocketsByCategory } =
    getWeaponSockets(item)!;

  const mods = modSocketCategories.flatMap((c) => modSocketsByCategory.get(c)!);

  const keyStats =
    item.stats &&
    !item.itemCategoryHashes.includes(ItemCategoryHashes.Sword) &&
    !item.itemCategoryHashes.includes(ItemCategoryHashes.LinearFusionRifles) &&
    _.take(item.stats, 2).filter(
      (s) => !statsMs.includes(s.statHash) && s.statHash !== StatHashes.BlastRadius
    );

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
    <div className={clsx(styles.weaponSockets, { [styles.minimal]: minimal })}>
      {(intrinsicSocket?.plugged || (!minimal && mods.length > 0)) && (
        <ArchetypeRow minimal={minimal} isWeapons={true}>
          {intrinsicSocket?.plugged && (
            <ArchetypeSocket archetypeSocket={intrinsicSocket} item={item}>
              {!minimal && keyStats && keyStats.length > 0 && (
                <div className={styles.stats}>
                  {keyStats
                    ?.map(
                      (s) =>
                        `${s.value} ${(
                          statLabels[s.statHash as StatHashes] || s.displayProperties.name
                        ).toLowerCase()}`
                    )
                    ?.join(' / ')}
                </div>
              )}
            </ArchetypeSocket>
          )}
          {!minimal && mods.length > 0 && (
            <div className="item-sockets">{mods.map(renderSocket)}</div>
          )}
        </ArchetypeRow>
      )}
      {perks &&
        (listPerks && !minimal && !grid ? (
          <div className={styles.perks}>
            {!minimal && !grid && (
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
          <div className={styles.perks}>
            {!minimal && !grid && (
              <button
                className={styles.displayStyleButton}
                type="button"
                title={t('Sockets.ListStyle')}
                onClick={() => setListPerks(true)}
              >
                <AppIcon icon={faList} />
              </button>
            )}
            <div className={clsx('item-sockets', styles.grid)}>
              {getSocketsByIndexes(item.sockets, perks.socketIndexes).map((socketInfo) => (
                <Socket
                  key={socketInfo.socketIndex}
                  item={item}
                  socket={socketInfo}
                  wishlistRoll={wishlistRoll}
                  onClick={onPlugClicked}
                />
              ))}
            </div>
          </div>
        ))}
      {minimal && mods.length > 0 && <div className="item-sockets">{mods.map(renderSocket)}</div>}
    </div>
  );
}
