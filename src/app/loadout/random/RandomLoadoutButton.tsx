import * as React from 'react';
import './random-loadout.scss';
import { t } from 'i18next';
import { D1StoresService } from '../../inventory/d1-stores.service';
import { D2StoresService } from '../../inventory/d2-stores.service';
import { optimalLoadout } from '../loadout-utils';
import { dimLoadoutService } from '../loadout.service';
import { StoreServiceType } from '../../inventory/store-types';

interface Props {
  destinyVersion: number;
}

interface State {
  working: boolean;
}

export default class RandomLoadoutButton extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { working: false };
  }

  render() {
    return (
      <div className="random-loadout">
        <a
          className="loadout random"
          href="#"
          onClick={this.applyRandomLoadout}
        >
          &Pi;
        </a>
      </div>
    );
  }

  applyRandomLoadout = (e) => {
    e.preventDefault();

    if (this.state.working || !window.confirm(t('Loadouts.Randomize'))) {
      return null;
    }

    const storeService: StoreServiceType = this.props.destinyVersion
      ? D1StoresService
      : D2StoresService;

    const store = storeService.getActiveStore();
    if (!store) {
      return null;
    }

    const types = new Set([
      'Class',
      'Primary',
      'Special',
      'Heavy',
      'Kinetic',
      'Energy',
      'Power',
      'Helmet',
      'Gauntlets',
      'Chest',
      'Leg',
      'ClassItem',
      'Artifact',
      'Ghost'
    ]);

    // Any item equippable by this character in the given types
    const applicableItems = storeService
      .getAllItems()
      .filter((i) => types.has(i.type) && i.canBeEquippedBy(store));

    // Use "random" as the value function
    const loadout = optimalLoadout(
      applicableItems,
      () => Math.random(),
      t('Loadouts.Random')
    );

    this.setState({ working: true });
    return dimLoadoutService.applyLoadout(store, loadout, true).finally(() => {
      this.setState({ working: false });
    });
  }
}
