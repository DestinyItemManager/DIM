import CheckButton from 'app/dim-ui/CheckButton';
import React, { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import styles from './EnergyOptions.m.scss';

export default function EnergyOptions({
  assumeLegendaryMasterwork,
  assumeExoticMasterwork,
  lockItemEnergyType,
  lockMasterworkItemEnergyType,
  lbDispatch,
}: {
  assumeLegendaryMasterwork: boolean;
  assumeExoticMasterwork: boolean;
  lockItemEnergyType: boolean;
  lockMasterworkItemEnergyType: boolean;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  return (
    <div className={styles.energyOptions}>
      <CheckButton
        name="lo-lock-item-energy-type"
        className={styles.option}
        checked={lockItemEnergyType}
        onChange={(checked) =>
          lbDispatch({ type: 'lockItemEnergyTypeChanged', lockItemEnergyType: checked })
        }
      >
        Lock Non-Masterworked Item Element
      </CheckButton>
      <CheckButton
        name="lo-lock-masterwork-item-energy-type"
        className={styles.option}
        checked={lockMasterworkItemEnergyType}
        onChange={(checked) =>
          lbDispatch({
            type: 'lockMasterworkItemEnergyTypeChanged',
            lockMasterworkItemEnergyType: checked,
          })
        }
      >
        Lock Masterworked Item Element
      </CheckButton>
      <CheckButton
        name="lo-assume-legendary-masterwork"
        className={styles.option}
        checked={assumeLegendaryMasterwork}
        onChange={(checked) =>
          lbDispatch({
            type: 'assumeLegendaryMasterworkChanged',
            assumeLegendaryMasterwork: checked,
          })
        }
      >
        Assume Legendary Masterwork
      </CheckButton>
      <CheckButton
        name="lo-assume-exotic-masterwork"
        className={styles.option}
        checked={assumeExoticMasterwork}
        onChange={(checked) =>
          lbDispatch({ type: 'assumeExoticMasterworkChanged', assumeExoticMasterwork: checked })
        }
      >
        Assume Exotic Masterwork
      </CheckButton>
    </div>
  );
}
