import React from 'react';
import './storage.scss';
import LocalStorageInfo from './LocalStorageInfo';
import { t } from 'app/i18next-t';
import ImportExport from './ImportExport';

export default function DimApiSettings() {
  // TODO: disable import/export if API not enabled?
  // TODO: disable tags/loadouts if API not enabled
  // TODO: explain that it's supported by volunteers

  return (
    <section className="storage" id="storage">
      <h2>{t('Storage.MenuTitle')}</h2>
      <p>{t('Storage.Explain')}</p>

      <LocalStorageInfo />
      <ImportExport />
    </section>
  );
}
