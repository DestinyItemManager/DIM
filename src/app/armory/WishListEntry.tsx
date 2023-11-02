import HelpLink from 'app/dim-ui/HelpLink';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { showNotification } from 'app/notifications/notifications';
import { wishListGuideLink } from 'app/shell/links';
import { filterMap } from 'app/utils/collections';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getSocketsWithStyle } from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import styles from './WishListEntry.m.scss';

/**
 * Add a control for people to copy out the wish list line for the currently configured roll.
 */
export default function WishListEntry({ item }: { item: DimItem }) {
  const wishlistLine = createWishListRollString(item);
  const handleFocusWishlist = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  const handleButtonClick = () => {
    navigator.clipboard.writeText(wishlistLine);
    showNotification({
      type: 'success',
      title: t('WishListRoll.CopiedLine'),
    });
  };

  return (
    <div className={styles.wishlist}>
      <button type="button" className="dim-button" onClick={handleButtonClick}>
        {t('WishListRoll.CopyLine')}
      </button>
      <input onFocus={handleFocusWishlist} value={wishlistLine ?? ''} readOnly size={50} />
      <HelpLink helpLink={wishListGuideLink} />
    </div>
  );
}

function createWishListRollString(item: DimItem) {
  let perkHashes: number[] = [];

  if (item.sockets) {
    const sockets = getSocketsWithStyle(item.sockets, DestinySocketCategoryStyle.Reusable);
    perkHashes = filterMap(sockets, (socket) =>
      isKillTrackerSocket(socket) || socket.plugOptions.length <= 1
        ? undefined
        : socket.plugged?.plugDef.hash,
    );
  }

  return `dimwishlist:item=${item.hash}&perks=${perkHashes.join(',')}`;
}
