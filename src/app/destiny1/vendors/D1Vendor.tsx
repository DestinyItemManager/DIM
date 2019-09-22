import React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import Countdown from '../../dim-ui/Countdown';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { Vendor } from './vendor.service';
import D1VendorItems from './D1VendorItems';
import styles from '../../vendors/Vendor.m.scss';

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
            <BungieImage src={vendor.icon} className={styles.icon} />
            <span>{vendor.name}</span>
            <span className={styles.location}>{vendor.location}</span>
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
