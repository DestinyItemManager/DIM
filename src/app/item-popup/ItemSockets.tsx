import React from 'react';
import { DimAdjustedItemPlug } from '../compare/types';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import './ItemSockets.scss';
import ItemSocketsGeneral from './ItemSocketsGeneral';
import ItemSocketsWeapons from './ItemSocketsWeapons';

interface ProvidedProps {
  item: DimItem;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
  updateSocketComparePlug?(value: { item: DimItem; socket: DimSocket; plug: DimPlug }): void;
  adjustedItemPlugs?: DimAdjustedItemPlug;
}

type Props = ProvidedProps;

export default function ItemSockets(props: Props) {
  const item = props.item;

  if (item.destinyVersion === 2 && item.bucket.inWeapons) {
    return <ItemSocketsWeapons {...props} />;
  }

  return <ItemSocketsGeneral {...props} />;
}
