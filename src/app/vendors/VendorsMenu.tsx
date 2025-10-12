import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import React from 'react';
import { D2VendorGroup } from './d2-vendors';
import * as styles from './VendorsMenu.m.scss';

export default function VendorsMenu({ groups }: { groups: readonly D2VendorGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <React.Fragment key={group.def.hash}>
          <PageWithMenu.MenuHeader>{group.def.categoryName}</PageWithMenu.MenuHeader>
          {group.vendors.map((vendor) => (
            <PageWithMenu.MenuButton
              anchor={vendor.def.hash.toString()}
              key={vendor.def.hash}
              className={styles.vendorMenuItem}
            >
              <BungieImage
                src={
                  vendor.def.displayProperties.smallTransparentIcon ||
                  vendor.def.displayProperties.icon
                }
              />
              <RichDestinyText text={vendor.def.displayProperties.name} />
            </PageWithMenu.MenuButton>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}
