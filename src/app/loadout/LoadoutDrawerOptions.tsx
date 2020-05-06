import React from 'react';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { Loadout } from './loadout-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { Prompt } from 'react-router';
import { Link } from 'react-router-dom';

export default function LoadoutDrawerOptions({
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
    value: DestinyClass;
  }[];
  updateLoadout(loadout: Loadout);
  saveLoadout(e);
  saveAsNew(e);
}) {
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

  // TODO: make the link to loadout optimizer bring the currently equipped items along in route state

  return (
    <div className="loadout-options">
      <Prompt when={loadout.items.length > 0} message={t('Loadouts.Abandon')} />
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
          <button className="dim-button" disabled={!loadout.name.length || !loadout.items.length}>
            {t('Loadouts.Save')}
          </button>
          {!isNew && (
            <button className="dim-button" onClick={saveAsNew}>
              {t('Loadouts.SaveAsNew')}
            </button>
          )}
        </div>
        <div className="input-group">
          <Link className="dim-button" to="optimizer">
            {t('LB.LB')}
          </Link>
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
