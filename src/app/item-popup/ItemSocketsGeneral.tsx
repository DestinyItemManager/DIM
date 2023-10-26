import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useD2Definitions } from 'app/manifest/selectors';
import { usePlugDescriptions } from 'app/utils/plug-descriptions';
import { getGeneralSockets } from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
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

  const modSockets = getGeneralSockets(item)!;

  const emoteWheelCategory = item.sockets.categories.find(
    (c) => c.category.hash === SocketCategoryHashes.Emotes
  );

  let { modSocketCategories } = modSockets;
  const { intrinsicSocket, modSocketsByCategory } = modSockets;

  if (minimal) {
    // Only show the first of each style of category
    const categoryStyles = new Set<DestinySocketCategoryStyle>();
    modSocketCategories = modSocketCategories.filter((c) => {
      if (!categoryStyles.has(c.category.categoryStyle)) {
        categoryStyles.add(c.category.categoryStyle);
        return true;
      }
      return false;
    });
  }

  const intrinsicRow = intrinsicSocket && (
    <IntrinsicArmorPerk
      item={item}
      socket={intrinsicSocket}
      minimal={minimal}
      onPlugClicked={onPlugClicked}
    />
  );

  return (
    <>
      {!minimal && intrinsicRow}
      <div className={clsx(styles.generalSockets, { [styles.minimalSockets]: minimal })}>
        {emoteWheelCategory && (
          <EmoteSockets
            item={item}
            itemDef={defs.InventoryItem.get(item.hash)}
            sockets={emoteWheelCategory.socketIndexes.map((s) => item.sockets!.allSockets[s])}
            onClick={onPlugClicked}
          />
        )}
        {modSocketCategories.map((category) => (
          <div key={category.category.hash}>
            {!minimal && (
              <div className="item-socket-category-name">
                {category.category.displayProperties.name}
              </div>
            )}
            <div className="item-sockets">
              {modSocketsByCategory
                .get(category)
                ?.map((socketInfo) => (
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
      {minimal && intrinsicRow}
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
                )
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
