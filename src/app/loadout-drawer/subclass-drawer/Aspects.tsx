import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getModRenderKey } from 'app/loadout/mod-utils';
import _ from 'lodash';
import React, { useCallback } from 'react';
import styles from './Aspects.m.scss';
import Option from './Option';
import { SDDispatch } from './reducer';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function Aspects({
  aspects,
  maxSelectable,
  selectedPlugs,
  dispatch,
  onOpenPlugPicker,
}: {
  aspects: SocketWithOptions[];
  maxSelectable?: number;
  selectedPlugs: SelectedPlugs;
  dispatch: SDDispatch;
  onOpenPlugPicker(): void;
}) {
  const plugCategoryHash =
    aspects?.length && aspects[0].options.length
      ? aspects[0].options[0].plug?.plugCategoryHash
      : undefined;
  const emptySockets = _.compact(
    aspects.map(({ socket, options }) =>
      options.find((option) => option.hash === socket.socketDefinition.singleInitialItemHash)
    )
  );
  const emptySocket = emptySockets.length ? emptySockets[0] : undefined;
  const maxOptions = maxSelectable !== undefined ? maxSelectable : aspects.length;

  const selectedAspects = (plugCategoryHash && selectedPlugs[plugCategoryHash]) || [];
  const selectionDisplay = _.compact(
    Array.from({ length: maxOptions }, (_, index) =>
      index < selectedAspects.length ? selectedAspects[index] : emptySocket
    )
  );

  const plugCounts = {};

  return (
    <div className={styles.container}>
      {Boolean(aspects.length) && <div className={styles.title}>{aspects[0].title}</div>}
      <div className={styles.selectedAspects}>
        {selectionDisplay.map((aspect) => (
          <Aspect
            key={getModRenderKey(aspect, plugCounts)}
            aspect={aspect}
            selectedPlugs={selectedPlugs}
            dispatch={dispatch}
            onOpenPlugPicker={onOpenPlugPicker}
          />
        ))}
      </div>
    </div>
  );
}

function Aspect({
  aspect,
  selectedPlugs,
  dispatch,
  onOpenPlugPicker,
}: {
  aspect: PluggableInventoryItemDefinition;
  selectedPlugs: SelectedPlugs;
  dispatch: SDDispatch;
  onOpenPlugPicker(): void;
}) {
  const onRemove = useCallback(() => {
    const { plugCategoryHash } = aspect.plug;
    const newAspects =
      selectedPlugs[plugCategoryHash]?.filter((selected) => selected.hash !== aspect.hash) || [];
    dispatch({ type: 'update-plugs-by-plug-category-hash', plugs: newAspects, plugCategoryHash });
  }, [aspect.hash, aspect.plug, dispatch, selectedPlugs]);

  return (
    <Option option={aspect} isSelected={false} onRemove={onRemove} onSelect={onOpenPlugPicker} />
  );
}
