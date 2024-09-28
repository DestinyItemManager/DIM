import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import ActionButton from 'app/item-actions/ActionButton';
import { BucketHashes } from 'data/d2/generated-enums';
import streamDeckIcon from 'images/streamDeck.svg';
import { useStreamDeckSelection } from '../stream-deck';
import styles from './OpenOnStreamDeckButton.m.scss';

export default function OpenOnStreamDeckButton({ item, label }: { item: DimItem; label: boolean }) {
  const deepLink = useStreamDeckSelection({
    type: 'item',
    item,
    isSubClass: item.bucket.hash === BucketHashes.Subclass,
    equippable: !item.notransfer,
  });

  if (!deepLink) {
    return null;
  }

  return (
    <a href={deepLink} target="_blank" className={styles.link}>
      <ActionButton onClick={() => null}>
        <img src={streamDeckIcon} className={styles.icon} />
        {label && <span>{t('MovePopup.OpenOnStreamDeck')}</span>}
      </ActionButton>
    </a>
  );
}
