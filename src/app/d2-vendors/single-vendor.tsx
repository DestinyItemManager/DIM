
import * as React from 'react';
import { IScope } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendor as getVendorApi, getCharacters, getBasicProfile } from '../bungie-api/destiny2-api';
import { StateParams } from '@uirouter/angularjs';
import { getDefinitions, D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D2ManifestService } from '../manifest/manifest-service';
import './vendor.scss';
import { DestinyVendorDefinition, DestinyVendorResponse, DestinyVendorSaleItemComponent, DestinyVendorItemDefinition } from 'bungie-api-ts/destiny2';
import { BungieImage } from '../dim-ui/bungie-image';
import { VendorItem } from './vendor-item';
import * as _ from 'underscore';
import { VendorItemComponent } from './vendor-item-component';
import { FactionIcon } from '../progress/faction';
import { StoreServiceType } from '../inventory/d2-stores.service';

interface Props {
  $scope: IScope;
  $stateParams: StateParams;
  account: DestinyAccount;
  D2StoresService: StoreServiceType;
}

interface State {
  vendorHash: number;
  defs?: D2ManifestDefinitions;
  vendorDef?: DestinyVendorDefinition;
  vendorInstance?: DestinyVendorResponse;
}

// TODO: This component needs to load the info AND display it. Those should be broken out into separate components
// so we can reuse the display elsewhere.
export default class SingleVendor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      vendorHash: this.props.$stateParams.id
    };
  }

  async loadVendor() {
    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    this.props.$scope.$apply(() => {
      D2ManifestService.isLoaded = true;
    });

    const vendorDef = defs.Vendor.get(this.state.vendorHash);
    if (!vendorDef) {
      throw new Error("No known vendor with hash " + this.state.vendorHash);
    }
    this.setState({ defs, vendorDef });

    if (vendorDef.returnWithVendorRequest) {
      // TODO: get for all characters, or let people select a character? This is a hack
      // we at least need to display that character!
      // uggggh
      // TODO: maybe load the whole stores anyway so we can count currencies and such, a la the old thing
      const activeStore = this.props.D2StoresService.getActiveStore();
      const characterId = activeStore
        ? activeStore.id
        : (await getBasicProfile(this.props.account)).profile.data.characterIds[0];
      const vendorInstance = await getVendorApi(this.props.account, characterId, this.state.vendorHash);
      this.setState({ vendorInstance });
    }
  }

  componentDidMount() {
    this.loadVendor();
  }

  render() {
    if (!this.state.vendorDef) {
      // TODO: loading component!
      return <div className="vendor dim-page">Loading...</div>;
    }

    const { defs, vendorDef, vendorInstance } = this.state;

    // TODO:
    // * countdown
    // * costs (doesn't look like the API has it yet)
    // * featured item
    // * enabled

    // TODO: do this stuff in setState handlers
    const items = vendorInstance && vendorInstance.sales.data
      ? toItemList(this.state.defs!, vendorInstance, vendorDef.itemList)
      // If the sales should come from the server, don't show all possibilities here
      : (vendorDef.returnWithVendorRequest ? [] : vendorDef.itemList.map((i) => new VendorItem(this.state.defs!, i)));

    // TODO: sort items, maybe subgroup them
    const itemsByCategory = _.groupBy(items.filter((i) => i.canBeSold), (item: VendorItem) => item.displayCategoryIndex);

    const faction = vendorDef.factionHash ? defs!.Faction[vendorDef.factionHash] : undefined;
    const factionProgress = vendorInstance && vendorInstance.vendor.data.progression;

    // TODO: there's a cool background image but I'm not sure how to use it
    return (
      <div className="vendor dim-page">
        <div className="vendor-featured">
          <div className="vendor-featured-header">
            {factionProgress && faction
              ? <FactionIcon factionProgress={factionProgress} factionDef={faction}/>
              : <BungieImage src={vendorDef.displayProperties.icon}/>
            }
            <div className="vendor-header-info">
              <h1>{vendorDef.displayProperties.name}</h1>
              <div>{vendorDef.displayProperties.description}</div>
              {vendorInstance &&
                <div>Items rotate: {new Date(vendorInstance.vendor.data.nextRefreshDate).toLocaleString()}</div>
              }
            </div>
          </div>
        </div>
        <div className="vendor-char-items">
          {_.map(itemsByCategory, (items, categoryIndex) =>
            <div className="vendor-row" key={categoryIndex}>
              <h3 className="category-title">{vendorDef.displayCategories[categoryIndex] && vendorDef.displayCategories[categoryIndex].displayProperties.name || 'Unknown'}</h3>
              <div className="vendor-items">
              {items.map((item) =>
                <VendorItemComponent key={item.id} defs={defs!} item={item}/>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

function toItemList(
  defs: D2ManifestDefinitions,
  vendorInstance: DestinyVendorResponse,
  itemList: DestinyVendorItemDefinition[]
): VendorItem[] {
  const components = Object.values(vendorInstance.sales.data);
  return components.map((component) => new VendorItem(defs, itemList[component.vendorItemIndex], component,vendorInstance.itemComponents));
}
