import { setNotesOpen } from 'app/accounts/actions';
import { ExpandableTextBlock } from 'app/dim-ui/ExpandableTextBlock';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { getNotes } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import {
  itemHashTagsSelector,
  itemInfosSelector,
  notesOpenSelector,
} from 'app/inventory/selectors';
import { NotesEditor } from 'app/item-popup/NotesArea';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { inventoryWishListsSelector } from 'app/wishlists/selectors';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import React from 'react';
import { connect, useDispatch } from 'react-redux';
import ishtarLogo from '../../images/ishtar-collective.svg';
import styles from './ItemDescription.m.scss';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  notesOpen?: string;
  inventoryWishListRoll?: InventoryWishListRoll;
  savedNotes: string;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    notesOpen: notesOpenSelector(state),
    savedNotes: getNotes(props.item, itemInfosSelector(state), itemHashTagsSelector(state)) ?? '',
    inventoryWishListRoll: inventoryWishListsSelector(state)[props.item.id],
  };
}

type Props = ProvidedProps & StoreProps;

function ItemDescription({ item, notesOpen, savedNotes, inventoryWishListRoll }: Props) {
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();
  // suppressing some unnecessary information for weapons and armor,
  // to make room for all that other delicious info
  const showFlavor = !item.bucket.inWeapons && !item.bucket.inArmor;

  const loreLink = item.loreHash
    ? `http://www.ishtar-collective.net/entries/${item.loreHash}`
    : undefined;

  return (
    <>
      {showFlavor && (
        <>
          {Boolean(item.description?.length) && (
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
          {Boolean(item.displaySource?.length) && (
            <div className={styles.officialDescription}>{item.displaySource}</div>
          )}
        </>
      )}
      {inventoryWishListRoll?.notes && inventoryWishListRoll.notes.length > 0 && (
        <ExpandableTextBlock linesWhenClosed={3} className={styles.descriptionBorder}>
          <span className={styles.wishListLabel}>
            {t('WishListRoll.WishListNotes', { notes: '' })}
          </span>
          <span className={styles.wishListTextContent}>{inventoryWishListRoll.notes}</span>
        </ExpandableTextBlock>
      )}

      {notesOpen !== item.id ? (
        savedNotes && <div className={styles.descriptionBorder}>{savedNotes}</div>
      ) : (
        <div className={styles.description}>
          <NotesEditor
            item={item}
            notes={savedNotes}
            setNotesOpen={() => dispatch(setNotesOpen(undefined))}
          />
        </div>
      )}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemDescription);
