import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import React, { Dispatch, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import styles from './EnergyOptions.m.scss';

interface Option {
  label: string;
  tooltip: string;
  selected: boolean;
  onChange(): void;
}

const RadioSetting = React.memo(function RadioSetting({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: Option[];
}) {
  return (
    <div className={styles.settingGroup}>
      <div className={styles.title}>{label}</div>
      <div className={styles.buttons}>
        {options.map(({ label, selected, tooltip, onChange }) => (
          <RadioButton
            key={label}
            label={label}
            tooltip={tooltip}
            selected={selected}
            onChange={onChange}
            name={name}
          />
        ))}
      </div>
    </div>
  );
});

function RadioButton({ label, tooltip, name, selected, onChange }: Option & { name: string }) {
  return (
    <PressTip
      tooltip={tooltip}
      elementType="label"
      className={clsx(styles.button, {
        [styles.selected]: selected,
      })}
    >
      <input type="radio" name={name} checked={selected} onChange={onChange} />
      {label}
    </PressTip>
  );
}

export default function EnergyOptions({
  assumeArmorMasterwork,
  lockArmorEnergyType,
  lbDispatch,
}: {
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lockArmorEnergyType: LockArmorEnergyType | undefined;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
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
        label: t('LoadoutBuilder.Masterworked'),
        tooltip: t('LoadoutBuilder.LockElementOptions.Masterworked'),
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
    [lbDispatch, lockArmorEnergyType]
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
