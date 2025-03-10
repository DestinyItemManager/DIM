import { noop } from 'app/utils/functions';
import { createContext, use, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import ItemPicker from './ItemPicker';
import { ItemPickerState } from './item-picker';

export const ItemPickerContext = createContext<(value: ItemPickerState | undefined) => void>(noop);

/**
 * A container that can show a single item picker. This is a single element to
 * help prevent multiple pickers from showing at once and to make the API
 * easier. It uses context so you can nest item picker containers and the
 * closest one in the tree to your component will handle showing the picker.
 */
export default function ItemPickerContainer({ children }: { children: React.ReactNode }) {
  const parentSetOptions = use(ItemPickerContext);

  // The "generation" just allows us to set a key so the item picker isn't reused between different invocations
  const [generation, setGeneration] = useState(0);
  const [options, setOptionsState] = useState<ItemPickerState>();

  const setOptions = useCallback(
    (newOptions: ItemPickerState | undefined) => {
      // Close any open item pickers higher up the tree - we want to have only one
      parentSetOptions(undefined);
      setOptionsState((options) => {
        if (options) {
          // Cleanup any existing item picker
          options.onItemSelected(undefined);
        }
        return newOptions;
      });
      setGeneration((gen) => gen + 1);
    },
    [parentSetOptions],
  );

  const onClose = useCallback(() => {
    setOptionsState((options) => {
      if (options) {
        // Cleanup any existing item picker
        options.onItemSelected(undefined);
      }
      return undefined;
    });
  }, []);

  // Close the item picker if we change page
  const location = useLocation();
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <ItemPickerContext value={setOptions}>
      {children}
      {options && <ItemPicker key={generation} {...options} onSheetClosed={onClose} />}
    </ItemPickerContext>
  );
}
