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
import { fetchRatingsAndGetCache } from '../d2-vendors/vendor-ratings';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';

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
  reviewCache?: D2ReviewDataCache;
}

// TODO: Should this be just in the vendors screen?
export default class Collections extends React.Component<Props, State> {
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
    const reviewCache = await fetchRatingsAndGetCache(this.props.dimDestinyTrackerService, undefined, undefined, profileResponse, defs);
    this.setState({ profileResponse, defs, reviewCache });
  }

  componentDidMount() {
    this.loadCollections();
  }

  render() {
    const { defs, profileResponse, reviewCache } = this.state;

    if (!profileResponse || !defs || !reviewCache) {
      // TODO: loading component!
      return <div className="collections dim-page">Loading...</div>;
    }

    const kioskVendors = new Set(Object.keys(profileResponse.profileKiosks.data.kioskItems));
    _.each(profileResponse.characterKiosks.data, (kiosk) => {
      _.each(kiosk.kioskItems, (_, kioskHash) => {
        kioskVendors.add(kioskHash);
      });
    });

    return (
      <div className="vendor d2-vendors dim-page">
        <div className="under-construction">This feature is a preview - we're still working on it!</div>
        {Array.from(kioskVendors).map((vendorHash) =>
          <Kiosk key={vendorHash} defs={defs} vendorHash={Number(vendorHash)} items={itemsForKiosk(profileResponse, Number(vendorHash))} reviewCache={reviewCache}/>
        )}
      </div>
    );
  }
}

function itemsForKiosk(profileResponse: DestinyProfileResponse, vendorHash: number) {
  return profileResponse.profileKiosks.data.kioskItems[vendorHash].concat(_.flatten(Object.values(profileResponse.characterKiosks.data).map((d) => Object.values(d.kioskItems))));
}

function Kiosk({
  defs,
  vendorHash,
  items,
  reviewCache
}: {
  defs: D2ManifestDefinitions;
  vendorHash: number;
  items: DestinyKioskItem[];
  reviewCache: D2ReviewDataCache;
}) {
  const vendorDef = defs.Vendor.get(vendorHash);

  // TODO: Some items have flavor (emblems)

  return (
    <div className="vendor-char-items">
      <VendorItems
        defs={defs}
        vendorDef={vendorDef}
        kioskItems={items.filter((i) => i.canAcquire)}
        reviewCache={reviewCache}
      />
    </div>
  );
}
