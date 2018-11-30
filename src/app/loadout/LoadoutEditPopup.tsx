import * as React from 'react';
import { t } from 'i18next';
import { getLoadoutClassDisplay, LoadoutClass } from './loadout.service';
import './loadout-edit-popup.scss';

interface Props {
  loadoutClass: LoadoutClass;
  loadoutName: string;
  changeNameHandler(): void;
  editHandler(): void;
}

function getAlreadyExistsTranslation(loadoutClassType: number) {
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
