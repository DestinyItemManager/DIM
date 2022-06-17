import clsx from 'clsx';
import styles from './NewItemIndicator.m.scss';

export default function NewItemIndicator({ className }: { className?: string }) {
  return <div className={clsx(styles.newItem, className)} />;
}
