import { StateParams } from '@uirouter/angularjs';
import { IScope } from 'angular';
import {
  DestinyProfileResponse, DestinyKioskItem
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getKiosks } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { D2ManifestService } from '../manifest/manifest-service';
import './collections.scss';
import VendorItems from '../d2-vendors/vendor-items';
import { DestinyTrackerServiceType } from '../item-review/destiny-tracker.service';
import { fetchRatingsForKiosks } from '../d2-vendors/vendor-ratings';
import { Subscription } from 'rxjs/Subscription';
import { DimStore } from '../inventory/store/d2-store-factory.service';

interface Props {
  $scope: IScope;
  $stateParams: StateParams;
  account: DestinyAccount;
  D2StoresService: StoreServiceType;
  dimDestinyTrackerService: DestinyTrackerServiceType;
}

interface State {
  defs?: D2ManifestDefinitions;
  profileResponse?: DestinyProfileResponse;
  trackerService?: DestinyTrackerServiceType;
  stores?: DimStore[];
  ownedItemHashes?: Set<number>;
}

// TODO: Should this be just in the vendors screen?
export default class Collections extends React.Component<Props, State> {
  private storesSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  async loadCollections() {
    // TODO: don't really have to serialize these...

    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    this.props.$scope.$apply(() => {
      D2ManifestService.isLoaded = true;
    });

    const profileResponse = await getKiosks(this.props.account);
    this.setState({ profileResponse, defs });

    const trackerService = await fetchRatingsForKiosks(defs, this.props.dimDestinyTrackerService, profileResponse);
    this.setState({ trackerService });
  }

  componentDidMount() {
    this.loadCollections();
    this.storesSubscription = this.props.D2StoresService.getStoresStream(this.props.account).subscribe((stores) => {
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
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
  }

  render() {
    const { defs, profileResponse, trackerService, ownedItemHashes } = this.state;

    if (!profileResponse || !defs) {
      // TODO: loading component!
      return <div className="collections dim-page"><i className="fa fa-spinner fa-spin"/></div>;
    }

    const kioskVendors = new Set(Object.keys(profileResponse.profileKiosks.data.kioskItems));
    _.each(profileResponse.characterKiosks.data, (kiosk) => {
      _.each(kiosk.kioskItems, (_, kioskHash) => {
        kioskVendors.add(kioskHash);
      });
    });

    return (
      <div className="vendor d2-vendors dim-page">
        {Array.from(kioskVendors).map((vendorHash) =>
          <Kiosk
            key={vendorHash}
            defs={defs}
            vendorHash={Number(vendorHash)}
            items={itemsForKiosk(profileResponse, Number(vendorHash))}
            trackerService={trackerService}
            ownedItemHashes={ownedItemHashes}
          />
        )}
      </div>
    );
  }
}

function itemsForKiosk(profileResponse: DestinyProfileResponse, vendorHash: number) {
  return profileResponse.profileKiosks.data.kioskItems[vendorHash].concat(_.flatten(Object.values(profileResponse.characterKiosks.data).map((d) => d.kioskItems[vendorHash])));
}

function Kiosk({
  defs,
  vendorHash,
  items,
  trackerService,
  ownedItemHashes
}: {
  defs: D2ManifestDefinitions;
  vendorHash: number;
  items: DestinyKioskItem[];
  trackerService?: DestinyTrackerServiceType;
  ownedItemHashes?: Set<number>;
}) {
  const vendorDef = defs.Vendor.get(vendorHash);

  // TODO: Some items have flavor (emblems)

  return (
    <div className="vendor-char-items">
      <VendorItems
        defs={defs}
        vendorDef={vendorDef}
        kioskItems={items.filter((i) => i.canAcquire)}
        trackerService={trackerService}
        ownedItemHashes={ownedItemHashes}
        currencyLookups={{}}
      />
    </div>
  );
}
