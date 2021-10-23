import { sortedStoresSelector } from 'app/inventory/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { compareBy } from 'app/utils/comparators';
import { emptyObject } from 'app/utils/empty';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import ClassIcon from './ClassIcon';
import styles from './ClassSelect.m.scss';

const classOrderSelector = createSelector(sortedStoresSelector, (stores) =>
  _.uniq(stores.filter((s) => !s.isVault).map((s) => s.classType))
);

const classNamesSelector = createSelector(
  d2ManifestSelector,
  (defs): { [classType in DestinyClass]?: string } =>
    defs
      ? Object.fromEntries(
          Object.values(defs.Class).map((c) => [c.classType, c.displayProperties.name])
        )
      : emptyObject()
);

/**
 * The swipable header for selecting from a list of characters.
 *
 * This is currently a copy/paste of PhoneStoresHeader once both are done, if they are still similar, recombine them.
 */
export default function ClassSelect({
  classType,
  onClassTypeChanged,
}: {
  classType: DestinyClass;
  onClassTypeChanged(classType: DestinyClass): void;
}) {
  const classNames = useSelector(classNamesSelector);
  const classOrder = useSelector(classOrderSelector);

  const classes = classOrder.sort(
    compareBy((c) => {
      const index = classOrder.indexOf(c);
      return index >= 0 ? index : Number.MAX_VALUE;
    })
  );

  return (
    <div className={styles.classSelect}>
      {classes.map((c) => (
        <button
          type="button"
          key={c.toString()}
          className={clsx(styles.button, {
            [styles.selected]: c === classType,
            [styles.disabled]: !classOrder.includes(c),
          })}
          onClick={classOrder.includes(c) ? () => onClassTypeChanged(c) : undefined}
          title={classNames[c]}
        >
          <ClassIcon classType={c} />
        </button>
      ))}
    </div>
  );
}
