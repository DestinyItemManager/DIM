import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import ActionButton from 'app/item-actions/ActionButton';
import { BucketHashes } from 'data/d2/generated-enums';
import streamDeckIcon from 'images/streamDeck.svg';
import { useMemo } from 'react';
import { useStreamDeckSelection } from '../stream-deck';
import * as styles from './OpenOnStreamDeckButton.m.scss';

export default function OpenOnStreamDeckButton({
  item,
  label,
  type,
}: {
  item: DimItem;
  label: boolean;
  type: 'inventory-item' | 'item';
}) {
  const options = useMemo(
    () => ({
      type,
      item,
    }),
    [item, type],
  );

  const deepLink = useStreamDeckSelection({
    options,
    equippable: !item.notransfer || item.bucket.hash === BucketHashes.Subclass,
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
