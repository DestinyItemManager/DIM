import * as styles from './CollectiblesGrid.m.scss';

/**
 * A grid of items for collections, etc.
 * TODO: probably could be a generic item grid component
 */
export default function CollectiblesGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.collectibles}>{children}</div>;
}
