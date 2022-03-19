import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import { storesSelector } from 'app/inventory/selectors';
import { getClass } from 'app/inventory/store/character-utils';
import { Action } from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { AppIcon, deleteIcon } from 'app/shell/icons';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styles from './LoadoutDrawerOptions.m.scss';

const classTypeOptionsSelector = createSelector(storesSelector, (stores) => {
  const classTypeValues: {
    label: string;
    value: DestinyClass;
  }[] = _.uniqBy(
    stores.filter((s) => !s.isVault),
    (store) => store.classType
  ).map((store) => ({ label: store.className, value: store.classType }));
  return [{ label: t('Loadouts.Any'), value: DestinyClass.Unknown }, ...classTypeValues];
});

export default function LoadoutDrawerOptions({
  loadout,
  showClass,
  isNew,
  stateDispatch,
  saveLoadout,
  saveAsNew,
  deleteLoadout,
}: {
  loadout: Readonly<Loadout> | undefined;
  showClass: boolean;
  isNew: boolean;
  stateDispatch: React.Dispatch<Action>;
  saveLoadout(e: React.FormEvent): void;
  saveAsNew(e: React.MouseEvent): void;
  deleteLoadout(): void;
}) {
  const classTypeOptions = useSelector(classTypeOptionsSelector);

  const loadouts = useSelector(loadoutsSelector);

  if (!loadout) {
    return null;
  }

  // Find a loadout with the same name that could overlap with this one
  // Note that this might be the saved version of this very same loadout!
  const clashingLoadout = loadouts.find(
    (l) =>
      loadout.name === l.name &&
      (loadout.classType === l.classType ||
        l.classType === DestinyClass.Unknown ||
        loadout.classType === DestinyClass.Unknown)
  );

  const setName = (e: React.ChangeEvent<HTMLInputElement>) =>
    stateDispatch({ type: 'setName', name: e.target.value });

  const setClassType = (e: React.ChangeEvent<HTMLSelectElement>) =>
    stateDispatch({ type: 'setClassType', classType: parseInt(e.target.value, 10) });

  const setClearSpace = (e: React.ChangeEvent<HTMLInputElement>) =>
    stateDispatch({ type: 'setClearSpace', clearSpace: e.target.checked });

  const addNotes = () => stateDispatch({ type: 'setNotes', notes: '' });

  // TODO: make the link to loadout optimizer bring the currently equipped items along in route state

  const saveDisabled =
    !loadout.name.length ||
    (!loadout.items.length &&
      !loadout.parameters?.mods?.length &&
      _.isEmpty(loadout.parameters?.modsByBucket)) ||
    // There's an existing loadout with the same name & class and it's not the loadout we are currently editing
    Boolean(clashingLoadout && clashingLoadout.id !== loadout.id);

  const saveAsNewDisabled =
    saveDisabled ||
    // There's an existing loadout with the same name & class
    Boolean(clashingLoadout);

  return (
    <div className={styles.loadoutOptions}>
      <form onSubmit={saveLoadout}>
        <div className={clsx(styles.inputGroup, styles.loadoutName)}>
          <input
            className={styles.dimInput}
            name="name"
            onChange={setName}
            minLength={1}
            maxLength={50}
            required={true}
            type="text"
            value={loadout.name}
            placeholder={t('Loadouts.LoadoutName')}
          />
          {showClass && (
            <select name="classType" onChange={setClassType} value={loadout.classType}>
              {classTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className={styles.inputGroup}>
          <button className="dim-button" type="submit" disabled={saveDisabled}>
            {t('Loadouts.Save')}
          </button>
          {!isNew && (
            <button
              className="dim-button"
              onClick={saveAsNew}
              type="button"
              title={
                clashingLoadout
                  ? clashingLoadout.classType !== DestinyClass.Unknown
                    ? t('Loadouts.AlreadyExistsClass', {
                        className: getClass(clashingLoadout.classType),
                      })
                    : t('Loadouts.AlreadyExistsGlobal')
                  : t('Loadouts.SaveAsNew')
              }
              disabled={saveAsNewDisabled}
            >
              {t('Loadouts.SaveAsNew')}
            </button>
          )}
        </div>
        {!isNew && (
          <div className={styles.inputGroup}>
            <ConfirmButton key="delete" danger onClick={deleteLoadout}>
              <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
            </ConfirmButton>
          </div>
        )}
        {loadout.notes === undefined && (
          <div className={styles.inputGroup}>
            <button
              className="dim-button"
              onClick={addNotes}
              type="button"
              title={t('Loadouts.AddNotes')}
            >
              {t('Loadouts.AddNotes')}
            </button>
          </div>
        )}
        <div className={styles.inputGroup}>
          <label>
            <input type="checkbox" checked={Boolean(loadout.clearSpace)} onChange={setClearSpace} />{' '}
            {t('Loadouts.ClearSpace')}
          </label>
        </div>
      </form>
      {clashingLoadout && clashingLoadout.id !== loadout.id && (
        <div>
          {clashingLoadout.classType !== DestinyClass.Unknown
            ? t('Loadouts.AlreadyExistsClass', {
                className: getClass(clashingLoadout.classType),
              })
            : t('Loadouts.AlreadyExistsGlobal')}
        </div>
      )}
    </div>
  );
}
