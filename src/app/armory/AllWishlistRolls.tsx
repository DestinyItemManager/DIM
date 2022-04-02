import { t } from 'app/i18next-t';
import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import Plug from 'app/item-popup/Plug';
import { useD2Definitions } from 'app/manifest/selectors';
import { compareBy } from 'app/utils/comparators';
import { wishListRollsForItemHashSelector } from 'app/wishlists/selectors';
import { WishListRoll } from 'app/wishlists/types';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './AllWishlistRolls.m.scss';
import { getCraftingTemplate } from './crafting-utils';
import {
  consolidateRollsForOneWeapon,
  consolidateSecondaryPerks,
  enhancedToPerk,
} from './wishlist-collapser';

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
  /**
   * non-plugged, but available, plugs, from the real item this was spawned from.
   * used to mark sockets as available
   */
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
  /**
   * non-plugged, but available, plugs, from the real item this was spawned from.
   * used to mark sockets as available
   */
  realAvailablePlugHashes?: number[];
}) {
  const defs = useD2Definitions()!;
  const groupedWishlistRolls = _.groupBy(wishlistRolls, (r) => r.notes || t('Armory.NoNotes'));

  const templateSockets = getCraftingTemplate(defs, item.hash)?.sockets?.socketEntries;

  const socketByPerkHash: Record<number, DimSocket> = {};
  const plugByPerkHash: Record<number, DimPlug> = {};
  // the order, within their column, that perks appear. for sorting barrels mags etc.
  const columnOrderByPlugHash: Record<number, number> = {};

  if (item.sockets) {
    for (const s of item.sockets.allSockets) {
      if (s.isReusable) {
        for (const p of s.plugOptions) {
          socketByPerkHash[p.plugDef.hash] = s;
          plugByPerkHash[p.plugDef.hash] = p;
        }

        const plugSetHash =
          templateSockets?.[s.socketIndex].reusablePlugSetHash ??
          (s.socketDefinition.randomizedPlugSetHash || s.socketDefinition.reusablePlugSetHash);

        if (plugSetHash) {
          const plugItems = defs.PlugSet.get(plugSetHash).reusablePlugItems;
          for (let i = 0; i < plugItems.length; i++) {
            const plugItem = plugItems[i];
            if (plugItem.currentlyCanRoll) {
              columnOrderByPlugHash[plugItem.plugItemHash] = i;
            }
          }
        }
      }
    }
  }

  // TODO: group by making a tree of least cardinality -> most?

  return (
    <>
      {_.map(groupedWishlistRolls, (rolls, notes) => {
        const consolidatedRolls = consolidateRollsForOneWeapon(defs, item, rolls);

        return (
          <div key={notes}>
            <div>{notes}</div>
            <ul>
              {consolidatedRolls.map((cr) => {
                // groups [outlaw, enhanced outlaw, rampage]
                // into {
                //   "3": [outlaw, enhanced outlaw]
                //   "4": [rampage]
                // }
                const primariesGroupedByColumn = _.groupBy(
                  cr.commonPrimaryPerks,
                  (h) => socketByPerkHash[h]?.socketIndex
                );

                // turns the above into
                // [[outlaw, enhanced outlaw], [rampage]]
                const primaryBundles = cr.rolls[0].primarySocketIndices.map((socketIndex) =>
                  primariesGroupedByColumn[socketIndex].sort(
                    // establish a consistent base -> enhanced perk order
                    compareBy((h) => (h in enhancedToPerk ? 1 : 0))
                  )
                );

                // i.e.
                // [
                //   [[drop mag], [smallbore, extended barrel]],
                //   [[tac mag], [rifled barrel, extended barrel]]
                // ]
                const consolidatedSecondaries = consolidateSecondaryPerks(cr.rolls);

                return consolidatedSecondaries.map((secondaryBundle) => {
                  const bundles = [...primaryBundles, ...secondaryBundle];
                  return (
                    <li key={bundles.map((b) => b.join()).join()} className={styles.roll}>
                      {bundles.map((hashes) => (
                        <div key={hashes.join()} className={styles.orGroup}>
                          {hashes
                            .sort(
                              compareBy(
                                // unrecognized/unrollable perks last
                                (h) => columnOrderByPlugHash[h] ?? 9999
                              )
                            )
                            .map((h) => {
                              const socket = socketByPerkHash[h];
                              const plug = plugByPerkHash[h];
                              return (
                                plug &&
                                socket && (
                                  <Plug
                                    key={plug.plugDef.hash}
                                    plug={plug}
                                    item={item}
                                    socketInfo={socket}
                                    hasMenu={false}
                                    notSelected={realAvailablePlugHashes?.includes(
                                      plug.plugDef.hash
                                    )}
                                  />
                                )
                              );
                            })}
                        </div>
                      ))}
                    </li>
                  );
                });
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}
