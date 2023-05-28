import { symbolize } from 'app/hotkeys/hotkeys';
import clsx from 'clsx';
import styles from './KeyHelp.m.scss';

/**
 * A keyboard shortcut tip
 */
export default function KeyHelp({ combo, className }: { combo: string; className?: string }) {
  return <span className={clsx(styles.keyHelp, className)}>{symbolize(combo)}</span>;
}
