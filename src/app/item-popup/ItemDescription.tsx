import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import NotesArea from './NotesArea';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import ishtarLogo from '../../images/ishtar-collective.svg';
import styles from './ItemDescription.m.scss';
import { connect } from 'react-redux';
import { RootState } from 'app/store/reducers';
import { inventoryWishListsSelector } from 'app/wishlists/reducer';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  inventoryWishListRoll?: InventoryWishListRoll;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    inventoryWishListRoll: inventoryWishListsSelector(state)[props.item.id],
  };
}
/**  */
// const displaySourceIgnoreList: string[] = [];

type Props = ProvidedProps & StoreProps;

function ItemDescription({ item, inventoryWishListRoll }: Props) {
  const showDescription =
    !item.bucket.inWeapons && !item.bucket.inArmor && Boolean(item.description?.length);

  const loreLink = item.loreHash
    ? `http://www.ishtar-collective.net/entries/${item.loreHash}`
    : undefined;

  return (
    <>
      {showDescription && (
        <div className={styles.officialDescription}>
          {item.description}
          {loreLink && (
            <ExternalLink
              className={styles.lore}
              href={loreLink}
              onClick={() => ga('send', 'event', 'Item Popup', 'Read Lore')}
            >
              <img src={ishtarLogo} height="16" width="16" /> {t('MovePopup.ReadLore')}
            </ExternalLink>
          )}
        </div>
      )}
      {item.isDestiny2() &&
        !item.bucket.inWeapons &&
        !item.bucket.inArmor &&
        Boolean(item.displaySource?.length) && (
          <div className={styles.officialDescription}>{item.displaySource}</div>
        )}
      {inventoryWishListRoll?.notes && inventoryWishListRoll.notes.length > 0 && (
        <div tabIndex={-1} className={styles.wishListNotes}>
          {t('WishListRoll.WishListNotes', { notes: inventoryWishListRoll.notes })}
        </div>
      )}
      <NotesArea item={item} />
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemDescription);
