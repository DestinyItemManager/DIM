import { t } from 'app/i18next-t';
import clsx from 'clsx';
import React, { Dispatch, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { AssumeArmorMasterwork, LockArmorEnergyType } from '../types';
import styles from './EnergyOptions.m.scss';

interface Option {
  label: string;
  selected: boolean;
  onClick(): void;
}

const RadioSetting = React.memo(function RadioSetting({
  label,
  options,
}: {
  label: string;
  options: Option[];
}) {
  return (
    <div className={styles.settingGroup}>
      <div className={styles.title}>{label}</div>
      <div className={styles.buttons}>
        {options.map(({ label, selected, onClick }) => (
          <RadioButton key={label} label={label} selected={selected} onClick={onClick} />
        ))}
      </div>
    </div>
  );
});

function RadioButton({ label, selected, onClick }: Option) {
  return (
    <button
      type="button"
      className={clsx('dim-button', styles.button, {
        selected,
        [styles.selected]: selected,
      })}
      onClick={onClick}
    >
      {label}
    </button>
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
        selected: !lockArmorEnergyType,
        onClick: () => {
          if (lockArmorEnergyType) {
            lbDispatch({
              type: 'lockArmorEnergyTypeChanged',
              lockArmorEnergyType: undefined,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.Masterworked'),
        selected: lockArmorEnergyType === LockArmorEnergyType.Masterworked,
        onClick: () => {
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
        selected: lockArmorEnergyType === LockArmorEnergyType.All,
        onClick: () => {
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
        selected: !assumeArmorMasterwork,
        onClick: () => {
          if (assumeArmorMasterwork) {
            lbDispatch({
              type: 'assumeArmorMasterworkChanged',
              assumeArmorMasterwork: undefined,
            });
          }
        },
      },
      {
        label: t('LoadoutBuilder.Legendary'),
        selected: assumeArmorMasterwork === AssumeArmorMasterwork.Legendary,
        onClick: () => {
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
        selected: assumeArmorMasterwork === AssumeArmorMasterwork.All,
        onClick: () => {
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
      <RadioSetting label={t('LoadoutBuilder.LockElement')} options={lockEnergyOptions} />
      <RadioSetting
        label={t('LoadoutBuilder.AssumeMasterwork')}
        options={assumeMasterworkOptions}
      />
    </div>
  );
}
