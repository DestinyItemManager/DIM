import BungieImage from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import ItemActions from 'app/item-popup/ItemActions';
import ItemSockets from 'app/item-popup/ItemSockets';
import { ItemSubHeader } from 'app/item-popup/ItemSubHeader';
import { useSubscription } from 'app/utils/hooks';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { showMobileInspect$ } from './mobile-inspect';
import styles from './MobileInspect.m.scss';

export const enum Inspect {
  default = 1,
  showMoveLocations = 2,
}

export default function MobileInspect() {
  const [item, setItem] = useState<DimItem | undefined>();
  const [inspectType, setInspectType] = useState<Inspect>(Inspect.default);
  const nodeRef = useRef<HTMLDivElement>(null);
  // TODO: In some very rare cases the popup doesn't close. Allow tapping to reset/close.
  const reset = () => setItem(undefined);

  useSubscription(() =>
    showMobileInspect$.subscribe(({ item, inspectType }) => {
      setItem(item);
      setInspectType(inspectType ?? Inspect.default);
    })
  );

  return (
    <>
      <div className={clsx(styles.sheetBackground, { [styles.inspectActive]: item })} />
      <TransitionGroup component={null}>
        {item && (
          <CSSTransition
            nodeRef={nodeRef}
            timeout={{ enter: 150, exit: 150 }}
            classNames={{
              enter: styles.enter,
              enterActive: styles.enterActive,
              exit: styles.exit,
              exitActive: styles.exitActive,
            }}
          >
            <div ref={nodeRef} className={styles.mobileInspectSheet} onClick={reset}>
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
                    {item.sockets && <ItemSockets item={item} minimal={true} />}
                  </div>
                  {inspectType === Inspect.showMoveLocations && (
                    <div className={styles.inspectRow}>
                      <ItemActions key={item.index} item={item} mobileInspect={true} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CSSTransition>
        )}
      </TransitionGroup>
    </>
  );
}
