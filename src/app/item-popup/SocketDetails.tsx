import React from 'react';
import { DimSocket } from 'app/inventory/item-types';
import Sheet from 'app/dim-ui/Sheet';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { SocketPlugSources, TierType } from 'bungie-api-ts/destiny2';
import BungieImage from 'app/dim-ui/BungieImage';
import { RootState } from 'app/store/reducers';
import { storesSelector } from 'app/inventory/reducer';
import { DimStore } from 'app/inventory/store-types';
import { connect } from 'react-redux';
import clsx from 'clsx';
import styles from './SocketDetails.m.scss';

interface ProvidedProps {
  socket: DimSocket;
  onClose(): void;
}

interface StoreProps {
  defs: D2ManifestDefinitions;
  stores: DimStore[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    defs: state.manifest.d2Manifest!,
    stores: storesSelector(state)
  };
}

type Props = ProvidedProps & StoreProps;

function SocketDetails({ defs, socket, stores, onClose }: Props) {
  const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
  const socketCategory = defs.SocketCategory.get(socketType.socketCategoryHash);

  const modHashes = new Set<number>();
  if (
    socket.socketDefinition.plugSources & SocketPlugSources.ReusablePlugItems &&
    socket.socketDefinition.reusablePlugItems
  ) {
    for (const plugItem of socket.socketDefinition.reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
    }
  }

  if (
    socket.socketDefinition.plugSources & SocketPlugSources.InventorySourced &&
    socketType.plugWhitelist
  ) {
    const plugWhitelist = new Set(socketType.plugWhitelist.map((e) => e.categoryHash));
    for (const store of stores) {
      for (const item of store.items) {
        const itemDef = defs.InventoryItem.get(item.hash);
        if (itemDef.plug && plugWhitelist.has(itemDef.plug.plugCategoryHash)) {
          modHashes.add(item.hash);
        }
      }
    }
  }

  if (socket.socketDefinition.reusablePlugSetHash) {
    for (const plugItem of defs.PlugSet.get(socket.socketDefinition.reusablePlugSetHash)
      .reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
    }
  }
  if (socket.socketDefinition.randomizedPlugSetHash) {
    for (const plugItem of defs.PlugSet.get(socket.socketDefinition.randomizedPlugSetHash)
      .reusablePlugItems) {
      modHashes.add(plugItem.plugItemHash);
    }
  }

  const mods = Array.from(modHashes)
    .map((h) => defs.InventoryItem.get(h))
    .filter((i) => i.inventory.tierType > TierType.Common);

  const footer = (
    <div>
      {socket.plug && (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div
            key={socket.plug.plugItem.hash}
            className="item"
            title={socket.plug.plugItem.displayProperties.name}
          >
            <BungieImage className="item-img" src={socket.plug.plugItem.displayProperties.icon} />
          </div>
          {socket.plug.plugItem.displayProperties.name}
        </div>
      )}
    </div>
  );

  console.log({ socket, socketType, socketCategory });
  return (
    <Sheet
      onClose={onClose}
      header={<h1>{socketCategory.displayProperties.name}</h1>}
      footer={footer}
    >
      <div className={clsx('sub-bucket', styles.modList)}>
        {mods.map((item) => (
          <div key={item.hash} className="item" title={item.displayProperties.name}>
            <BungieImage className="item-img" src={item.displayProperties.icon} />
          </div>
        ))}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(SocketDetails);
