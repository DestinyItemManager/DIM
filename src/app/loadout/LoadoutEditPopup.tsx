import * as React from 'react';
import { t } from 'i18next';
import './loadout-edit-popup.scss';

interface Props {
  loadoutName: string;
  changeNameHandler(): void;
  editHandler(): void;
}

const LoadoutEditPopup = (props: Props) => (
  <div className="dim-loadout-edit-popup">
    <div>{t('Loadouts.AlreadyExists')}</div>
    <button className="dim-button" onClick={props.editHandler}>
      {t('Loadouts.EditLoadoutName', { name: props.loadoutName })}
    </button>
    <button className="dim-button" onClick={props.changeNameHandler}>
      {t('Loadouts.ChangeName')}
    </button>
  </div>
);

export default LoadoutEditPopup;
