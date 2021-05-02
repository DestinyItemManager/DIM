import { VendorIcon, VendorLocation } from 'app/vendors/Vendor';
import React from 'react';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import Countdown from '../../dim-ui/Countdown';
import D1VendorItems from './D1VendorItems';
import { Vendor } from './vendor.service';

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
export default function D1Vendor({ vendor, totalCoins, ownedItemHashes }: Props) {
  return (
    <div>
      <CollapsibleTitle
        title={
          <>
            <VendorIcon src={vendor.icon} />
            <span>{vendor.name}</span>
            <VendorLocation>{vendor.location}</VendorLocation>
          </>
        }
        extra={<Countdown endTime={new Date(vendor.nextRefreshDate)} />}
        sectionId={`d1vendor-${vendor.hash}`}
      >
        <D1VendorItems vendor={vendor} totalCoins={totalCoins} ownedItemHashes={ownedItemHashes} />
      </CollapsibleTitle>
    </div>
  );
}
