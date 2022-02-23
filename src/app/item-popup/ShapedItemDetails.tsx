import { useD2Definitions } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import React from 'react';
import { DimItem } from '../inventory/item-types';
import './ItemSockets.scss';

// this has information about the weapon, if the user crafted it
export default function ShapedItemDetails({ item }: { item: DimItem }) {
  const defs = useD2Definitions();

  const shapedWeaponSocket = item.sockets?.allSockets.find(
    (s) => s.plugged?.plugDef.plug.plugCategoryIdentifier === 'crafting.plugs.frame_identifiers'
  );
  if (!shapedWeaponSocket || !defs) {
    return null;
  }

  return (
    <div className="plug-objectives">
      {shapedWeaponSocket.plugged?.plugObjectives.map((objective) => (
        <Objective key={objective.objectiveHash} objective={objective} />
      ))}
    </div>
  );
}
