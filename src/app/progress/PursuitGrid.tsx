import clsx from 'clsx';
import * as styles from './PursuitGrid.m.scss';

/**
 * A grid of pursuits or milestones for the Progress page. Used for the
 * Milestones, Bounties, Quests, Raids and Ranks sections, etc. For the bordered
 * Triumph style use Records.
 */
export default function PursuitGrid({
  ranks,
  children,
}: {
  /** Is this the "Ranks" section? It gets slightly different styling on mobile. */
  ranks?: boolean;
  children: React.ReactNode;
}) {
  return <div className={clsx(styles.grid, { [styles.ranks]: ranks })}>{children}</div>;
}
