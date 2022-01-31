import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import { getClass } from 'app/inventory/store/character-utils';
import { AppIcon, deleteIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { currySelector } from 'app/utils/redux-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { Loadout } from './loadout-types';
import styles from './LoadoutDrawerFooter.m.scss';
import { loadoutsSelector } from './selectors';

/**
 * Find a loadout with the same name that could overlap with this one
 * Note that this might be the saved version of this very same loadout!
 */
const clashingLoadoutSelector = currySelector(
  createSelector(
    loadoutsSelector,
    (_: RootState, loadout: Loadout) => loadout,
    (loadouts, loadout) =>
      loadouts.find(
        (l) =>
          loadout.name === l.name &&
          (loadout.classType === l.classType ||
            l.classType === DestinyClass.Unknown ||
            loadout.classType === DestinyClass.Unknown)
      )
  )
);

export default function LoadoutDrawerFooter({
  loadout,
  isNew,
  onSaveLoadout,
  onDeleteLoadout,
}: {
  loadout: Readonly<Loadout>;
  isNew: boolean;
  onSaveLoadout(e: React.FormEvent, saveAsNew?: boolean): void;
  onDeleteLoadout(): void;
}) {
  const clashingLoadout = useSelector(clashingLoadoutSelector(loadout));
  // There's an existing loadout with the same name & class and it's not the loadout we are currently editing
  const clashesWithAnotherLoadout = clashingLoadout && clashingLoadout.id !== loadout.id;

  const clashingLoadoutWarning = clashesWithAnotherLoadout
    ? clashingLoadout.classType !== DestinyClass.Unknown
      ? t('Loadouts.AlreadyExistsClass', {
          className: getClass(clashingLoadout.classType),
        })
      : t('Loadouts.AlreadyExistsGlobal')
    : undefined;

  const saveDisabled =
    !loadout.name.length ||
    clashesWithAnotherLoadout ||
    (!loadout.items.length &&
      // Allow mod only loadouts
      !loadout.parameters?.mods?.length &&
      // Allow fashion only loadouts
      _.isEmpty(loadout.parameters?.modsByBucket));

  // Don't show "Save as New" if this is a new loadout or we haven't changed the name
  const showSaveAsNew = !isNew && (!clashingLoadout || clashingLoadout.id !== loadout.id);

  const saveAsNewDisabled =
    saveDisabled ||
    // There's an existing loadout with the same name & class
    Boolean(clashingLoadout);

  return (
    <div className={styles.loadoutOptions}>
      {clashingLoadoutWarning && <div>{clashingLoadoutWarning}</div>}
      <form onSubmit={onSaveLoadout}>
        <div className={styles.inputGroup}>
          <button
            className="dim-button"
            type="submit"
            disabled={saveDisabled}
            title={clashingLoadoutWarning}
          >
            {isNew ? t('Loadouts.Save') : t('Loadouts.Update')}
          </button>
          {showSaveAsNew && (
            <button
              className="dim-button"
              onClick={(e) => onSaveLoadout(e, true)}
              type="button"
              title={
                clashingLoadout
                  ? clashingLoadout.classType !== DestinyClass.Unknown
                    ? t('Loadouts.AlreadyExistsClass', {
                        className: getClass(clashingLoadout.classType),
                      })
                    : t('Loadouts.AlreadyExistsGlobal')
                  : t('Loadouts.SaveAsNewTooltip')
              }
              disabled={saveAsNewDisabled}
            >
              {t('Loadouts.SaveAsNew')}
            </button>
          )}
          {!isNew && (
            <ConfirmButton key="delete" danger onClick={onDeleteLoadout}>
              <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
            </ConfirmButton>
          )}
        </div>
      </form>
    </div>
  );
}
