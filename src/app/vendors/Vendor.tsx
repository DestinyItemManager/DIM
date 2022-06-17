import { XurLocation } from '@d2api/d2api-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { VENDORS } from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import React from 'react';
import { useSelector } from 'react-redux';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
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
  const defs = useD2Definitions()!;
  const xurLocation = useSelector((state: RootState) =>
    vendor.def.hash === VENDORS.XUR ? state.vendors.xurLocation : undefined
  );

  const placeString = xurLocation
    ? extractXurLocationString(defs, xurLocation)
    : Array.from(
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

function extractXurLocationString(defs: D2ManifestDefinitions, xurLocation: XurLocation) {
  const placeDef = defs.Place.get(xurLocation.placeHash);
  if (!placeDef) {
    return xurLocation.locationName;
  }
  const destinationDef = defs.Destination.get(xurLocation.destinationHash);
  if (!destinationDef) {
    return xurLocation.locationName;
  }
  const bubbleDef = destinationDef.bubbles[xurLocation.bubbleIndex];

  return `${bubbleDef.displayProperties.name}, ${destinationDef.displayProperties.name}, ${placeDef.displayProperties.name}`;
}
