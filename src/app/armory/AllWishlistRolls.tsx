import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import Plug from 'app/item-popup/Plug';
import { wishListRollsForItemHashSelector } from 'app/wishlists/selectors';
import { WishListRoll } from 'app/wishlists/types';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './AllWishlistRolls.m.scss';

/**
 * List out all the known wishlist rolls for a given item.
 *
 * This is currently only used with a fake definitions-built item,
 * that has every perk available in each perk socket
 * (with some overrides to set some as "plugged", when spawned from a real item).
 * This would render much weirder if it were fed an owned inventory item.
 */
export default function AllWishlistRolls({
  item,
  realAvailablePlugHashes,
}: {
  item: DimItem;
  // non-plugged, but available, plugs, from the real item this was spawned from.
  // used to mark sockets as available
  realAvailablePlugHashes?: number[];
}) {
  const wishlistRolls = useSelector(wishListRollsForItemHashSelector(item.hash));
  const [goodRolls, badRolls] = _.partition(wishlistRolls, (r) => !r.isUndesirable);

  return (
    <>
      {goodRolls.length > 0 && (
        <>
          <h2>{t('Armory.WishlistedRolls', { count: goodRolls.length })}</h2>
          <WishlistRolls
            item={item}
            wishlistRolls={goodRolls}
            realAvailablePlugHashes={realAvailablePlugHashes}
          />
        </>
      )}
      {badRolls.length > 0 && (
        <>
          <h2>{t('Armory.TrashlistedRolls', { count: badRolls.length })}</h2>
          <WishlistRolls
            item={item}
            wishlistRolls={badRolls}
            realAvailablePlugHashes={realAvailablePlugHashes}
          />
        </>
      )}
    </>
  );
}

function WishlistRolls({
  wishlistRolls,
  item,
  realAvailablePlugHashes,
}: {
  wishlistRolls: WishListRoll[];
  item: DimItem;
  // non-plugged, but available, plugs, from the real item this was spawned from.
  // used to mark sockets as available
  realAvailablePlugHashes?: number[];
}) {
  const groupedWishlistRolls = _.groupBy(wishlistRolls, (r) => r.notes || t('Armory.NoNotes'));

  // TODO: group by making a tree of least cardinality -> most?

  return (
    <>
      {_.map(groupedWishlistRolls, (rolls, notes) => (
        <div key={notes}>
          <div>{notes}</div>
          <ul>
            {rolls.map((r, i) => (
              <li key={i} className={styles.roll}>
                {Array.from(r.recommendedPerks, (h) => {
                  const socket = item.sockets?.allSockets.find((s) =>
                    s.plugOptions.some((p) => p.plugDef.hash === h)
                  );
                  const plug = socket?.plugOptions.find((p) => p.plugDef.hash === h);
                  return (
                    plug &&
                    socket && (
                      <Plug
                        key={plug.plugDef.hash}
                        plug={plug}
                        item={item}
                        socketInfo={socket}
                        hasMenu={false}
                        notSelected={realAvailablePlugHashes?.includes(plug.plugDef.hash)}
                      />
                    )
                  );
                })}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
