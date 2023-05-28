import { useEventBusListener } from 'app/utils/hooks';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import ItemPicker from './ItemPicker';
import { ItemPickerState, hideItemPicker$, showItemPicker$ } from './item-picker';

// TODO: nest components to make redux happier?

/**
 * A container that can show a single item picker. This is a
 * single element to help prevent multiple pickers from showing
 * at once and to make the API easier.
 */
export default function ItemPickerContainer() {
  const [generation, setGeneration] = useState(0);
  const [options, setOptions] = useState<ItemPickerState>();

  useEventBusListener(
    showItemPicker$,
    useCallback((newOptions) => {
      setOptions((options) => {
        if (options) {
          options.onCancel();
        }
        return newOptions;
      });
      setGeneration((gen) => gen + 1);
    }, [])
  );

  useEventBusListener(
    hideItemPicker$,
    useCallback(() => {
      setOptions(() => undefined);
    }, [])
  );

  const onClose = () => setOptions(undefined);
  const location = useLocation();
  useEffect(() => onClose(), [location.pathname]);

  if (!options) {
    return null;
  }

  return <ItemPicker key={generation} {...options} onSheetClosed={onClose} />;
}
