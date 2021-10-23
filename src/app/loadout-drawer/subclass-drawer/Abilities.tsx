import { isPluggableItem } from 'app/inventory/store/sockets';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import React from 'react';
import SocketOptions from './SocketOptions';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function Abilities({
  abilities,
  selectedPlugs,
  setSelectedPlugs,
}: {
  abilities: SocketWithOptions[];
  selectedPlugs: SelectedPlugs;
  setSelectedPlugs(selectedPlugs: SelectedPlugs): void;
}) {
  const selectAbility = (ability: DestinyInventoryItemDefinition) => {
    if (isPluggableItem(ability)) {
      const { plugCategoryHash } = ability.plug;
      setSelectedPlugs({ ...selectedPlugs, [plugCategoryHash]: [ability] });
    }
  };
  return (
    <SocketOptions
      socketsWithOptions={abilities}
      direction="column"
      selectedPlugs={selectedPlugs}
      onSelect={selectAbility}
    />
  );
}
