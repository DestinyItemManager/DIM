import { DimItem, DimSocketCategory } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import Socket from 'app/item-popup/Socket';
import { useD2Definitions } from 'app/manifest/selectors';
import { getSocketsByCategoryHash, getSocketsByIndexes } from 'app/utils/socket-utils';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './ItemSocketsSubclass.m.scss';
import SubclassPlugDrawer from './SubclassPlugDrawer';

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
            <SocketCategory
              subclass={subclass}
              socketCategory={socketCategory}
              onSocketClick={() => setPlugDrawerOpen(true)}
            />
          )
      )}
      {plugDrawerOpen &&
        ReactDOM.createPortal(
          <SubclassPlugDrawer
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

function SocketCategory({
  subclass,
  socketCategory,
  onSocketClick,
}: {
  subclass: DimItem;
  socketCategory: DimSocketCategory;
  onSocketClick(): void;
}) {
  const isFragment = socketCategory.category.hash === SocketCategoryHashes.Fragments;
  let sockets = getSocketsByIndexes(subclass.sockets!, socketCategory.socketIndexes);

  if (isFragment) {
    const aspects = _.compact(
      getSocketsByCategoryHash(subclass.sockets!, SocketCategoryHashes.Aspects).map(
        (socket) => socket.plugged?.plugDef
      )
    );
    const availableFragments = _.sumBy(
      aspects,
      (aspect) => aspect.plug.energyCapacity?.capacityValue || 0
    );

    sockets = sockets.slice(0, availableFragments);
  }

  if (!sockets.length) {
    return null;
  }

  return (
    <div className={styles.category}>
      <div className={styles.title}>{socketCategory.category.displayProperties.name}</div>
      <div className={styles.sockets}>
        {sockets.map((socketInfo) => (
          <div key={socketInfo.socketIndex} className={styles.socket}>
            <Socket item={subclass} socket={socketInfo} onClick={onSocketClick} />
          </div>
        ))}
      </div>
    </div>
  );
}
