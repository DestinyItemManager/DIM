import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React, { useCallback } from 'react';
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
  return (
    <div className={styles.container}>
      {Boolean(abilities.length) && <div className={styles.title}>{abilities[0].title}</div>}
      <div className={styles.abilities}>
        {abilities.map(({ socket, options }) => (
          <div key={socket.plugged?.plugDef.itemTypeDisplayName} className={styles.options}>
            {options.map((ability) => (
              <Ability
                key={ability.hash}
                ability={ability}
                isSelected={plugIsSelected(selectedPlugs, ability)}
                dispatch={dispatch}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Ability({
  ability,
  isSelected,
  dispatch,
}: {
  ability: PluggableInventoryItemDefinition;
  isSelected: boolean;
  dispatch: SDDispatch;
}) {
  const onSelect = useCallback(() => {
    const { plugCategoryHash } = ability.plug;
    dispatch({ type: 'update-plugs-by-plug-category-hash', plugCategoryHash, plugs: [ability] });
  }, [ability, dispatch]);

  return <Option option={ability} isSelected={isSelected} onSelect={onSelect} />;
}

function plugIsSelected(selectedPlugs: SelectedPlugs, option: PluggableInventoryItemDefinition) {
  return Boolean(selectedPlugs[option.plug.plugCategoryHash]?.includes(option));
}
