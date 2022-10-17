import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { PressTip } from 'app/dim-ui/PressTip';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { AppIcon, deleteIcon, redoIcon, undoIcon } from 'app/shell/icons';
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
  undo,
  redo,
  hasUndo,
  hasRedo,
}: {
  loadout: Readonly<Loadout>;
  isNew: boolean;
  undo?: () => void;
  redo?: () => void;
  hasUndo?: boolean;
  hasRedo?: boolean;
  onSaveLoadout(e: React.FormEvent, saveAsNew: boolean): void;
  onDeleteLoadout(): void;
}) {
  const clashingLoadout = useSelector(clashingLoadoutSelector(loadout));
  // There's an existing loadout with the same name & class and it's not the loadout we are currently editing
  const clashesWithAnotherLoadout = clashingLoadout && clashingLoadout.id !== loadout.id;

  const saveDisabledReasons: string[] = [];

  if (!loadout.name.length) {
    saveDisabledReasons.push(t('Loadouts.SaveDisabled.NoName'));
  }
  if (clashesWithAnotherLoadout) {
    saveDisabledReasons.push(t('Loadouts.SaveDisabled.AlreadyExists'));
  }

  const loadoutEmpty =
    !loadout.items.length &&
    // Allow mod only loadouts
    !loadout.parameters?.mods?.length &&
    !loadout.parameters?.clearMods &&
    // Allow fashion only loadouts
    _.isEmpty(loadout.parameters?.modsByBucket);
  if (loadoutEmpty) {
    saveDisabledReasons.push(t('Loadouts.SaveDisabled.Empty'));
  }

  const saveDisabled = saveDisabledReasons.length > 0;

  // Don't show "Save as New" if this is a new loadout or we haven't changed the name
  const showSaveAsNew = !isNew;

  const saveAsNewDisabled =
    saveDisabled ||
    // There's an existing loadout with the same name & class
    Boolean(clashingLoadout);

  return (
    <div className={styles.loadoutOptions}>
      <form onSubmit={(e) => onSaveLoadout(e, isNew)}>
        <PressTip
          tooltip={
            saveDisabledReasons.length > 0
              ? saveDisabledReasons.map((reason) => <div key={reason}>{reason}</div>)
              : undefined
          }
        >
          <button className="dim-button" type="submit" disabled={saveDisabled}>
            {isNew ? t('Loadouts.Save') : t('Loadouts.Update')}
          </button>
        </PressTip>
        {showSaveAsNew && (
          <PressTip
            tooltip={
              clashingLoadout
                ? t('Loadouts.SaveDisabled.AlreadyExists')
                : saveDisabled
                ? saveDisabledReasons.join('\n')
                : undefined
            }
          >
            <button
              className="dim-button"
              onClick={(e) => onSaveLoadout(e, true)}
              type="button"
              disabled={saveAsNewDisabled}
              title={t('Loadouts.SaveAsNewTooltip')}
            >
              {t('Loadouts.SaveAsNew')}
            </button>
          </PressTip>
        )}
        {!isNew && (
          <ConfirmButton key="delete" danger onClick={onDeleteLoadout}>
            <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
          </ConfirmButton>
        )}
        {undo && (
          <button
            className="dim-button"
            onClick={undo}
            type="button"
            title={t('Loadouts.Undo')}
            disabled={!hasUndo}
          >
            <AppIcon icon={undoIcon} />
          </button>
        )}
        {redo && (
          <button
            className="dim-button"
            onClick={redo}
            type="button"
            title={t('Loadouts.Redo')}
            disabled={!hasRedo}
          >
            <AppIcon icon={redoIcon} />
          </button>
        )}
        <UserGuideLink topic="Loadouts" />
      </form>
    </div>
  );
}
