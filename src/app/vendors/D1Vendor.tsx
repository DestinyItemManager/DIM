import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import Countdown from '../dim-ui/Countdown';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import { Vendor } from './vendor.service';
import D1VendorItems from './D1VendorItems';

interface Props {
  vendor: Vendor;
  totalCoins: {
    [currencyHash: number]: number;
  };
  ownedItemHashes: Set<number>;
}

/**
 * An individual Vendor in the "all vendors" page. Use SingleVendor for a page that only has one vendor on it.
 */
export default class D1Vendor extends React.Component<Props> {
  render() {
    const { vendor, totalCoins, ownedItemHashes } = this.props;

    return (
      <div className="vendor-char-items">
        <CollapsibleTitle
          title={
            <>
              <BungieImage src={vendor.icon} className="vendor-icon" />
              <span>{vendor.name}</span>
              <span className="vendor-location">{vendor.location}</span>
            </>
          }
          extra={<Countdown endTime={new Date(vendor.nextRefreshDate)} />}
          sectionId={`d1vendor-${vendor.hash}`}
        >
          <D1VendorItems
            vendor={vendor}
            totalCoins={totalCoins}
            ownedItemHashes={ownedItemHashes}
          />
        </CollapsibleTitle>
      </div>
    );
  }
}
