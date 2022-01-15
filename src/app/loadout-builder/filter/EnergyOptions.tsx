import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import React, { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import EnergyBar from './EnergyBar';
import styles from './EnergyOptions.m.scss';

export default function EnergyOptions({
  assumedItemEnergy,
  assumedExoticEnergy,
  lockItemEnergyType,
  lbDispatch,
}: {
  assumedItemEnergy?: number;
  assumedExoticEnergy?: number;
  lockItemEnergyType: boolean;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  return (
    <div className={styles.energyOptions}>
      <CheckButton
        name="lo-lock-item-energy-type"
        className={styles.lockEnergyType}
        checked={lockItemEnergyType}
        onChange={(checked) =>
          lbDispatch({ type: 'lockItemEnergyTypeChanged', lockItemEnergyType: checked })
        }
      >
        {t('LoadoutBuilder.LockElement')}
      </CheckButton>
      <EnergyBar
        title="Assumed item energy"
        assumedEnergy={assumedItemEnergy}
        onSegmentClick={(value) => lbDispatch({ type: 'assumeItemEnergyChanged', energy: value })}
      />
      <EnergyBar
        title="Assumed exotic energy"
        assumedEnergy={assumedExoticEnergy}
        onSegmentClick={(value) => lbDispatch({ type: 'assumeExoticEnergyChanged', energy: value })}
      />
    </div>
  );
}
