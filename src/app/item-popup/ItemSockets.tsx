import React, { memo } from 'react';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import './ItemSockets.scss';
import ItemSocketsGeneral from './ItemSocketsGeneral';
import ItemSocketsWeapons from './ItemSocketsWeapons';

interface ProvidedProps {
  item: DimItem;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
  onPlugClicked?(value: { item: DimItem; socket: DimSocket; plug: DimPlug }): void;
}

type Props = ProvidedProps;

export default memo(function ItemSockets(props: Props) {
  const item = props.item;

  if (item.destinyVersion === 2 && item.bucket.inWeapons) {
    return <ItemSocketsWeapons {...props} />;
  }

  return <ItemSocketsGeneral {...props} />;
});
