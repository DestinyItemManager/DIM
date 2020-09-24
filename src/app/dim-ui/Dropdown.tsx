import { kebabIcon, moveDownIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import clsx from 'clsx';
import { useSelect } from 'downshift';
import React, { ReactNode, useRef } from 'react';
import styles from './Dropdown.m.scss';
import { usePopper } from './usePopper';

export interface Option {
  key: string;
  content: ReactNode;
  disabled?: boolean;
  onSelected(): void;
}

interface Props {
  /** The contents of the button */
  children?: ReactNode;
  /** Kebab mode - just show a single kebab icon */
  kebab?: boolean;
  className?: string;
  disabled?: boolean;
  options: Option[];
  offset?: number;
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
}: Props) {
  const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } = useSelect({
    items,
    itemToString: (i) => i?.key || 'none',
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  usePopper({
    contents: menuRef,
    reference: buttonRef,
    placement: 'bottom-start',
    offset,
  });

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        {...getToggleButtonProps({ ref: buttonRef })}
        className={kebab ? styles.kebabButton : styles.button}
        disabled={disabled}
      >
        {kebab ? (
          <AppIcon icon={kebabIcon} />
        ) : (
          <>
            {children} <AppIcon icon={moveDownIcon} />
          </>
        )}
      </button>
      <div {...getMenuProps({ ref: menuRef })} className={styles.menu}>
        {isOpen &&
          items.map((item, index) => (
            <div
              className={clsx(styles.menuItem, {
                [styles.highlighted]: highlightedIndex === index,
                [styles.disabled]: item.disabled,
              })}
              key={item.key}
              {...getItemProps({
                item,
                index,
                onClick: !item.disabled ? item.onSelected : undefined,
              })}
            >
              {item.content}
            </div>
          ))}
      </div>
    </div>
  );
}
