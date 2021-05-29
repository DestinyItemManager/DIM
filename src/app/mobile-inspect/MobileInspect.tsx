import BungieImage from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import { storesSelector } from 'app/inventory/selectors';
import ItemMoveLocations from 'app/item-actions/ItemMoveLocations';
import { buildItemActionsModel } from 'app/item-popup/item-popup-actions';
import ItemSockets from 'app/item-popup/ItemSockets';
import { ItemSubHeader } from 'app/mobile-inspect/ItemSubHeader';
import clsx from 'clsx';
import React, { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useSubscription } from 'use-subscription';
import { showMobileInspect$ } from './mobile-inspect';
import styles from './MobileInspect.m.scss';

export const enum Inspect {
  default = 1,
  showMoveLocations = 2,
}

export default function MobileInspect() {
  const nodeRef = useRef<HTMLDivElement>(null);
  // TODO: In some very rare cases the popup doesn't close. Allow tapping to reset/close.
  const reset = () => showMobileInspect$.next({});

  const { item, inspectType = Inspect.default } = useSubscription(showMobileInspect$);

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
              <MobileInspectSheet item={item} inspectType={inspectType} />
            </div>
          </CSSTransition>
        )}
      </TransitionGroup>
    </>
  );
}

function MobileInspectSheet({ item, inspectType }: { item: DimItem; inspectType: Inspect }) {
  const stores = useSelector(storesSelector);
  const itemActionsModel = useMemo(
    () => item && buildItemActionsModel(item, stores),
    [item, stores]
  );

  return (
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
        {inspectType === Inspect.showMoveLocations && itemActionsModel.hasMoveControls && (
          <div className={styles.moveLocations}>
            <ItemMoveLocations
              key={item.index}
              item={item}
              mobileInspect={true}
              actionsModel={itemActionsModel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
