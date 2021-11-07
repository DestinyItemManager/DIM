import { bungieNetPath } from 'app/dim-ui/BungieImage';
import PressTip from 'app/dim-ui/PressTip';
import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import Socket from 'app/item-popup/Socket';
import SocketDetails from 'app/item-popup/SocketDetails';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './ItemSocketsSubclass.m.scss';

interface Props {
  item: DimItem;
  onPlugClicked(value: { item: DimItem; socket: DimSocket; plugHash: number }): void;
}

export default function ItemSocketsSubclass({ item, onPlugClicked }: Props) {
  const defs = useD2Definitions();
  const isPhonePortrait = useIsPhonePortrait();
  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);

  const handleSocketClick = (item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean) => {
    if (hasMenu) {
      setSocketInMenu(socket);
    } else {
      onPlugClicked({
        item,
        socket,
        plugHash: plug.plugDef.hash,
      });
    }
  };

  if (!item.sockets || !defs) {
    return null;
  }

  const superCategory = item.sockets.categories.find(
    (category) => category.category.hash === SocketCategoryHashes.Super
  );
  const categories = [
    item.sockets.categories.find(
      (category) => category.category.hash === SocketCategoryHashes.Abilities
    ),
    item.sockets.categories.find(
      (category) => category.category.hash === SocketCategoryHashes.Aspects
    ),
    item.sockets.categories.find(
      (category) => category.category.hash === SocketCategoryHashes.Fragments
    ),
  ];

  return (
    <div className={styles.optionsGrid}>
      <div className={styles.super}>
        {!isPhonePortrait &&
          superCategory &&
          getSocketsByIndexes(item.sockets, superCategory.socketIndexes).map(
            (socketInfo) =>
              socketInfo.plugged && (
                <SuperSocket key={socketInfo.socketIndex} item={item} plug={socketInfo.plugged} />
              )
          )}
      </div>
      {categories.map(
        (socketCategory) =>
          socketCategory && (
            <div className={getClassnameForCategoryHash(socketCategory.category.hash)}>
              <div className={styles.title}>{socketCategory.category.displayProperties.name}</div>
              <div className={styles.sockets}>
                {getSocketsByIndexes(item.sockets!, socketCategory.socketIndexes).map(
                  (socketInfo) => (
                    <div key={socketInfo.socketIndex} className={styles.socket}>
                      <Socket item={item} socket={socketInfo} onClick={handleSocketClick} />
                    </div>
                  )
                )}
              </div>
            </div>
          )
      )}
      {socketInMenu &&
        ReactDOM.createPortal(
          <SocketDetails
            key={socketInMenu.socketIndex}
            item={item}
            socket={socketInMenu}
            onClose={() => setSocketInMenu(null)}
            onPlugSelected={onPlugClicked}
          />,
          document.body
        )}
    </div>
  );
}

function SuperSocket({ item, plug }: { item: DimItem; plug: DimPlug }) {
  return (
    <PressTip tooltip={<PlugTooltip item={item} plug={plug} />}>
      <svg viewBox="0 0 94 94">
        <image
          xlinkHref={bungieNetPath(plug.plugDef.displayProperties.icon)}
          width="94"
          height="94"
        />
        <polygon
          strokeDasharray="265.87216"
          style={{ strokeDashoffset: 0 }}
          fillOpacity="0"
          stroke="#979797"
          strokeWidth="1"
          points="47,0 94,47 47,94 0,47"
          strokeLinecap="butt"
        />
      </svg>
    </PressTip>
  );
}

function getClassnameForCategoryHash(categoryHash: number) {
  switch (categoryHash) {
    case SocketCategoryHashes.Abilities:
      return styles.abilities;
    case SocketCategoryHashes.Aspects:
      return styles.aspects;
    case SocketCategoryHashes.Fragments:
      return styles.fragments;
    default:
      return;
  }
}
