import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { PressTip } from 'app/dim-ui/PressTip';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { loadoutSavedSelector } from 'app/loadout/selectors';
import { AppIcon, deleteIcon, redoIcon, undoIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { isEmpty } from 'app/utils/collections';
import { isClassCompatible } from 'app/utils/item-utils';
import { currySelector } from 'app/utils/selectors';
import React from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { Loadout } from '../loadout/loadout-types';
import { loadoutsSelector } from '../loadout/loadouts-selector';
import styles from './LoadoutDrawerFooter.m.scss';

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
        (l) => loadout.name === l.name && isClassCompatible(l.classType, loadout.classType),
      ),
  ),
);

export default function LoadoutDrawerFooter({
  loadout,
  onSaveLoadout,
  onDeleteLoadout,
  undo,
  redo,
  hasUndo,
  hasRedo,
}: {
  loadout: Readonly<Loadout>;
  undo?: () => void;
  redo?: () => void;
  hasUndo?: boolean;
  hasRedo?: boolean;
  onSaveLoadout: (e: React.FormEvent, saveAsNew: boolean) => void;
  onDeleteLoadout: () => void;
}) {
  const isSaved = useSelector(loadoutSavedSelector(loadout.id));
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
    isEmpty(loadout.parameters?.modsByBucket);
  if (loadoutEmpty) {
    saveDisabledReasons.push(t('Loadouts.SaveDisabled.Empty'));
  }

  const saveDisabled = saveDisabledReasons.length > 0;

  // Don't show "Save as New" if this is a new loadout or we haven't changed the name
  const showSaveAsNew = isSaved;

  const saveAsNewDisabled =
    saveDisabled ||
    // There's an existing loadout with the same name & class
    Boolean(clashingLoadout);

  return (
    <div className={styles.loadoutOptions}>
      <form onSubmit={(e) => onSaveLoadout(e, !isSaved)}>
        <PressTip
          tooltip={
            saveDisabledReasons.length > 0
              ? saveDisabledReasons.map((reason) => <div key={reason}>{reason}</div>)
              : undefined
          }
        >
          <button className="dim-button" type="submit" disabled={saveDisabled}>
            {isSaved ? t('Loadouts.Update') : t('Loadouts.Save')}
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
        {isSaved && (
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
