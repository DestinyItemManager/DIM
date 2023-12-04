import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import { DimCraftable } from './presentation-nodes';

export default function Craftable({ craftable }: { craftable: DimCraftable }) {
  const { item, canCraftAllPlugs, canCraftThis } = craftable;

  return (
    <VendorItemDisplay
      item={item}
      unavailable={!canCraftThis}
      extraData={{ canCraftAllPlugs, canCraftThis }}
    />
  );
}
