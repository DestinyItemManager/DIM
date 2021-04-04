import BungieImage from 'app/dim-ui/BungieImage';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import menuStyles from 'app/dim-ui/PageWithMenu.m.scss';
import React from 'react';
import { D2VendorGroup } from './d2-vendors';

export default function VendorsMenu({ groups }: { groups: readonly D2VendorGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <React.Fragment key={group.def.hash}>
          <PageWithMenu.MenuHeader>{group.def.categoryName}</PageWithMenu.MenuHeader>
          {group.vendors.map((vendor) => (
            <PageWithMenu.MenuButton
              className={menuStyles.withEngram}
              anchor={vendor.def.hash.toString()}
              key={vendor.def.hash}
            >
              <BungieImage
                src={
                  vendor.def.displayProperties.icon ||
                  vendor.def.displayProperties.smallTransparentIcon
                }
              />
              <span>{vendor.def.displayProperties.name}</span>
            </PageWithMenu.MenuButton>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}
