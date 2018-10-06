import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import PressTip from '../../dim-ui/PressTip';
import StoreInventoryItem from '../../inventory/StoreInventoryItem';
import LoadoutDrawer from '../../loadout/loadout-drawer';
import { Loadout } from '../../loadout/loadout.service';
import { ArmorSet, LockType } from '../types';
import { filterPlugs } from '../utils';
import GeneratedSetButtons from './GeneratedSetButtons';
import PlugTooltip from './PlugTooltip';
import { DimStore } from '../../inventory/store-types';

interface Props {
  processRunning: number;
  selectedStore?: DimStore;
  matchedSets: ArmorSet[];
  lockedMap: { [bucketHash: number]: LockType };
  setTiers: string[];
  setSelectedTier(tier: string): void;
}

interface State {
  loadout?: Loadout;
}

/**
 * Renders the generated sets (matchedSets)
 */
export default class GeneratedSets extends React.Component<Props, State> {
  state: State = {};

  // Set the loadout property to show/hide the loadout menu
  setCreateLoadout = (loadout?: Loadout) => {
    this.setState({ loadout });
  };

  render() {
    const { processRunning, matchedSets, setTiers, selectedStore } = this.props;
    const { loadout } = this.state;

    if (processRunning > 0) {
      return <h3>{t('LoadoutBuilder.Loading', { loading: processRunning })}</h3>;
    }

    return (
      <>
        {matchedSets.length === 0 && <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>}
        {setTiers.length !== 0 && (
          <>
            <h3>{t('LoadoutBuilder.SelectTier')}</h3>
            <select
              onChange={(element) => {
                this.props.setSelectedTier(element.target.value);
              }}
            >
              {setTiers.map((tier) => (
                <option key={tier} value={tier} disabled={tier.charAt(0) === '-'}>
                  {tier}
                </option>
              ))}
            </select>
          </>
        )}
        {matchedSets.length !== 0 && (
          <>
            <h3>{t('LoadoutBuilder.GeneratedBuilds')}</h3>
            {matchedSets.map((set) => (
              <div className="generated-build" key={set.setHash}>
                <GeneratedSetButtons
                  set={set}
                  store={selectedStore!}
                  onLoadoutSet={this.setCreateLoadout}
                />
                <div className="sub-bucket">
                  {Object.values(set.armor).map((item) => (
                    <div className="generated-build-items" key={item.index}>
                      <StoreInventoryItem item={item} isNew={false} searchHidden={false} />
                      {item!.sockets &&
                        item!.sockets!.categories.length === 2 &&
                        // TODO: look at plugs that we filtered on to see if they match selected perk or not.
                        item!.sockets!.categories[0].sockets.filter(filterPlugs).map((socket) => (
                          <PressTip
                            key={socket!.plug!.plugItem.hash}
                            tooltip={<PlugTooltip item={item} socket={socket} />}
                          >
                            <div>
                              <BungieImage
                                className="item-mod"
                                src={socket!.plug!.plugItem.displayProperties.icon}
                              />
                            </div>
                          </PressTip>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
        <LoadoutDrawer loadout={loadout} onClose={this.setCreateLoadout} />
      </>
    );
  }
}
