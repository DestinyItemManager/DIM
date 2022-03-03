import { ExpandableTextBlock } from 'app/dim-ui/ExpandableTextBlock';
import ExternalLink from 'app/dim-ui/ExternalLink';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { wishListSelector } from 'app/wishlists/selectors';
import ishtarLogo from 'images/ishtar-collective.svg';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './ItemDescription.m.scss';
import NotesArea from './NotesArea';

export default function ItemDescription({ item }: { item: DimItem }) {
  const wishlistItem = useSelector(wishListSelector(item));

  // suppressing some unnecessary information for weapons and armor,
  // to make room for all that other delicious info
  const showFlavor = !item.bucket.inWeapons && !item.bucket.inArmor;

  return (
    <>
      {showFlavor && (
        <>
          {Boolean(item.description?.length) && (
            <div className={styles.officialDescription}>
              <RichDestinyText text={item.description} ownerId={item.owner} />
              {item.loreHash && <LoreLink loreHash={item.loreHash} />}
            </div>
          )}
          {Boolean(item.displaySource?.length) && (
            <div className={styles.flavorText}>{item.displaySource}</div>
          )}
        </>
      )}
      {!$featureFlags.triage && wishlistItem?.notes?.length && (
        <ExpandableTextBlock linesWhenClosed={3} className={styles.description}>
          <span className={styles.wishListLabel}>
            {t('WishListRoll.WishListNotes', { notes: '' })}
          </span>
          <span className={styles.wishListTextContent}>{wishlistItem.notes}</span>
        </ExpandableTextBlock>
      )}
      <NotesArea item={item} className={styles.description} />
    </>
  );
}

export function LoreLink({ loreHash }: { loreHash: number }) {
  if (!loreHash) {
    return null;
  }

  const loreLink = `http://www.ishtar-collective.net/entries/${loreHash}`;

  return (
    <ExternalLink
      className={styles.loreLink}
      href={loreLink}
      title={t('MovePopup.ReadLore')}
      onClick={() => ga('send', 'event', 'Item Popup', 'Read Lore')}
    >
      <img src={ishtarLogo} height="16" width="16" />
      {t('MovePopup.ReadLoreLink')}
    </ExternalLink>
  );
}
