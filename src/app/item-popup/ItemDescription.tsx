import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import NotesArea from './NotesArea';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import ishtarLogo from '../../images/ishtar-collective.svg';
import styles from './ItemDescription.m.scss';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import { inventoryWishListsSelector } from 'app/wishlists/reducer';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { ExpandableTextBlock } from 'app/dim-ui/ExpandableTextBlock';

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
          {item.description}{' '}
          {loreLink && (
            <ExternalLink
              className={styles.loreLink}
              href={loreLink}
              title={t('MovePopup.ReadLore')}
              onClick={() => ga('send', 'event', 'Item Popup', 'Read Lore')}
            >
              <img src={ishtarLogo} height="16" width="16" />
              {t('MovePopup.ReadLoreLink')}
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
        <ExpandableTextBlock linesWhenClosed={3} className={styles.description}>
          <span className={styles.wishListLabel}>
            {t('WishListRoll.WishListNotes', { notes: '' })}
          </span>
          <span className={styles.wishListTextContent}>{inventoryWishListRoll.notes}</span>
        </ExpandableTextBlock>
      )}
      <NotesArea item={item} className={styles.description} />
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemDescription);
