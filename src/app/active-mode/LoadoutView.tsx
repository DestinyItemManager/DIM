import InventoryCollapsibleTitle from 'app/inventory/InventoryCollapsibleTitle';
import { DimStore } from 'app/inventory/store-types';
import LoadoutPopup from 'app/loadout/LoadoutPopup';
import React from 'react';

export default function LoadoutView({ store }: { store: DimStore }) {
  return (
    <InventoryCollapsibleTitle
      title={'Loadouts'}
      sectionId={'Loadout'}
      stores={[store]}
      defaultCollapsed={true}
    >
      <LoadoutPopup dimStore={store} hideFarming={true} />
    </InventoryCollapsibleTitle>
  );
}
