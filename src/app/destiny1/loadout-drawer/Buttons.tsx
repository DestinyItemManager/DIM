import { addIcon, AppIcon } from 'app/shell/icons';
import clsx from 'clsx';
import styles from './Buttons.m.scss';

interface AddButtonProps {
  /** An additional className to be passed to the component. */
  className?: string;
  onClick: () => void;
}

/**
 * A button with a plus icon that is intended to sit next to items/mods.
 */
export function AddButton({ className, onClick }: AddButtonProps) {
  return (
    <a className={clsx(styles.add, className)} onClick={onClick}>
      <AppIcon icon={addIcon} />
    </a>
  );
}
