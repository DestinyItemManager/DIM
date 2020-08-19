import React, { useState, useEffect } from 'react';
import { ItemPickerState, showItemPicker$ } from './item-picker';
import ItemPicker from './ItemPicker';
import { useLocation } from 'react-router';
import { useSubscription } from 'app/utils/hooks';

// TODO: nest components to make redux happier?

/**
 * A container that can show a single item picker. This is a
 * single element to help prevent multiple pickers from showing
 * at once and to make the API easier.
 */
function ItemPickerContainer() {
  const [generation, setGeneration] = useState(0);
  const [options, setOptions] = useState<ItemPickerState>();

  useSubscription(() =>
    showItemPicker$.subscribe((newOptions) => {
      setOptions((options) => {
        if (options) {
          options.onCancel();
        }
        return newOptions;
      });
      setGeneration((gen) => gen + 1);
    })
  );

  const onClose = () => {
    setOptions(undefined);
  };
  const location = useLocation();
  useEffect(() => onClose(), [location.pathname]);

  if (!options) {
    return null;
  }

  return <ItemPicker key={generation} {...options} onSheetClosed={onClose} />;
}

export default ItemPickerContainer;
