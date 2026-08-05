import { mergeProps, useLongPress, usePress } from 'react-aria';

/**
 * Expose a handler that can either fire a regular click, or an "aleternate
 * click" if either the shift key is held or the user long-presses on a touch
 * device.
 *
 * @example
 * const alternateClickProps = useAlternateClick((alt) => { console.log('clicked', alt ? 'alternate' : 'regular') });
 * return <button {...alternateClickProps}>Click me</button>;
 */
export function useAlternateClick(onClick: (altClick: boolean) => void) {
  const { longPressProps } = useLongPress({
    onLongPress: () => {
      onClick(true);
    },
  });
  const { pressProps } = usePress({
    onPress: (e) => {
      onClick(e.shiftKey);
    },
  });
  return mergeProps(longPressProps, pressProps);
}
