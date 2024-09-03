import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useD2Definitions } from 'app/manifest/selectors';
import { filterMap, uniqBy } from 'app/utils/collections';
import { usePlugDescriptions } from 'app/utils/plug-descriptions';
import { getExtraIntrinsicPerkSockets, getGeneralSockets } from 'app/utils/socket-utils';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import { DimItem, DimSocket } from '../inventory/item-types';
import { wishListSelector } from '../wishlists/selectors';
import ArchetypeSocket, { ArchetypeRow } from './ArchetypeSocket';
import EmoteSockets from './EmoteSockets';
import { PlugClickHandler } from './ItemSockets';
import './ItemSockets.scss';
import styles from './ItemSocketsGeneral.m.scss';
import Socket from './Socket';

export default function ItemSocketsGeneral({
  item,
  minimal,
  onPlugClicked,
}: {
  item: DimItem;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
  onPlugClicked: PlugClickHandler;
}) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));

  if (!item.sockets || !defs) {
    return null;
  }

  const { intrinsicSocket, modSocketsByCategory } = getGeneralSockets(item)!;

  const emoteWheelCategory = item.sockets.categories.find(
    (c) => c.category.hash === SocketCategoryHashes.Emotes,
  );

  // exotic class armor intrinsics
  const extraIntrinsicSockets = getExtraIntrinsicPerkSockets(item);
  const extraIntrinsicSocketIndices = extraIntrinsicSockets.map((s) => s.socketIndex);

  // Only show the first of each style of category when minimal
  const modSocketCategories = (
    minimal
      ? uniqBy(modSocketsByCategory.entries(), ([category]) => category.category.categoryStyle)
      : // This might not be necessary with iterator-helpers
        [...modSocketsByCategory.entries()]
  )
    .map(
      ([category, sockets]) =>
        [
          category,
          sockets.filter((s) => !extraIntrinsicSocketIndices.includes(s.socketIndex)),
        ] as const,
    )
    .filter(([, sockets]) => sockets.length > 0);

  const intrinsicRows = filterMap(
    [intrinsicSocket, ...extraIntrinsicSockets],
    (s) =>
      s && (
        <IntrinsicArmorPerk
          key={s.socketIndex}
          item={item}
          socket={s}
          minimal={minimal}
          onPlugClicked={onPlugClicked}
        />
      ),
  );

  return (
    <>
      {!minimal && intrinsicRows}
      <div className={clsx(styles.generalSockets, { [styles.minimalSockets]: minimal })}>
        {emoteWheelCategory && (
          <EmoteSockets
            item={item}
            itemDef={defs.InventoryItem.get(item.hash)}
            sockets={emoteWheelCategory.socketIndexes.map((s) => item.sockets!.allSockets[s])}
            onClick={onPlugClicked}
          />
        )}
        {modSocketCategories.map(([category, sockets]) => (
          <div key={category.category.hash}>
            {!minimal && (
              <div className="item-socket-category-name">
                {category.category.displayProperties.name}
              </div>
            )}
            <div className="item-sockets">
              {sockets.map((socketInfo) => (
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
      </div>
      {minimal && intrinsicRows}
    </>
  );
}

function IntrinsicArmorPerk({
  item,
  socket,
  minimal,
  onPlugClicked,
}: {
  item: DimItem;
  socket: DimSocket;
  minimal?: boolean;
  onPlugClicked: PlugClickHandler;
}) {
  const plugDescriptions = usePlugDescriptions(socket.plugged?.plugDef);
  return (
    <ArchetypeRow minimal={minimal}>
      <ArchetypeSocket
        archetypeSocket={socket}
        /* entire description is shown when not minimal, so no tooltip needed then */
        noTooltip={!minimal}
        item={item}
        onClick={onPlugClicked}
      >
        {!minimal && (
          <div className={styles.armorIntrinsicDescription}>
            {plugDescriptions.perks.map(
              (perkDesc) =>
                perkDesc.description && (
                  <RichDestinyText key={perkDesc.perkHash} text={perkDesc.description} />
                ),
            )}
            {plugDescriptions.communityInsight && (
              <ClarityDescriptions
                perk={plugDescriptions.communityInsight}
                className={styles.clarityDescription}
              />
            )}
          </div>
        )}
      </ArchetypeSocket>
    </ArchetypeRow>
  );
}
