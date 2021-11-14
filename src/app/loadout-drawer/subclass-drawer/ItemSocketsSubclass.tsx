import { DimItem } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import Socket from 'app/item-popup/Socket';
import { useD2Definitions } from 'app/manifest/selectors';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import AspectAndFragmentDrawer from './AspectAndFragmentDrawer';
import styles from './ItemSocketsSubclass.m.scss';

interface Props {
  subclass: DimItem;
  socketOverrides: SocketOverrides;
  updateSocketOverrides(socketOverrides: SocketOverrides): void;
}

export default function ItemSocketsSubclass({
  subclass,
  socketOverrides,
  updateSocketOverrides,
}: Props) {
  const defs = useD2Definitions();
  const [plugDrawerOpen, setPlugDrawerOpen] = useState(false);

  if (!subclass.sockets || !defs) {
    return null;
  }

  return (
    <div className={styles.categories}>
      {subclass.sockets.categories.map(
        (socketCategory) =>
          socketCategory && (
            <div className={styles.category}>
              <div className={styles.title}>{socketCategory.category.displayProperties.name}</div>
              <div className={styles.sockets}>
                {getSocketsByIndexes(subclass.sockets!, socketCategory.socketIndexes).map(
                  (socketInfo) => (
                    <div key={socketInfo.socketIndex} className={styles.socket}>
                      <Socket
                        item={subclass}
                        socket={socketInfo}
                        onClick={() => setPlugDrawerOpen(true)}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )
      )}
      {plugDrawerOpen &&
        ReactDOM.createPortal(
          <AspectAndFragmentDrawer
            subclass={subclass}
            socketOverrides={socketOverrides}
            onClose={() => setPlugDrawerOpen(false)}
            onAccept={updateSocketOverrides}
          />,
          document.body
        )}
    </div>
  );
}
