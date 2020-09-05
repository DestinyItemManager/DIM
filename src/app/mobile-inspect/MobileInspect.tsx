import BungieImage from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import ItemActions from 'app/item-popup/ItemActions';
import ItemSockets from 'app/item-popup/ItemSockets';
import { ItemSubHeader } from 'app/item-popup/ItemSubHeader';
import { useSubscription } from 'app/utils/hooks';
import React, { useState } from 'react';
import { showMobileInspect$ } from './mobile-inspect';
import styles from './MobileInspect.m.scss';

export const enum Inspect {
  default = 1,
  showMoveLocations = 2,
}

export default function MobileInspect() {
  const [item, setItem] = useState<DimItem | undefined>();
  const [inspectType, setInspectType] = useState<Inspect>(Inspect.default);
  // TODO: In some very rare cases the popup doesn't close. Allow tapping to reset/close.
  const reset = () => setItem(undefined);

  useSubscription(() =>
    showMobileInspect$.subscribe(({ item, inspectType }) => {
      setItem(item);
      setInspectType(inspectType ?? Inspect.default);
    })
  );

  if (!item) {
    return <div className={styles.sheetBackground} />;
  }

  return (
    <>
      <div className={`${styles.sheetBackground} ${styles.inspectActive}`} />
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
            {inspectType === Inspect.showMoveLocations && (
              <div className={styles.inspectRow}>
                <ItemActions key={item.index} item={item} mobileInspect={true} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
