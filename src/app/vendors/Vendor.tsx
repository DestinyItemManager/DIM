import BungieImage from '../dim-ui/BungieImage';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import Countdown from '../dim-ui/Countdown';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Vendor } from './d2-vendors';
import React from 'react';
import { VendorDrop } from 'app/vendorEngramsXyzApi/vendorDrops';
import VendorItems from './VendorItems';
import _ from 'lodash';
import clsx from 'clsx';
import { isDroppingHigh } from 'app/vendorEngramsXyzApi/vendorEngramsXyzService';
import styles from './Vendor.m.scss';
import { t } from 'app/i18next-t';
import vendorEngramSvg from '../../images/engram.svg';

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
  const placeString = _.uniq(
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
              <BungieImage src={vendor.def.displayProperties.icon} className={styles.icon} />
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
