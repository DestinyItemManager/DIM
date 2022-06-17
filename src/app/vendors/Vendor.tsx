import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import Countdown from '../dim-ui/Countdown';
import { D2Vendor } from './d2-vendors';
import styles from './Vendor.m.scss';
import VendorItems from './VendorItems';

export function VendorLocation({ children }: { children: React.ReactNode }) {
  return <span className={styles.location}>{children}</span>;
}

export function VendorIcon({ src }: { src: string }) {
  return <BungieImage src={src} className={styles.icon} />;
}

/**
 * An individual Vendor in the "all vendors" page. Use SingleVendor for a page that only has one vendor on it.
 */
export default function Vendor({
  vendor,
  ownedItemHashes,
  currencyLookups,
  filtering,
  characterId,
}: {
  vendor: D2Vendor;
  ownedItemHashes?: Set<number>;
  currencyLookups: {
    [itemHash: number]: number;
  };
  filtering: boolean;
  characterId: string;
}) {
  const placeString = Array.from(
    new Set(
      [vendor.destination?.displayProperties.name, vendor.place?.displayProperties.name].filter(
        (n) => n?.length
      )
    )
  ).join(', ');

  let refreshTime = vendor.component && new Date(vendor.component.nextRefreshDate);
  if (refreshTime?.getFullYear() === 9999) {
    refreshTime = undefined;
  }

  return (
    <div id={vendor.def.hash.toString()}>
      <CollapsibleTitle
        className={styles.title}
        title={
          <>
            <span className={styles.vendorIconWrapper}>
              <BungieImage
                src={
                  vendor.def.displayProperties.smallTransparentIcon ||
                  vendor.def.displayProperties.icon
                }
                className={styles.icon}
              />
            </span>
            <div className={styles.titleDetails}>
              <div>{vendor.def.displayProperties.name}</div>
              <VendorLocation>{placeString}</VendorLocation>
            </div>
          </>
        }
        extra={refreshTime && <Countdown endTime={refreshTime} />}
        sectionId={`d2vendor-${vendor.def.hash}`}
      >
        <VendorItems
          vendor={vendor}
          ownedItemHashes={ownedItemHashes}
          currencyLookups={currencyLookups}
          filtering={filtering}
          characterId={characterId}
        />
      </CollapsibleTitle>
    </div>
  );
}
