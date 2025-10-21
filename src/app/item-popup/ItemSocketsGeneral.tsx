import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { singleStoreSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { filterMap, uniqBy } from 'app/utils/collections';
import { usePlugDescriptions } from 'app/utils/plug-descriptions';
import {
  getArmorArchetypeSocket,
  getExtraIntrinsicPerkSockets,
  getGeneralSockets,
} from 'app/utils/socket-utils';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import { DimItem, DimSocket } from '../inventory/item-types';
import { wishListSelector } from '../wishlists/selectors';
import ArchetypeSocket, { ArchetypeRow } from './ArchetypeSocket';
import EmoteSockets from './EmoteSockets';
import { ItemSocketsList, PlugClickHandler } from './ItemSockets';
import * as styles from './ItemSocketsGeneral.m.scss';
import { SetBonus } from './SetBonus';
import Socket from './Socket';

export default function ItemSocketsGeneral({
  item,
  minimal,
  onPlugClicked,
}: {
  item: DimItem;
  /** minimal style used for compare */
  minimal?: boolean;
  onPlugClicked: PlugClickHandler;
}) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));
  const store = useSelector(singleStoreSelector(item.owner));

  if (!item.sockets || !defs) {
    return null;
  }

  const { intrinsicSocket, modSocketsByCategory } = getGeneralSockets(item)!;

  const emoteWheelCategory = item.sockets.categories.find(
    (c) => c.category.hash === SocketCategoryHashes.Emotes,
  );

  // exotic class armor intrinsics
  const extraIntrinsicSockets = getExtraIntrinsicPerkSockets(item);
  const archetypeSocket = getArmorArchetypeSocket(item);
  if (archetypeSocket) {
    extraIntrinsicSockets.push(archetypeSocket);
  }
  const extraIntrinsicSocketIndices = extraIntrinsicSockets.map((s) => s.socketIndex);

  // Only show the first of each style of category when minimal
  const modSocketCategories = (
    minimal && item.bucket.inArmor
      ? uniqBy(modSocketsByCategory.entries(), ([category]) => category.category.categoryStyle)
      : [...modSocketsByCategory.entries()]
  )
    .map(
      ([category, sockets]) =>
        [
          category,
          sockets.filter((s) => !extraIntrinsicSocketIndices.includes(s.socketIndex)),
        ] as const,
    )
    .filter(([, sockets]) => sockets.length > 0);

  const intrinsicRows =
    !minimal &&
    filterMap(
      [intrinsicSocket, ...extraIntrinsicSockets],
      (s) =>
        s && (
          <IntrinsicArmorPerk
            key={s.socketIndex}
            item={item}
            socket={s}
            onPlugClicked={onPlugClicked}
          />
        ),
    );

  return (
    <>
      {intrinsicRows}
      {!minimal && item.setBonus && (
        <div className="item-details">
          <SetBonus setBonus={item.setBonus} store={store} />
        </div>
      )}
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
              <SocketCategoryHeader>
                {category.category.displayProperties.name}
              </SocketCategoryHeader>
            )}
            <ItemSocketsList>
              {sockets.map((socketInfo) => (
                <Socket
                  key={socketInfo.socketIndex}
                  item={item}
                  socket={socketInfo}
                  wishlistRoll={wishlistRoll}
                  onClick={onPlugClicked}
                />
              ))}
            </ItemSocketsList>
          </div>
        ))}
      </div>
    </>
  );
}

function IntrinsicArmorPerk({
  item,
  socket,
  onPlugClicked,
}: {
  item: DimItem;
  socket: DimSocket;
  onPlugClicked: PlugClickHandler;
}) {
  const plugDescriptions = usePlugDescriptions(socket.plugged?.plugDef);
  return (
    <ArchetypeRow>
      <ArchetypeSocket
        archetypeSocket={socket}
        /* entire description is shown here, so no tooltip needed */
        noTooltip
        item={item}
        onClick={onPlugClicked}
      >
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
      </ArchetypeSocket>
    </ArchetypeRow>
  );
}

export function SocketCategoryHeader({ children }: { children: React.ReactNode }) {
  return <div className={styles.socketCategoryHeader}>{children}</div>;
}
