import clsx from 'clsx';
import * as styles from './NewItemIndicator.m.scss';

export default function NewItemIndicator({ className }: { className?: string }) {
  return <div className={clsx(styles.newItem, className)} />;
}
