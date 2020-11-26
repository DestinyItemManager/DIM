import { XurLocation } from '@d2api/d2api-types';
import { t } from 'app/i18next-t';
import { VENDORS } from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import { VendorDrop } from 'app/vendorEngramsXyzApi/vendorDrops';
import { isDroppingHigh } from 'app/vendorEngramsXyzApi/vendorEngramsXyzService';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import vendorEngramSvg from '../../images/engram.svg';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import Countdown from '../dim-ui/Countdown';
import { D2Vendor } from './d2-vendors';
import styles from './Vendor.m.scss';
import VendorItems from './VendorItems';

/**
 * An individual Vendor in the "all vendors" page. Use SingleVendor for a page that only has one vendor on it.
 */
export default function Vendor({
  vendor,
  defs,
  ownedItemHashes,
  currencyLookups,
  filtering,
  vendorDrops,
  characterId,
}: {
  vendor: D2Vendor;
  defs: D2ManifestDefinitions;
  ownedItemHashes?: Set<number>;
  currencyLookups: {
    [itemHash: number]: number;
  };
  filtering: boolean;
  vendorDrops?: VendorDrop[];
  characterId: string;
}) {
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

  const vendorEngramDrops =
    $featureFlags.vendorEngrams && vendorDrops
      ? vendorDrops.filter((vd) => vd.vendorId === vendor.def.hash)
      : [];

  const dropActive = vendorEngramDrops.some(isDroppingHigh);

  const vendorLinkTitle = dropActive
    ? t('VendorEngramsXyz.DroppingHigh')
    : t('VendorEngramsXyz.Vote');

  return (
    <div id={vendor.def.hash.toString()}>
      <CollapsibleTitle
        className={styles.title}
        title={
          <>
            <span className={styles.vendorIconWrapper}>
              <BungieImage
                src={
                  vendor.def.displayProperties.icon ||
                  vendor.def.displayProperties.smallTransparentIcon
                }
                className={styles.icon}
              />
              {$featureFlags.vendorEngrams && vendorEngramDrops.length > 0 && (
                <a target="_blank" rel="noopener noreferrer" href="https://vendorengrams.xyz/">
                  <img
                    className={clsx(styles.xyzEngram, {
                      [styles.xyzActiveThrob]: dropActive,
                    })}
                    src={vendorEngramSvg}
                    title={vendorLinkTitle}
                  />
                </a>
              )}
            </span>
            <div className={styles.titleDetails}>
              <div>{vendor.def.displayProperties.name}</div>
              <div className={styles.location}>{placeString}</div>
            </div>
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
    return null;
  }
  const destinationDef = defs.Destination.get(xurLocation.destinationHash);
  if (!destinationDef) {
    return null;
  }
  const bubbleDef = destinationDef.bubbles[xurLocation.bubbleIndex];

  return `${bubbleDef.displayProperties.name}, ${destinationDef.displayProperties.name}, ${placeDef.displayProperties.name}`;
}
