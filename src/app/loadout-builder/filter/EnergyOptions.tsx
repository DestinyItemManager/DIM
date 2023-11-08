import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import RadioButtons, { Option } from 'app/dim-ui/RadioButtons';
import { t } from 'app/i18next-t';
import { Dispatch, useCallback, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { loDefaultArmorEnergyRules } from '../types';
import styles from './EnergyOptions.m.scss';

export default function EnergyOptions({
  assumeArmorMasterwork,
  lbDispatch,
  className,
}: {
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  className?: string;
}) {
  const assumeMasterworkOptions: Option<AssumeArmorMasterwork>[] = useMemo(
    () => [
      {
        label: t('LoadoutBuilder.None'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.None', {
          minLoItemEnergy: loDefaultArmorEnergyRules.minItemEnergy,
        }),
        value: AssumeArmorMasterwork.None,
      },
      {
        label: t('LoadoutBuilder.Legendary'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.Legendary', {
          minLoItemEnergy: loDefaultArmorEnergyRules.minItemEnergy,
        }),
        value: AssumeArmorMasterwork.Legendary,
      },
      {
        label: t('LoadoutBuilder.All'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.All'),
        value: AssumeArmorMasterwork.All,
      },
    ],
    [],
  );

  const handleChange = useCallback(
    (assumeArmorMasterwork: AssumeArmorMasterwork) => {
      lbDispatch({
        type: 'assumeArmorMasterworkChanged',
        assumeArmorMasterwork,
      });
    },
    [lbDispatch],
  );

  const selected = assumeMasterworkOptions.find(
    (o) => o.value === (assumeArmorMasterwork ?? AssumeArmorMasterwork.None),
  )!;

  return (
    <div className={className}>
      <h3 className={styles.title}>{t('LoadoutBuilder.AssumeMasterwork')}</h3>
      <RadioButtons
        value={assumeArmorMasterwork ?? AssumeArmorMasterwork.None}
        onChange={handleChange}
        options={assumeMasterworkOptions}
      />
      <div className={styles.tooltip}>{selected.tooltip}</div>
    </div>
  );
}
