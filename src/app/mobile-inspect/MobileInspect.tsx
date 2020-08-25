import React, { useState, useEffect } from 'react';
import { useSubscription } from 'app/utils/hooks';
import { DimItem } from 'app/inventory/item-types';
import ItemActions from 'app/item-popup/ItemActions';
import BungieImage from 'app/dim-ui/BungieImage';
import { ItemSubHeader } from 'app/item-popup/ItemSubHeader';
import { showMobileInspect$ } from './mobile-inspect';

import styles from './MobileInspect.m.scss';
import ItemSockets from 'app/item-popup/ItemSockets';

export default function MobileInspect() {
  const [item, setItem] = useState<DimItem | undefined>();
  // TODO: In some very rare cases the popup doesn't close. Allow tapping to reset/close.
  const reset = () => setItem(undefined);

  useEffect(() => {
    document.body.classList.toggle('mobile-preview', Boolean(item));
    document.body.classList.toggle('mobile-preview-fade', !item);
  }, [item]);

  useSubscription(() => showMobileInspect$.subscribe(({ item }) => setItem(item)));

  if (!item) {
    return null;
  }

  return (
    <div className={styles.mobileInspectSheet} onClick={reset}>
      <div className={styles.container}>
        <div className={styles.header}>
          <BungieImage className={styles.itemImg} src={item.icon} />
          <div className={styles.headerInfo}>
            <div>{item.name}</div>
            <ItemSubHeader item={item} />
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.inspectRow}>
            {item.isDestiny2() && <ItemSockets item={item} minimal={true} />}
          </div>
          <div className={styles.inspectRow}>
            <ItemActions key={item.index} item={item} mobileInspect={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
