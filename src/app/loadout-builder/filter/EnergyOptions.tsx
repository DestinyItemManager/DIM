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
  // Note: These are only referenced via nesting in the tooltips below,
  // so i18next-scanner would otherwise drop them if they didn't appear
  // in the code.
  // t('LoadoutBuilder.AssumeMasterworkOptions.Current')
  // t('LoadoutBuilder.AssumeMasterworkOptions.Masterworked')

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
        label: `+ ${t('LoadoutBuilder.MwExotic')}`, // used to be t('LoadoutBuilder.All')
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.All'),
        value: AssumeArmorMasterwork.All,
      },
      {
        label: `+ ${t('LoadoutBuilder.Artifice')}`,
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.AllWithArtificeExotic'), // includes t('LoadoutBuilder.AssumeMasterworkOptions.ArtificeExotic')
        value: AssumeArmorMasterwork.ArtificeExotic,
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
