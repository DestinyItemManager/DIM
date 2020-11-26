import BungieImage from 'app/dim-ui/BungieImage';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import menuStyles from 'app/dim-ui/PageWithMenu.m.scss';
import { t } from 'app/i18next-t';
import { VendorDrop } from 'app/vendorEngramsXyzApi/vendorDrops';
import { isDroppingHigh } from 'app/vendorEngramsXyzApi/vendorEngramsXyzService';
import React from 'react';
import vendorEngramSvg from '../../images/engram.svg';
import { D2VendorGroup } from './d2-vendors';
import styles from './VendorsMenu.m.scss';

export default function VendorsMenu({
  groups,
  vendorEngramDrops,
}: {
  groups: readonly D2VendorGroup[];
  vendorEngramDrops: readonly VendorDrop[] | undefined;
}) {
  return (
    <>
      {groups.map((group) => (
        <React.Fragment key={group.def.hash}>
          <PageWithMenu.MenuHeader>{group.def.categoryName}</PageWithMenu.MenuHeader>
          {group.vendors.map((vendor) => {
            const matchingVendor = vendorEngramDrops?.find((vd) => vd.vendorId === vendor.def.hash);
            const droppingHigh = matchingVendor && isDroppingHigh(matchingVendor);
            return (
              <PageWithMenu.MenuButton
                className={menuStyles.withEngram}
                anchor={vendor.def.hash.toString()}
                key={vendor.def.hash}
              >
                {droppingHigh && (
                  <img
                    className={styles.xyzEngram}
                    src={vendorEngramSvg}
                    title={t('VendorEngramsXyz.DroppingHigh')}
                  />
                )}
                <BungieImage
                  src={
                    vendor.def.displayProperties.icon ||
                    vendor.def.displayProperties.smallTransparentIcon
                  }
                />
                <span>{vendor.def.displayProperties.name}</span>
              </PageWithMenu.MenuButton>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
}
