import { IScope } from 'angular';
import { DestinyVendorDefinition, DestinyVendorResponse } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendor as getVendorApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import Countdown from '../dim-ui/Countdown';
import { D2ManifestService } from '../manifest/manifest-service';
import FactionIcon from '../progress/FactionIcon';
import VendorItems from './VendorItems';
import './vendor.scss';
import { fetchRatingsForVendor, fetchRatingsForVendorDef } from './vendor-ratings';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { Subscription } from 'rxjs/Subscription';
import { D2Store } from '../inventory/store-types';
import { getVendorItems } from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService } from '../inventory/d2-stores.service';
import { loadingTracker } from '../ngimport-more';
import { $rootScope } from 'ngimport';
import { UIViewInjectedProps } from '@uirouter/react';

interface Props {
  $scope: IScope;
  account: DestinyAccount;
}

interface State {
  vendorHash: number;
  stores?: D2Store[];
  ownedItemHashes?: Set<number>;
  defs?: D2ManifestDefinitions;
  vendorDef?: DestinyVendorDefinition;
  vendorResponse?: DestinyVendorResponse;
  trackerService?: DestinyTrackerService;
}

/**
 * A page that loads its own info for a single vendor, so we can link to a vendor or show engram previews.
 */
export default class SingleVendor extends React.Component<Props & UIViewInjectedProps, State> {
  private storesSubscription: Subscription;
  private $scope = $rootScope.$new(true);

  constructor(props: Props) {
    super(props);
    this.state = {
      vendorHash: this.props.transition!.params().id
    };
  }

  async loadVendor() {
    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    D2ManifestService.loaded = true;

    const vendorDef = defs.Vendor.get(this.state.vendorHash);
    if (!vendorDef) {
      throw new Error(`No known vendor with hash ${this.state.vendorHash}`);
    }
    this.setState({ defs, vendorDef });

    // TODO: if we had a cache per vendor (maybe in redux?) we could avoid this load sometimes?

    if (vendorDef.returnWithVendorRequest) {
      // TODO: get for all characters, or let people select a character? This is a hack
      // we at least need to display that character!
      let characterId: string = this.props.transition!.params().characterId;
      if (!characterId) {
        const stores = this.state.stores || await D2StoresService.getStoresStream(this.props.account).take(1).toPromise();
        if (stores) {
          characterId = stores.find((s) => s.current)!.id;
        }
      }
      const vendorResponse = await getVendorApi(this.props.account, characterId, this.state.vendorHash);

      this.setState({ defs, vendorResponse });

      const trackerService = await fetchRatingsForVendor(defs, vendorResponse);
      this.setState({ trackerService });
    } else {
      const trackerService = await fetchRatingsForVendorDef(defs, vendorDef);
      this.setState({ trackerService });
    }
  }

  componentDidMount() {
    this.storesSubscription = D2StoresService.getStoresStream(this.props.account).subscribe((stores) => {
      if (stores) {
        const ownedItemHashes = new Set<number>();
        for (const store of stores) {
          for (const item of store.items) {
            ownedItemHashes.add(item.hash);
          }
        }
        this.setState({ stores, ownedItemHashes });
      }
    });
    loadingTracker.addPromise(this.loadVendor());

    this.$scope.$on('dim-refresh', () => {
      loadingTracker.addPromise(this.loadVendor());
    });
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
    this.$scope.$destroy();
  }

  render() {
    const { defs, vendorDef, vendorResponse, trackerService, ownedItemHashes } = this.state;
    const { account } = this.props;

    if (!vendorDef || !defs) {
      // TODO: loading component!
      return <div className="vendor dim-page"><i className="fa fa-spinner fa-spin"/></div>;
    }

    // TODO:
    // * countdown
    // * featured item
    // * enabled
    // * ratings
    // * show which items you have
    // * filter by character class
    const vendor = vendorResponse && vendorResponse.vendor.data;

    const faction = vendorDef.factionHash ? defs.Faction[vendorDef.factionHash] : undefined;
    const factionProgress = vendorResponse && vendorResponse.vendor.data.progression;

    const destinationDef = vendor && defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash);
    const placeDef = destinationDef && defs.Place.get(destinationDef.placeHash);

    const placeString = [(destinationDef && destinationDef.displayProperties.name), (placeDef && placeDef.displayProperties.name)].filter((n) => n && n.length).join(', ');
    // TODO: there's a cool background image but I'm not sure how to use it

    const vendorItems = getVendorItems(account, defs, vendorDef, trackerService, vendorResponse && vendorResponse.itemComponents, vendorResponse && vendorResponse.sales.data);

    // TODO: localize
    return (
      <div className="vendor dim-page">
        <ErrorBoundary name="SingleVendor">
          <div className="vendor-featured">
            <div className="vendor-featured-header">
              {factionProgress && faction
                ? <FactionIcon factionProgress={factionProgress} factionDef={faction}/>
                : <BungieImage src={vendorDef.displayProperties.icon}/>
              }
              <div className="vendor-header-info">
                <h1>{vendorDef.displayProperties.name} <span className="vendor-location">{placeString}</span></h1>
                <div>{vendorDef.displayProperties.description}</div>
                {vendorResponse &&
                  <div>Inventory updates in <Countdown endTime={new Date(vendorResponse.vendor.data.nextRefreshDate)}/></div>
                }
              </div>
            </div>
          </div>
          <VendorItems
            defs={defs}
            vendorDef={vendorDef}
            vendorItems={vendorItems}
            trackerService={trackerService}
            ownedItemHashes={ownedItemHashes}
            currencyLookups={vendorResponse ? vendorResponse.currencyLookups.data.itemQuantities : {}}
          />
        </ErrorBoundary>
      </div>
    );
  }
}
