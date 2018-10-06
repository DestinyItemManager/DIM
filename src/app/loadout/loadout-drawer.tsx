import { t } from 'i18next';
import * as React from 'react';
import InventoryItem from '../inventory/InventoryItem';
import { toaster } from '../ngimport-more';
import { dimLoadoutService, Loadout } from './loadout.service';

interface Props {
  loadout?: Loadout;
  onClose(): void;
}

interface State {
  name?: string;
}

export default class LoadoutDrawer extends React.Component<Props, State> {
  render() {
    const { loadout } = this.props;

    if (!loadout) {
      return null;
    }

    return (
      <div id="loadout-drawer">
        <div className="loadout-content">
          <input className="dim-input" onChange={this.setName} />
          <button className="dim-button" onClick={this.save}>
            Save
          </button>
          <button className="dim-button" onClick={this.close}>
            Close
          </button>
          <div id="loadout-contents" className="loadout-contents">
            {Object.values(loadout.items).map((item) => (
              <InventoryItem key={item[0].id} item={item[0]} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  private setName = (element) => {
    this.setState({ name: element.target.value });
  };

  private save = () => {
    const loadout = this.props.loadout!;
    loadout.name = this.state.name!;

    dimLoadoutService.saveLoadout(loadout).catch((e) => {
      toaster.pop(
        'error',
        t('Loadouts.SaveErrorTitle'),
        t('Loadouts.SaveErrorDescription', {
          loadoutName: loadout.name,
          error: e.message
        })
      );
      console.error(e);
    });
    this.close();
  };

  private close = () => {
    this.props.onClose();
  };
}
