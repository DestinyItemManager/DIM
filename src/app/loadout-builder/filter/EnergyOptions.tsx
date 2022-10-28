import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import { t } from 'app/i18next-t';
import { Dispatch, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import styles from './EnergyOptions.m.scss';
import { Option, RadioSetting } from './RadioSetting';

export default function EnergyOptions({
  assumeArmorMasterwork,
  lockArmorEnergyType,
  optimizingLoadoutName,
  autoStatMods,
  lbDispatch,
}: {
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lockArmorEnergyType: LockArmorEnergyType | undefined;
  optimizingLoadoutName: string | undefined;
  autoStatMods: boolean;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const autoStatModsOptions: Option[] = useMemo(
    () => [
      {
        label: t('LoadoutBuilder.AutoStatMods.None'),
        tooltip: t('LoadoutBuilder.AutoStatMods.NoneTooltip'),
        selected: !autoStatMods,
        onChange: () => {
          if (autoStatMods) {
            lbDispatch({ type: 'autoStatModsChanged', autoStatMods: false });
          }
        },
      },
      {
        label: t('LoadoutBuilder.AutoStatMods.Required'),
        tooltip: t('LoadoutBuilder.AutoStatMods.RequiredTooltip'),
        selected: autoStatMods,
        onChange: () => {
          if (!autoStatMods) {
            lbDispatch({ type: 'autoStatModsChanged', autoStatMods: true });
          }
        },
      },
    ],
    [autoStatMods, lbDispatch]
  );

  const lockEnergyOptions: Option[] = useMemo(
    () => [
      {
        label: t('LoadoutBuilder.None'),
        tooltip: t('LoadoutBuilder.LockElementOptions.None'),
        selected: !lockArmorEnergyType || lockArmorEnergyType === LockArmorEnergyType.None,
        onChange: () => {
          if (lockArmorEnergyType && lockArmorEnergyType !== LockArmorEnergyType.None) {
            lbDispatch({
              type: 'lockArmorEnergyTypeChanged',
              lockArmorEnergyType: LockArmorEnergyType.None,
            });
          }
        },
      },
      {
        label:
          optimizingLoadoutName !== undefined
            ? t('LoadoutBuilder.InOtherLoadouts')
            : t('LoadoutBuilder.InLoadouts'),
        tooltip:
          optimizingLoadoutName !== undefined
            ? t('LoadoutBuilder.LockElementOptions.InOtherLoadouts', {
                loadoutName: optimizingLoadoutName,
              })
            : t('LoadoutBuilder.LockElementOptions.InLoadouts'),
        selected: lockArmorEnergyType === LockArmorEnergyType.Masterworked,
        onChange: () => {
          if (lockArmorEnergyType !== LockArmorEnergyType.Masterworked) {
            lbDispatch({
              type: 'lockArmorEnergyTypeChanged',
              lockArmorEnergyType: LockArmorEnergyType.Masterworked,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.All'),
        tooltip: t('LoadoutBuilder.LockElementOptions.All'),
        selected: lockArmorEnergyType === LockArmorEnergyType.All,
        onChange: () => {
          if (lockArmorEnergyType !== LockArmorEnergyType.All) {
            lbDispatch({
              type: 'lockArmorEnergyTypeChanged',
              lockArmorEnergyType: LockArmorEnergyType.All,
            });
          }
        },
      },
    ],
    [lbDispatch, lockArmorEnergyType, optimizingLoadoutName]
  );

  const assumeMasterworkOptions: Option[] = useMemo(
    () => [
      {
        label: t('LoadoutBuilder.None'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.None'),
        selected: !assumeArmorMasterwork || assumeArmorMasterwork === AssumeArmorMasterwork.None,
        onChange: () => {
          if (assumeArmorMasterwork && assumeArmorMasterwork !== AssumeArmorMasterwork.None) {
            lbDispatch({
              type: 'assumeArmorMasterworkChanged',
              assumeArmorMasterwork: AssumeArmorMasterwork.None,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.Legendary'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.Legendary'),
        selected: assumeArmorMasterwork === AssumeArmorMasterwork.Legendary,
        onChange: () => {
          if (assumeArmorMasterwork !== AssumeArmorMasterwork.Legendary) {
            lbDispatch({
              type: 'assumeArmorMasterworkChanged',
              assumeArmorMasterwork: AssumeArmorMasterwork.Legendary,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.All'),
        tooltip: t('LoadoutBuilder.AssumeMasterworkOptions.All'),
        selected: assumeArmorMasterwork === AssumeArmorMasterwork.All,
        onChange: () => {
          if (assumeArmorMasterwork !== AssumeArmorMasterwork.All) {
            lbDispatch({
              type: 'assumeArmorMasterworkChanged',
              assumeArmorMasterwork: AssumeArmorMasterwork.All,
            });
          }
        },
      },
    ],
    [assumeArmorMasterwork, lbDispatch]
  );

  return (
    <div className={styles.energyOptions}>
      {$featureFlags.loAutoStatMods && (
        <RadioSetting
          name="autoStatMods"
          label={t('LoadoutBuilder.AutoStatMods.Label')}
          options={autoStatModsOptions}
        />
      )}
      <RadioSetting
        name="lockElement"
        label={t('LoadoutBuilder.LockElement')}
        options={lockEnergyOptions}
      />
      <RadioSetting
        name="assumeMasterwork"
        label={t('LoadoutBuilder.AssumeMasterwork')}
        options={assumeMasterworkOptions}
      />
    </div>
  );
}
