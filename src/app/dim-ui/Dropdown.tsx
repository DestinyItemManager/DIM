import { Placement } from '@popperjs/core';
import { expandDownIcon, kebabIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import clsx from 'clsx';
import { useSelect } from 'downshift';
import { ReactNode, useRef } from 'react';
import styles from './Dropdown.m.scss';
import { usePopper } from './usePopper';

interface Separator {
  key: string;
}

interface DropdownOption {
  key: string;
  content: ReactNode;
  disabled?: boolean;
  onSelected: () => void;
}

export type Option = Separator | DropdownOption;

interface Props {
  /** The contents of the button */
  children?: ReactNode;
  /** Kebab mode - just show a single kebab icon */
  kebab?: boolean;
  className?: string;
  disabled?: boolean;
  options: Option[];
  offset?: number;
  fixed?: boolean;
  placement?: Placement;
  label: string;
}

function isDropdownOption(option: Option): option is DropdownOption {
  return (option as DropdownOption).content !== undefined;
}

/**
 * A generic dropdown menu, triggered from a button, with a list of menu items
 * which can each trigger a command. No state is kept about the selected item -
 * use Select for that.
 *
 * @see Select for a single item selector
 * @see MultiSelect for multiple-item selector
 */
export default function Dropdown({
  children,
  kebab,
  className,
  disabled,
  options: items,
  offset,
  fixed,
  placement = kebab ? 'bottom-end' : 'bottom-start',
  label,
}: Props) {
  const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps, reset } =
    useSelect({
      items,
      itemToString: (i) => i?.key || 'none',
      onSelectedItemChange: ({ selectedItem }) => {
        if (selectedItem && isDropdownOption(selectedItem) && !selectedItem.disabled) {
          selectedItem.onSelected();
        }
        // Unselect to reset the state
        reset();
      },
      isItemDisabled: (item) => (isDropdownOption(item) ? Boolean(item.disabled) : true),
    });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  usePopper({
    contents: menuRef,
    reference: buttonRef,
    placement,
    offset,
    fixed,
  });

  return (
    <div className={className}>
      <button
        type="button"
        {...getToggleButtonProps({ ref: buttonRef, disabled, title: label })}
        className={kebab ? styles.kebabButton : styles.button}
      >
        {kebab ? (
          <AppIcon icon={kebabIcon} />
        ) : (
          <>
            {children} <AppIcon icon={expandDownIcon} className={styles.arrow} />
          </>
        )}
      </button>
      <div {...getMenuProps({ ref: menuRef, className: styles.menu })}>
        {isOpen &&
          items.map((item, index) =>
            !isDropdownOption(item) ? (
              <div
                key={item.key}
                className={styles.separator}
                {...getItemProps({
                  item,
                  index,
                })}
              />
            ) : (
              <div
                className={clsx(styles.menuItem, {
                  [styles.highlighted]: highlightedIndex === index,
                  [styles.disabled]: item.disabled,
                })}
                key={item.key}
                {...getItemProps({
                  item,
                  index,
                })}
              >
                {item.content}
              </div>
            ),
          )}
      </div>
    </div>
  );
}
