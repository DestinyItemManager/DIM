import { clsx } from 'clsx';
import styles from './TileGrid.m.scss';

/**
 * A grid of tiles with an optional header, e.g. the mod picker, exotic picker,
 * or subclass picker tiles.
 *
 * Tile size can be tweaked using the --tile-grid-width CSS variable.
 */
export function TileGrid({
  className,
  header,
  children,
}: {
  className?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {Boolean(header) && <div className={styles.header}>{header}</div>}
      <div className={styles.items}>{children}</div>
    </div>
  );
}

/**
 * An individual tile in the tile grid. Has an icon on the left, and content on the right.
 */
export function TileGridTile({
  className,
  children,
  icon,
  title,
  selected,
  disabled,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  title: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick: React.MouseEventHandler<HTMLElement>;
}) {
  return (
    <div
      className={clsx(className, styles.tile, {
        [styles.selected]: selected,
        [styles.disabled]: disabled,
      })}
      onClick={disabled ? undefined : onClick}
      role="button"
      aria-disabled={disabled}
      aria-pressed={selected}
      tabIndex={0}
    >
      <>
        {icon}
        <div className={styles.details}>
          <div className={styles.title}>{title}</div>
          {children}
        </div>
      </>
    </div>
  );
}
