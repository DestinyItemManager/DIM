import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getClass } from 'app/inventory/store/character-utils';
import ModAssignmentDrawer from 'app/loadout/mod-assignment-drawer/ModAssignmentDrawer';
import { AppIcon, deleteIcon } from 'app/shell/icons';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Prompt } from 'react-router';
import { Link } from 'react-router-dom';
import { Loadout } from './loadout-types';

export default function LoadoutDrawerOptions({
  loadout,
  showClass,
  isNew,
  classTypeOptions,
  updateLoadout,
  onUpdateMods,
  clashingLoadout,
  saveLoadout,
  saveAsNew,
  deleteLoadout,
}: {
  loadout?: Readonly<Loadout>;
  showClass: boolean;
  isNew: boolean;
  clashingLoadout?: Loadout;
  classTypeOptions: {
    label: string;
    value: DestinyClass;
  }[];
  updateLoadout(loadout: Loadout): void;
  onUpdateMods(mods: PluggableInventoryItemDefinition[]): void;
  saveLoadout(e: React.FormEvent): void;
  saveAsNew(e: React.MouseEvent): void;
  deleteLoadout(e: React.MouseEvent): void;
}) {
  const [showModAssignmentDrawer, setShowModAssignmentDrawer] = useState(false);

  if (!loadout) {
    return null;
  }

  const setName = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLoadout({
      ...loadout,
      name: e.target.value,
    });
  };

  const setClassType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLoadout({
      ...loadout,
      classType: parseInt(e.target.value, 10),
    });
  };

  const setClearSpace = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLoadout({
      ...loadout,
      clearSpace: e.target.checked,
    });
  };

  // TODO: make the link to loadout optimizer bring the currently equipped items along in route state

  const saveDisabled =
    !loadout.name.length ||
    !loadout.items.length ||
    // There's an existing loadout with the same name & class and it's not the loadout we are currently editing
    Boolean(clashingLoadout && clashingLoadout.id !== loadout.id);

  const saveAsNewDisabled =
    saveDisabled ||
    // There's an existing loadout with the same name & class
    Boolean(clashingLoadout);

  return (
    <div className="loadout-options">
      <Prompt when={isNew && loadout.items.length > 0} message={t('Loadouts.Abandon')} />
      <form onSubmit={saveLoadout}>
        <div className="input-group loadout-name">
          <input
            className="dim-input"
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
        <div className="input-group">
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
          <div className="input-group">
            <button
              className="dim-button danger"
              onClick={deleteLoadout}
              type="button"
              title={t('Loadouts.Delete')}
            >
              <AppIcon icon={deleteIcon} /> {t('Loadouts.Delete')}
            </button>
          </div>
        )}
        {Boolean($featureFlags.loadoutModAssignments && loadout.parameters?.mods?.length) && (
          <div className="input-group">
            <button
              className="dim-button"
              type="button"
              title="Assign Mods"
              onClick={() => setShowModAssignmentDrawer(true)}
            >
              {t('Loadouts.ShowModPlacement')}
            </button>
          </div>
        )}
        <div className="input-group">
          <Link className="dim-button" to={{ pathname: 'optimizer', state: { loadout } }}>
            {t('Loadouts.OpenInOptimizer')}
          </Link>
        </div>
        <div className="input-group">
          <label>
            <input type="checkbox" checked={Boolean(loadout.clearSpace)} onChange={setClearSpace} />{' '}
            {t('Loadouts.ClearSpace')}
          </label>
        </div>
      </form>
      {clashingLoadout && clashingLoadout.id !== loadout.id && (
        <div className="dim-already-exists">
          {clashingLoadout.classType !== DestinyClass.Unknown
            ? t('Loadouts.AlreadyExistsClass', {
                className: getClass(clashingLoadout.classType),
              })
            : t('Loadouts.AlreadyExistsGlobal')}
        </div>
      )}
      {showModAssignmentDrawer &&
        ReactDOM.createPortal(
          <ModAssignmentDrawer
            loadout={loadout}
            onUpdateMods={onUpdateMods}
            onClose={() => setShowModAssignmentDrawer(false)}
          />,
          document.body
        )}
    </div>
  );
}
