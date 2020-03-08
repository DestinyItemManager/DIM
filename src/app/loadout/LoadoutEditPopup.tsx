import React from 'react';
import { t } from 'app/i18next-t';
import { getLoadoutClassDisplay } from './loadout-types';
import './loadout-edit-popup.scss';
import { DestinyClass } from 'bungie-api-ts/destiny2';

interface Props {
  loadoutClass: DestinyClass;
  loadoutName: string;
  changeNameHandler(): void;
  editHandler(): void;
}

function getAlreadyExistsTranslation(loadoutClassType: DestinyClass) {
  if (loadoutClassType >= 0) {
    const className = getLoadoutClassDisplay(loadoutClassType);
    return t('Loadouts.AlreadyExistsClass', { className });
  }

  return t('Loadouts.AlreadyExistsGlobal');
}

function LoadoutEditPopup(props: Props) {
  const { loadoutClass, loadoutName, changeNameHandler, editHandler } = props;
  const alreadyExistsTranslation = getAlreadyExistsTranslation(loadoutClass);

  return (
    <div className="dim-loadout-edit-popup">
      <div className="dim-already-exists">{alreadyExistsTranslation}</div>
      <button className="dim-button" onClick={editHandler}>
        {t('Loadouts.EditLoadoutName', { loadoutName })}
      </button>
      <button className="dim-button" onClick={changeNameHandler}>
        {t('Loadouts.ChangeName')}
      </button>
    </div>
  );
}

export default LoadoutEditPopup;
