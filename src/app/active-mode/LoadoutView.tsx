import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { DimStore } from 'app/inventory/store-types';
import LoadoutPopup from 'app/loadout/LoadoutPopup';
import React from 'react';

export default function LoadoutView({ store }: { store: DimStore }) {
  return (
    <CollapsibleTitle title={'Loadouts'} sectionId={'active-loadouts'} defaultCollapsed={true}>
      <LoadoutPopup dimStore={store} hideFarming={true} />
    </CollapsibleTitle>
  );
}
