import clsx from 'clsx';
import * as styles from './RadioButton.m.scss';

/**
 * A radio button for the in-game loadout editor.
 */
export function RadioButton({
  option: hash,
  name,
  value,
  onSelected,
  children,
  spaced,
  hasLoadout,
}: {
  option: number;
  name: string;
  value: number;
  onSelected: (value: number) => void;
  children: React.ReactNode;
  spaced?: boolean;
  hasLoadout?: boolean;
}) {
  return (
    <label
      key={hash}
      className={clsx(styles.button, {
        [styles.checked]: value === hash,
        [styles.hasLoadout]: hasLoadout,
        [styles.spaced]: spaced,
      })}
    >
      <input
        type="radio"
        name={name}
        value={hash}
        checked={value === hash}
        readOnly={true}
        onClick={() => onSelected(hash)}
      />
      {children}
    </label>
  );
}
