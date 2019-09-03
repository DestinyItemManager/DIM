import React from 'react';
import { D2VendorGroup } from './d2-vendors';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import BungieImage from 'app/dim-ui/BungieImage';

export default function VendorsMenu({ groups }: { groups: readonly D2VendorGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <React.Fragment key={group.def.hash}>
          <PageWithMenu.MenuHeader>{group.def.categoryName}</PageWithMenu.MenuHeader>
          {group.vendors.map((vendor) => (
            <PageWithMenu.MenuButton anchor={vendor.def.hash.toString()} key={vendor.def.hash}>
              <BungieImage src={vendor.def.displayProperties.icon} />
              <span>{vendor.def.displayProperties.name}</span>
            </PageWithMenu.MenuButton>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}
