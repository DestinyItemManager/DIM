import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React from 'react';
import styles from './Abilities.m.scss';
import Option from './Option';
import { SDDispatch } from './reducer';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function Abilities({
  abilities,
  selectedPlugs,
  dispatch,
}: {
  abilities: SocketWithOptions[];
  selectedPlugs: SelectedPlugs;
  dispatch: SDDispatch;
}) {
  const selectAbility = (ability: PluggableInventoryItemDefinition) => {
    const { plugCategoryHash } = ability.plug;
    dispatch({ type: 'update-plugs-by-plug-category-hash', plugCategoryHash, plugs: [ability] });
  };
  return (
    <div className={styles.container}>
      {Boolean(abilities.length) && <div className={styles.title}>{abilities[0].title}</div>}
      <div className={styles.abilities}>
        {abilities.map(({ socket, options }) => (
          <div key={socket.plugged?.plugDef.itemTypeDisplayName} className={styles.options}>
            {options.map((option) => (
              <Option
                key={option.hash}
                option={option}
                isSelected={plugIsSelected(selectedPlugs, option)}
                onSelect={() => selectAbility(option)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function plugIsSelected(selectedPlugs: SelectedPlugs, option: PluggableInventoryItemDefinition) {
  return Boolean(selectedPlugs[option.plug.plugCategoryHash]?.includes(option));
}
