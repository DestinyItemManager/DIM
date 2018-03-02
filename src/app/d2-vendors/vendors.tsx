import { StateParams } from '@uirouter/angularjs';
import { IScope } from 'angular';
import { DestinyVendorsResponse, DestinyVendorComponent, DestinyItemComponentSetOfint32, DestinyVendorSaleItemComponent } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getBasicProfile, getVendors as getVendorsApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { BungieImage } from '../dim-ui/bungie-image';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { D2ManifestService } from '../manifest/manifest-service';
import { FactionIcon } from '../progress/faction';
import VendorItems from './vendor-items';
import './vendor.scss';
import * as _ from 'underscore';

interface Props {
  $scope: IScope;
  $stateParams: StateParams;
  account: DestinyAccount;
  D2StoresService: StoreServiceType;
}

interface State {
  defs?: D2ManifestDefinitions;
  vendorsResponse?: DestinyVendorsResponse;
}

export default class Vendors extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  async loadVendors() {
    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    this.props.$scope.$apply(() => {
      D2ManifestService.isLoaded = true;
    });

    // TODO: get for all characters, or let people select a character? This is a hack
    // we at least need to display that character!
    let characterId = this.props.$stateParams.characterId;
    if (!characterId) {
      // uggggh
      // TODO: maybe load the whole stores anyway so we can count currencies and such, a la the old thing
      const activeStore = this.props.D2StoresService.getActiveStore();
      characterId = activeStore
        ? activeStore.id
        : (await getBasicProfile(this.props.account)).profile.data.characterIds[0];
    }
    const vendorsResponse = await getVendorsApi(this.props.account, characterId);
    this.setState({ vendorsResponse, defs });
  }

  componentDidMount() {
    this.loadVendors();
  }

  render() {
    const { defs, vendorsResponse } = this.state;

    if (!vendorsResponse || !defs) {
      // TODO: loading component!
      return <div className="vendor dim-page">Loading...</div>;
    }

    const vendors = _.sortBy(Object.values(vendorsResponse.vendors.data), (vendor) => {
      const def = defs.Vendor.get(vendor.vendorHash);
      // TODO: maybe group by location?
      return def ? def.index : 999;
    });

    return (
      <div className="vendor dim-page">
        {vendors.map((vendor) =>
          <Vendor
            key={vendor.vendorHash}
            defs={defs}
            vendor={vendor}
            itemComponents={vendorsResponse.itemComponents[vendor.vendorHash]}
            sales={vendorsResponse.sales.data[vendor.vendorHash] && vendorsResponse.sales.data[vendor.vendorHash].saleItems}
          />
        )}
      </div>
    );
  }
}

function Vendor({
  defs,
  vendor,
  itemComponents,
  sales
}: {
  defs: D2ManifestDefinitions;
  vendor: DestinyVendorComponent;
  itemComponents?: DestinyItemComponentSetOfint32;
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  };
}) {
  const vendorDef = defs.Vendor.get(vendor.vendorHash);
  if (!vendorDef) {
    return null;
  }

  const destinationDef = defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash);
  const placeDef = defs.Place.get(destinationDef.placeHash);

  const placeString = [destinationDef.displayProperties.name, placeDef.displayProperties.name].filter((n) => n.length).join(', ');

  return (
    <div className="vendor-char-items">
      <div className="title">
        <div className="collapse-handle">
          <BungieImage src={vendorDef.displayProperties.icon} className="vendor-icon"/>
          {vendorDef.displayProperties.name}
          <span className="vendor-location">{placeString}</span>
        </div>
      </div>
      <VendorItems
        defs={defs!}
        vendorDef={vendorDef}
        sales={sales}
        itemComponents={itemComponents}
      />
    </div>
  );
}
