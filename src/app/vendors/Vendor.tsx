import { XurLocation } from '@d2api/d2api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import Countdown from 'app/dim-ui/Countdown';
import { useD2Definitions } from 'app/manifest/selectors';
import { VENDORS } from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
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
    : _.uniq(
        [vendor.destination?.displayProperties.name, vendor.place?.displayProperties.name].filter(
          (n) => n?.length
        )
      ).join(', ');

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
        extra={
          vendor.component && <Countdown endTime={new Date(vendor.component.nextRefreshDate)} />
        }
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
