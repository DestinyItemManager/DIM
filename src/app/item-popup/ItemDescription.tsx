import React, { useState } from 'react';
import { DimItem } from 'app/inventory/item-types';
import NotesForm from './NotesForm';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import ishtarLogo from '../../images/ishtar-collective.svg';
import styles from './ItemDescription.m.scss';
import { AppIcon } from 'app/shell/icons';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { getNotes } from 'app/inventory/dim-item-info';
import { RootState } from 'app/store/reducers';
import { inventoryWishListsSelector } from 'app/wishlists/reducer';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  notes?: string;
  inventoryCuratedRoll?: InventoryWishListRoll;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    notes: getNotes(props.item, state.inventory.itemInfos),
    inventoryCuratedRoll: inventoryWishListsSelector(state)[props.item.id]
  };
}

type Props = ProvidedProps & StoreProps;

function ItemDescription({ item, notes, inventoryCuratedRoll }: Props) {
  const showDescription = Boolean(item.description?.length);

  const loreLink = item.loreHash
    ? `http://www.ishtar-collective.net/entries/${item.loreHash}`
    : undefined;

  const [notesOpen, setNotesOpen] = useState(false);

  // TODO: close notes button

  return (
    <>
      {showDescription && <div className={styles.officialDescription}>{item.description}</div>}
      {item.isDestiny2() && Boolean(item.displaySource?.length) && (
        <div className={styles.officialDescription}>{item.displaySource}</div>
      )}
      {inventoryCuratedRoll &&
        inventoryCuratedRoll.notes &&
        inventoryCuratedRoll.notes.length > 0 && (
          <div className={styles.wishListNotes}>
            {t('WishListRoll.WishListNotes', { notes: inventoryCuratedRoll.notes })}
          </div>
        )}
      {notesOpen ? (
        <NotesForm item={item} notes={notes} />
      ) : (
        notes && (
          <div
            className={[styles.addNote, styles.description].join(' ')}
            role="button"
            onClick={() => {
              setNotesOpen(true);
              ga('send', 'event', 'Item Popup', 'Edit Notes');
            }}
            tabIndex={0}
          >
            <AppIcon icon={faPencilAlt} />{' '}
            <span className={styles.addNoteTag}>{t('MovePopup.Notes')}</span> {notes}
          </div>
        )
      )}

      {!notesOpen && (loreLink || (item.taggable && !notes)) && (
        <div className={styles.descriptionTools}>
          {item.taggable && !notes && (
            <div
              role="button"
              className={styles.addNote}
              onClick={() => setNotesOpen(true)}
              tabIndex={0}
            >
              <AppIcon icon={faPencilAlt} />{' '}
              <span className={styles.addNoteTag}>{t('MovePopup.AddNote')}</span>
            </div>
          )}
          {loreLink && (
            <div className={styles.lore}>
              <ExternalLink href={loreLink}>
                <img src={ishtarLogo} height="16" width="16" />
              </ExternalLink>{' '}
              <ExternalLink
                href={loreLink}
                onClick={() => ga('send', 'event', 'Item Popup', 'Read Lore')}
              >
                {t('MovePopup.ReadLore')}
              </ExternalLink>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemDescription);
