import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import Countdown from '../dim-ui/Countdown';
import VendorItems from './VendorItems';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import { D2Vendor } from './d2-vendors';
import styles from './Vendor.m.scss';

/**
 * An individual Vendor in the "all vendors" page. Use SingleVendor for a page that only has one vendor on it.
 */
export default function Vendor({
  vendor,
  defs,
  ownedItemHashes,
  currencyLookups
}: {
  vendor: D2Vendor;
  defs: D2ManifestDefinitions;
  ownedItemHashes?: Set<number>;
  currencyLookups: {
    [itemHash: number]: number;
  };
}) {
  const placeString = [
    vendor.destination && vendor.destination.displayProperties.name,
    vendor.place && vendor.place.displayProperties.name
  ]
    .filter((n) => n && n.length)
    .join(', ');

  return (
    <div id={vendor.def.hash.toString()}>
      <CollapsibleTitle
        title={
          <>
            <BungieImage src={vendor.def.displayProperties.icon} className={styles.icon} />
            <span>{vendor.def.displayProperties.name}</span>
            <span className={styles.location}>{placeString}</span>
          </>
        }
        extra={
          vendor.component && <Countdown endTime={new Date(vendor.component.nextRefreshDate)} />
        }
        sectionId={`d2vendor-${vendor.def.hash}`}
      >
        <VendorItems
          defs={defs}
          vendor={vendor}
          ownedItemHashes={ownedItemHashes}
          currencyLookups={currencyLookups}
        />
      </CollapsibleTitle>
    </div>
  );
}
