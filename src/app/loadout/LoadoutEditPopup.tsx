import * as React from 'react';
import { t } from 'i18next';
import { getLoadoutClassDisplay } from './loadout.service';
import './loadout-edit-popup.scss';

interface Props {
  loadoutClassType: number;
  loadoutName: string;
  changeNameHandler(): void;
  editHandler(): void;
}

const getAlreadyExistsTranslation = (loadoutClassType) => {
  if (loadoutClassType >= 0) {
    const className = getLoadoutClassDisplay(loadoutClassType);
    return t('Loadouts.AlreadyExistsClass', { className });
  }

  return t('Loadouts.AlreadyExistsGeneric');
};

const LoadoutEditPopup = (props: Props) => {
  const { loadoutClassType, loadoutName, changeNameHandler, editHandler } = props;
  const alreadyExistsTranslation = getAlreadyExistsTranslation(loadoutClassType);

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
};

export default LoadoutEditPopup;
