import { memo } from 'react';
import { DimItem, DimSocket } from '../inventory/item-types';
import './ItemSockets.scss';
import ItemSocketsGeneral from './ItemSocketsGeneral';
import ItemSocketsWeapons from './ItemSocketsWeapons';

export default memo(function ItemSockets(props: {
  item: DimItem;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
  /** Force grid style */
  grid?: boolean;
  onPlugClicked?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  const item = props.item;

  if (item.destinyVersion === 2 && item.bucket.inWeapons) {
    return <ItemSocketsWeapons {...props} />;
  }

  return <ItemSocketsGeneral {...props} />;
});
