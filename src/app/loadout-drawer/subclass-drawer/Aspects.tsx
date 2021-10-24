import { isPluggableItem } from 'app/inventory/store/sockets';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import styles from './Aspects.m.scss';
import { Option } from './SocketOptions';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function Aspects({
  aspects,
  maxSelectable,
  selectedPlugs,
  setSelectedPlugs,
  onOpenPlugPicker,
}: {
  aspects: SocketWithOptions[];
  maxSelectable?: number;
  selectedPlugs: SelectedPlugs;
  setSelectedPlugs(selectedPlugs: SelectedPlugs): void;
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
  const selectionDisplay = Array.from({ length: maxOptions }, (_, index) =>
    index < selectedAspects.length ? selectedAspects[index] : emptySocket
  ).filter(isPluggableItem);

  if (maxOptions === 0) {
    return null;
  }

  const removeAspect = (aspect: DestinyInventoryItemDefinition) => {
    if (isPluggableItem(aspect)) {
      const { plugCategoryHash } = aspect.plug;
      const currentlySelectedAspects = selectedPlugs[plugCategoryHash] || [];
      setSelectedPlugs({
        ...selectedPlugs,
        [plugCategoryHash]: currentlySelectedAspects.filter(
          (selected) => selected.hash !== aspect.hash
        ),
      });
    }
  };

  return (
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
  );
}
