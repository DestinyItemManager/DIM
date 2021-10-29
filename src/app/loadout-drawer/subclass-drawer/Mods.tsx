import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getModRenderKey } from 'app/loadout/mod-utils';
import _ from 'lodash';
import React, { useCallback } from 'react';
import styles from './Mods.m.scss';
import Plug from './Plug';
import { SDDispatch } from './reducer';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function Mods({
  mods,
  maxSelectable,
  selectedPlugs,
  dispatch,
  onOpenPlugPicker,
}: {
  mods: SocketWithOptions[];
  maxSelectable?: number;
  selectedPlugs: SelectedPlugs;
  dispatch: SDDispatch;
  onOpenPlugPicker(): void;
}) {
  const plugCategoryHash =
    mods?.length && mods[0].options.length ? mods[0].options[0].plug?.plugCategoryHash : undefined;
  const emptySocketPlugs = _.compact(
    mods.map(({ socket, options }) =>
      options.find((option) => option.hash === socket.socketDefinition.singleInitialItemHash)
    )
  );
  const emptySocketPlug = emptySocketPlugs.length ? emptySocketPlugs[0] : undefined;
  const maxOptions = maxSelectable !== undefined ? maxSelectable : mods.length;

  const selectedMods = (plugCategoryHash && selectedPlugs[plugCategoryHash]) || [];

  // We add out the total number of selectable mods with empty plug icons
  const selectionDisplay = _.compact(
    Array.from({ length: maxOptions }, (_, index) =>
      index < selectedMods.length ? selectedMods[index] : emptySocketPlug
    )
  );

  const plugCounts = {};

  return (
    <div className={styles.container}>
      {Boolean(mods.length) && <div className={styles.title}>{mods[0].title}</div>}
      <div className={styles.selectedMods}>
        {selectionDisplay.map((mod) => (
          <Mod
            key={getModRenderKey(mod, plugCounts)}
            mod={mod}
            selectedPlugs={selectedPlugs}
            isRemoveable={mod.hash !== emptySocketPlug?.hash}
            dispatch={dispatch}
            onOpenPlugPicker={onOpenPlugPicker}
          />
        ))}
      </div>
    </div>
  );
}

function Mod({
  mod,
  selectedPlugs,
  isRemoveable,
  dispatch,
  onOpenPlugPicker,
}: {
  mod: PluggableInventoryItemDefinition;
  selectedPlugs: SelectedPlugs;
  isRemoveable: boolean;
  dispatch: SDDispatch;
  onOpenPlugPicker(): void;
}) {
  const onRemove = useCallback(() => {
    const { plugCategoryHash } = mod.plug;
    const newAspects =
      selectedPlugs[plugCategoryHash]?.filter((selected) => selected.hash !== mod.hash) || [];
    dispatch({ type: 'update-plugs-by-plug-category-hash', plugs: newAspects, plugCategoryHash });
  }, [mod.hash, mod.plug, dispatch, selectedPlugs]);

  return (
    <Plug
      plug={mod}
      isSelected={false}
      onRemove={isRemoveable ? onRemove : undefined}
      onSelect={onOpenPlugPicker}
    />
  );
}
