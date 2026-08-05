import clsx from 'clsx';
import React from 'react';
import { mergeProps, useLongPress, usePress } from 'react-aria';
import * as styles from './FilterPills.m.scss';

export interface Option<T> {
  readonly key: string;
  readonly value: T;
  readonly content: React.ReactNode;
}

/**
 * A generic interface for showing a row of "pills" that can be used for filtering items. Like the bounty guide, but simpler.
 * This is a controlled component - the state of options should be managed externally.
 */
export default function FilterPills<T>({
  options,
  selectedOptions,
  onOptionsSelected,
  className,
  darkBackground,
  extra,
}: {
  options: readonly Option<T>[];
  selectedOptions: readonly Option<T>[];
  onOptionsSelected: (options: Option<T>[]) => void;
  className?: string;
  darkBackground?: boolean;
  extra?: React.ReactNode;
}) {
  const onClickPill = (option: Option<T>, shiftHeld: boolean) => {
    const match = (o: Option<T>) => o.key === option.key;
    if (shiftHeld) {
      const existing = selectedOptions.find(match);
      if (existing) {
        onOptionsSelected(selectedOptions.filter((o) => !match(o)));
      } else {
        onOptionsSelected([...selectedOptions, option]);
      }
    } else if (selectedOptions.length > 1 || !selectedOptions.some(match)) {
      onOptionsSelected([option]);
    } else {
      onOptionsSelected([]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOptionsSelected([]);
  };

  return (
    <div
      className={clsx(styles.guide, className, { [styles.darkBackground]: darkBackground })}
      onClick={clearSelection}
    >
      {options.map((o) => (
        <Pill
          key={o.key}
          option={o}
          selected={selectedOptions.some((other) => other.key === o.key)}
          onClick={onClickPill}
        />
      ))}
      {extra}
    </div>
  );
}

function Pill<T>({
  onClick,
  option,
  selected,
}: {
  option: Option<T>;
  selected: boolean;
  onClick: (option: Option<T>, shiftHeld: boolean) => void;
}) {
  const { longPressProps } = useLongPress({
    onLongPress: () => {
      onClick(option, true);
    },
  });
  const { pressProps } = usePress({
    onPress: (e) => {
      onClick(option, e.shiftKey);
    },
  });
  return (
    <button
      type="button"
      className={clsx(styles.pill, {
        [styles.selected]: selected,
      })}
      {...mergeProps(longPressProps, pressProps)}
    >
      {option.content}
    </button>
  );
}
