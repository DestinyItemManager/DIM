import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory-stores/item-types';
import Plug from 'app/item-popup/Plug';
import { wishListRollsForItemHashSelector } from 'app/wishlists/selectors';
import { WishListRoll } from 'app/wishlists/types';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './AllWishlistRolls.m.scss';

/**
 * List out all the known wishlist rolls for a given item.
 */
export default function AllWishlistRolls({ item }: { item: DimItem }) {
  const wishlistRolls = useSelector(wishListRollsForItemHashSelector(item.hash));
  const [goodRolls, badRolls] = _.partition(wishlistRolls, (r) => !r.isUndesirable);

  return (
    <>
      {goodRolls.length > 0 && (
        <>
          <h2>{t('Armory.WishlistedRolls', { count: goodRolls.length })}</h2>
          <WishlistRolls item={item} wishlistRolls={goodRolls} />
        </>
      )}
      {badRolls.length > 0 && (
        <>
          <h2>{t('Armory.TrashlistedRolls', { count: badRolls.length })}</h2>
          <WishlistRolls item={item} wishlistRolls={badRolls} />
        </>
      )}
    </>
  );
}

function WishlistRolls({ wishlistRolls, item }: { wishlistRolls: WishListRoll[]; item: DimItem }) {
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
