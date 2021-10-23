import { isPluggableItem } from 'app/inventory/store/sockets';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styles from './Aspects.m.scss';
import SocketOptions, { Option } from './SocketOptions';
import { SelectedPlugs, SocketWithOptions } from './types';

export default function Aspects({
  aspects,
  maxSelectable,
  selectedPlugs,
  setSelectedPlugs,
}: {
  aspects: SocketWithOptions[];
  maxSelectable?: number;
  selectedPlugs: SelectedPlugs;
  setSelectedPlugs(selectedPlugs: SelectedPlugs): void;
}) {
  const plugCategoryHash = aspects[0].options[0].plug?.plugCategoryHash;
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

  const displayedOptions: SocketWithOptions[] = useMemo(() => {
    if (!aspects.length) {
      return [];
    }

    const firstAspect = aspects[0];
    const options = firstAspect.options.filter((option) => option.hash !== emptySocket?.hash);
    return [{ ...firstAspect, options }];
  }, [aspects, emptySocket?.hash]);

  if (maxOptions === 0) {
    return null;
  }

  const addAspect = (aspect: DestinyInventoryItemDefinition) => {
    if (isPluggableItem(aspect)) {
      const { plugCategoryHash } = aspect.plug;
      const currentlySelectedAspects = selectedPlugs[plugCategoryHash] || [];
      if (currentlySelectedAspects.length < maxOptions) {
        setSelectedPlugs({
          ...selectedPlugs,
          [plugCategoryHash]: [...currentlySelectedAspects, aspect],
        });
      }
    }
  };

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
    <div>
      <div className={styles.selectedAspects}>
        {selectionDisplay.map((aspect, index) => (
          <Option
            key={`${aspect.hash}-${index}`}
            option={aspect}
            isSelected={false}
            onRemove={() => removeAspect(aspect)}
          />
        ))}
      </div>
      <SocketOptions
        socketsWithOptions={displayedOptions}
        selectedPlugs={selectedPlugs}
        direction="row"
        onSelect={addAspect}
        onRemove={removeAspect}
      />
    </div>
  );
}
