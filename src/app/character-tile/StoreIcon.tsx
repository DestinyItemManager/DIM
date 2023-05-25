import ClassIcon from 'app/dim-ui/ClassIcon';
import { DimStore } from 'app/inventory/store-types';
import clsx from 'clsx';
import styles from './StoreIcon.m.scss';

/**
 * Show both the store emblem and class icon for a given store.
 *
 * Providing a label overrides the class icon.
 *
 * @param useBackground uses a portion of the emblem's banner,
 * which is a little more neutral, instead of the square
 * version of the emblem
 */
export function StoreIcon({
  store,
  label,
  useBackground,
}: {
  store: DimStore;
  label?: string;
  useBackground?: boolean;
}) {
  const bgColor =
    store.color &&
    `rgb(${[store.color.red, store.color.green, store.color.blue].map(Math.round).join()})`;

  return (
    <>
      <img
        src={!useBackground ? store.icon : store.background}
        className={clsx({ [styles.dimmedBg]: store.isVault && label })}
        style={{ backgroundColor: bgColor ?? 'black' }}
      />
      {label ? (
        <span className={styles.label}>{label}</span>
      ) : (
        !store.isVault && <ClassIcon classType={store.classType} className={styles.classIcon} />
      )}
    </>
  );
}
