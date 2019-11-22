import React from 'react';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { Loadout } from './loadout-types';
import { router } from '../router';

export default function LoadoutDrawerOptions(
  this: void,
  {
    loadout,
    showClass,
    isNew,
    classTypeOptions,
    updateLoadout,
    saveLoadout,
    saveAsNew
  }: {
    loadout?: Loadout;
    showClass: boolean;
    isNew: boolean;
    clashingLoadout?: Loadout;
    classTypeOptions: {
      label: string;
      value: number;
    }[];
    updateLoadout(loadout: Loadout);
    saveLoadout(e);
    saveAsNew(e);
  }
) {
  if (!loadout) {
    return null;
  }

  const setName = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLoadout({
      ...loadout,
      name: e.target.value
    });
  };

  const setClassType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLoadout({
      ...loadout,
      classType: parseInt(e.target.value, 10)
    });
  };

  const setClearSpace = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLoadout({
      ...loadout,
      clearSpace: e.target.checked
    });
  };

  return (
    <div className="loadout-options">
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
            <select
              className="dim-select"
              name="classType"
              onChange={setClassType}
              value={loadout.classType}
            >
              {classTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="input-group">
          <button
            className="dim-button"
            disabled={!loadout.name.length || _.isEmpty(loadout.items)}
          >
            {t('Loadouts.Save')}
          </button>
          {!isNew && (
            <button className="dim-button" onClick={saveAsNew}>
              {t('Loadouts.SaveAsNew')}
            </button>
          )}
        </div>
        <div className="input-group">
          <button className="dim-button" onClick={(e) => goToLoadoutBuilder(e, loadout)}>
            {t('LB.LB')}
          </button>
        </div>
        <div className="input-group">
          <label>
            <input type="checkbox" checked={Boolean(loadout.clearSpace)} onChange={setClearSpace} />{' '}
            {t('Loadouts.ClearSpace')}
          </label>
        </div>
      </form>
    </div>
  );
}

function goToLoadoutBuilder(e, loadout?: Loadout) {
  e.preventDefault();
  if (!loadout) {
    return;
  }

  if (_.size(loadout.items) === 0 || confirm(t('Loadouts.Abandon'))) {
    router.stateService.go(
      loadout.destinyVersion === 2 ? 'destiny2.loadoutbuilder' : 'destiny1.loadout-builder'
    );
  }
}
