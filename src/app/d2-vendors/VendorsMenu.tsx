import React from 'react';
import { D2VendorGroup } from './d2-vendors';
import styles from './Vendors.m.scss';
import BungieImage from 'app/dim-ui/BungieImage';

export default function VendorsMenu({ groups }: { groups: readonly D2VendorGroup[] }) {
  const goToVendor = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById((e.currentTarget as HTMLAnchorElement).hash.slice(1));
    if (elem) {
      const rect = elem.getBoundingClientRect();
      const options: ScrollToOptions = {
        top: window.scrollY + rect.top - 50,
        left: 0,
        behavior: 'smooth'
      };
      const isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
      if (isSmoothScrollSupported) {
        window.scroll(options);
      } else {
        window.scroll(options.top!, options.left!);
      }
    }
  };
  return (
    <>
      {groups.map((group) => (
        <React.Fragment key={group.def.hash}>
          <div className={styles.menuHeader}>{group.def.categoryName}</div>
          {group.vendors.map((vendor) => (
            <a
              href={`#${vendor.def.hash.toString()}`}
              className={styles.menuButton}
              key={vendor.def.hash}
              onClick={goToVendor}
            >
              <BungieImage src={vendor.def.displayProperties.icon} />
              <span>{vendor.def.displayProperties.name}</span>
            </a>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}
