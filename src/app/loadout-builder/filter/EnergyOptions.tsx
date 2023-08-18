import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import RadioButtons, { Option } from 'app/dim-ui/RadioButtons';
import { t } from 'app/i18next-t';
import { Dispatch, useCallback, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import styles from './EnergyOptions.m.scss';
import { loMenuSection } from './LoadoutOptimizerMenuItems';

export default function EnergyOptions({
  assumeArmorMasterwork,
  lbDispatch,
}: {
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const assumeMasterworkOptions: Option<AssumeArmorMasterwork>[] = useMemo(
    () => [
      {
        label: t('LoadoutBuilder.None'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.None'),
        value: AssumeArmorMasterwork.None,
      },
      {
        label: t('LoadoutBuilder.Legendary'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.Legendary'),
        value: AssumeArmorMasterwork.Legendary,
      },
      {
        label: t('LoadoutBuilder.All'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.All'),
        value: AssumeArmorMasterwork.All,
      },
    ],
    []
  );

  const handleChange = useCallback(
    (assumeArmorMasterwork: AssumeArmorMasterwork) => {
      lbDispatch({
        type: 'assumeArmorMasterworkChanged',
        assumeArmorMasterwork,
      });
    },
    [lbDispatch]
  );

  return (
    <div className={loMenuSection}>
      <h3 className={styles.title}>{t('LoadoutBuilder.AssumeMasterwork')}</h3>
      <RadioButtons
        value={assumeArmorMasterwork ?? AssumeArmorMasterwork.None}
        onChange={handleChange}
        options={assumeMasterworkOptions}
      />
    </div>
  );
}
