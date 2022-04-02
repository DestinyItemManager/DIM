import { t } from 'app/i18next-t';
import { Observable } from 'app/utils/observable';
import React from 'react';
import { useSubscription } from 'use-subscription';
import Sheet from '../dim-ui/Sheet';
import { MaterialCounts } from './MaterialCounts';

/**
 * The currently selected store for showing gear power.
 */
export const doShowMaterialCounts$ = new Observable<boolean>(false);

/**
 * Show the gear power sheet
 */
export function showMaterialCount() {
  doShowMaterialCounts$.next(true);
}

export function MaterialCountsSheet() {
  const isShown = useSubscription(doShowMaterialCounts$);

  if (!isShown) {
    return null;
  }
  const close = () => {
    doShowMaterialCounts$.next(false);
  };

  return (
    <Sheet onClose={close} header={<h1>{t('Header.MaterialCounts')}</h1>}>
      <MaterialCounts />
    </Sheet>
  );
}

export function MaterialCountsTooltip() {
  return (
    <>
      {t('Header.MaterialCounts')}
      <hr />
      <MaterialCounts />
    </>
  );
}
