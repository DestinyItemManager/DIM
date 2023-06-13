import { clsx } from 'clsx';
import styles from './CollectiblesGrid.m.scss';

/**
 * A grid of items for collections, etc.
 * TODO: probably could be a generic item grid component
 */
export default function CollectiblesGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(styles.collectibles, className)}>{children}</div>;
}
