import React, { useState, useEffect } from 'react';
import { t } from 'app/i18next-t';
import './storage.scss';
import clsx from 'clsx';
import _ from 'lodash';
import { percent } from '../shell/filters';

export default function LocalStorageInfo({ showDetails }: { showDetails: boolean }) {
  const [browserMayClearData, setBrowserMayClearData] = useState(true);
  const [quota, setQuota] = useState<{ quota: number; usage: number }>();

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((quota: { quota: number; usage: number }) => {
        if (quota.usage >= 0 && quota.quota >= 0) {
          setQuota(quota);
        }
      });
    }

    if ('storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persisted().then((persistent) => {
        setBrowserMayClearData(!persistent);
      });
    }
  }, []);

  if (!showDetails && !quota) {
    return null;
  }

  return (
    <div className="storage-adapter">
      {showDetails && (
        <>
          <h3>{t('Storage.IndexedDBStorage')}</h3>
          <p>{t(`Storage.Details.IndexedDBStorage`)}</p>
          {browserMayClearData && (
            <p className="warning-block">{t('Storage.BrowserMayClearData')}</p>
          )}
        </>
      )}
      {quota && (
        <div>
          <div className="storage-guage">
            <div
              className={clsx({
                full: quota.usage / quota.quota > 0.9,
              })}
              style={{ width: percent(Math.max(quota.usage / quota.quota, 0.01)) }}
            />
          </div>
          <p>{t('Storage.Usage', quota)}</p>
        </div>
      )}
    </div>
  );
}
