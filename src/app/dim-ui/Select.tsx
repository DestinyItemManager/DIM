import { moveDownIcon, moveUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import clsx from 'clsx';
import { useSelect } from 'downshift';
import React, { ReactNode, useRef } from 'react';
import styles from './Select.m.scss';
import { usePopper } from './usePopper';

export interface Option<T> {
  key: string;
  content: ReactNode;
  disabled?: boolean;
  value?: T;
}

interface Props<T> {
  className?: string;
  /** Hide the selected option from the dropdown */
  hideSelected?: boolean;
  disabled?: boolean;
  value?: T;
  options: Option<T>[];
  /** Optional override for the button content */
  children?: ReactNode;
  onChange(value?: T): void;
}

/**
 * A Select menu, which maintains a current value and a dropdown to choose
 * another value. A replacement for HTML's <select> element. This is a
 * controlled component.
 *
 * @see Dropdown for a menu of commands
 * @see MultiSelect for multiple-item selector
 */
export default function Select<T>({
  className,
  disabled,
  options: items,
  onChange,
  value,
  hideSelected,
  children,
}: Props<T>) {
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
    selectedItem,
  } = useSelect({
    items,
    selectedItem: items.find((o) => o.value === value),
    itemToString: (i) => i?.key || 'none',
    onSelectedItemChange: ({ selectedItem }) => onChange(selectedItem?.value),
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  usePopper({
    contents: menuRef,
    reference: buttonRef,
    placement: 'bottom-start',
    offset: 2,
  });

  if (!selectedItem) {
    throw new Error('value must correspond to one of the provided options');
  }

  return (
    <div className={className}>
      {children ? (
        <button type="button" {...getToggleButtonProps({ ref: buttonRef })} disabled={disabled}>
          {children}
        </button>
      ) : (
        <button
          type="button"
          {...getToggleButtonProps({ ref: buttonRef })}
          className={styles.button}
          disabled={disabled}
        >
          {selectedItem.content}{' '}
          <AppIcon icon={isOpen ? moveUpIcon : moveDownIcon} className={styles.arrow} />
        </button>
      )}
      <div
        {...getMenuProps({ ref: menuRef })}
        className={clsx(styles.menu, { [styles.open]: isOpen })}
      >
        {isOpen &&
          items.map(
            (item, index) =>
              !(hideSelected && item.value === value) && (
                <div
                  className={clsx(styles.menuItem, {
                    [styles.highlighted]: highlightedIndex === index,
                    highlighted: highlightedIndex === index,
                    [styles.disabled]: item.disabled,
                  })}
                  key={item.key}
                  {...getItemProps({
                    item,
                    index,
                    onClick: (e: any) => {
                      e.nativeEvent.preventDownshiftDefault = item.disabled;
                    },
                  })}
                >
                  {item.content}
                </div>
              )
          )}
      </div>
    </div>
  );
}
