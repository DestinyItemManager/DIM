import clsx from 'clsx';
import * as styles from './SetCard.m.scss';

/**
 * A card for displaying a set of items (armor sets, ornament sets, etc.)
 * with a title and optional completed state.
 */
export default function SetCard({
  title,
  complete = false,
  children,
}: {
  title: React.ReactNode;
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx(styles.card, { [styles.complete]: complete }, 'set-card')}>
      <h4 className={styles.title}>{title}</h4>
      {children}
    </div>
  );
}
