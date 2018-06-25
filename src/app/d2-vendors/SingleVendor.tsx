import { StateParams } from '@uirouter/angularjs';
import { IScope } from 'angular';
import { DestinyVendorDefinition, DestinyVendorResponse } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendor as getVendorApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import Countdown from '../dim-ui/Countdown';
import { D2ManifestService } from '../manifest/manifest-service';
import VendorItems from './VendorItems';
import './vendor.scss';
import { fetchRatingsForVendor, fetchRatingsForVendorDef } from './vendor-ratings';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { Subscription } from 'rxjs/Subscription';
import { D2Store } from '../inventory/store-types';
import { getVendorItems } from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService } from '../inventory/d2-stores.service';
import { Loading } from '../dim-ui/Loading';

interface Props {
  $scope: IScope;
  $stateParams: StateParams;
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
export default class SingleVendor extends React.Component<Props, State> {
  private storesSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      vendorHash: this.props.$stateParams.id
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
      let characterId: string = this.props.$stateParams.characterId;
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
    this.loadVendor();
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
  }

  render() {
    const { defs, vendorDef, vendorResponse, trackerService, ownedItemHashes } = this.state;
    const { account } = this.props;

    if (!vendorDef || !defs) {
      return <div className="vendor dim-page"><Loading/></div>;
    }

    // TODO:
    // * featured item
    // * enabled
    // * filter by character class
    const vendor = vendorResponse && vendorResponse.vendor.data;

    const destinationDef = vendor && defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash);
    const placeDef = destinationDef && defs.Place.get(destinationDef.placeHash);

    const placeString = [(destinationDef && destinationDef.displayProperties.name), (placeDef && placeDef.displayProperties.name)].filter((n) => n && n.length).join(', ');
    // TODO: there's a cool background image but I'm not sure how to use it

    const vendorItems = getVendorItems(account, defs, vendorDef, trackerService, vendorResponse && vendorResponse.itemComponents, vendorResponse && vendorResponse.sales.data);

    return (
      <div className="vendor dim-page">
        <ErrorBoundary name="SingleVendor">
          <div className="vendor-featured">
            <div className="vendor-featured-header">
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
            vendor={vendor}
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
