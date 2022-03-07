import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import React from 'react';
import { DimCraftable } from './presentation-nodes';

interface Props {
  craftable: DimCraftable;
}

export default function Craftable({ craftable }: Props) {
  const { item, canCraftAllPlugs, canCraftThis } = craftable;

  return (
    <VendorItemDisplay
      item={item}
      unavailable={!canCraftThis}
      extraData={{ canCraftAllPlugs, canCraftThis }}
    />
  );
}
