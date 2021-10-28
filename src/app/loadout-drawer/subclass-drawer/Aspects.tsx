import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import _ from 'lodash';
import React from 'react';
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

  const removeAspect = (aspect: PluggableInventoryItemDefinition) => {
    const { plugCategoryHash } = aspect.plug;
    const newAspects =
      selectedPlugs[plugCategoryHash]?.filter((selected) => selected.hash !== aspect.hash) || [];
    dispatch({ type: 'update-plugs-by-plug-category-hash', plugs: newAspects, plugCategoryHash });
  };

  return (
    <div className={styles.container}>
      {Boolean(aspects.length) && <div className={styles.title}>{aspects[0].title}</div>}
      <div className={styles.selectedAspects}>
        {selectionDisplay.map((aspect, index) => (
          <Option
            key={`${aspect.hash}-${index}`}
            option={aspect}
            isSelected={false}
            onRemove={() => removeAspect(aspect)}
            onSelect={onOpenPlugPicker}
          />
        ))}
      </div>
    </div>
  );
}
