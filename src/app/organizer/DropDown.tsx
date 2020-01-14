import React, { useState, ReactNode } from 'react';
import styles from './DropDown.m.scss';
import { AppIcon, openDropdownIcon, enabledIcon, unselectedCheckIcon } from 'app/shell/icons';
import ClickOutside from 'app/dim-ui/ClickOutside';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import { DestinyClass } from 'bungie-api-ts/destiny2';

export interface DropDownItem {
  id: string;
  content: ReactNode;
  checked?: boolean;
  onItemSelect?(e: any): void;
}

function MenuItem({ item, forClass }: { item: DropDownItem; forClass?: DestinyClass }) {
  const { checked } = item;
  let icon;
  if (checked !== undefined) {
    icon = <AppIcon icon={checked ? enabledIcon : unselectedCheckIcon} />;
  }
  const label =
    item.id === 'customstat' ? (
      <>
        Custom Total
        <StatTotalToggle forClass={forClass} />
      </>
    ) : (
      <>{item.content}</>
    );
  return (
    <div key={item.id} className={`check-button ${styles.checkButton}`} onClick={item.onItemSelect}>
      <label>{label}</label>
      {icon}
    </div>
  );
}

function DropDown({
  buttonText,
  buttonDisabled,
  dropDownItems,
  forClass
}: {
  buttonText: string;
  buttonDisabled?: boolean;
  dropDownItems: DropDownItem[];
  forClass?: DestinyClass;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={styles.dropDown}>
      <ClickOutside onClickOutside={() => setDropdownOpen(false)}>
        <button
          className={`dim-button ${styles.button}`}
          disabled={buttonDisabled}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {buttonText} <AppIcon icon={openDropdownIcon} />
        </button>
        <div className={styles.menu}>
          {dropdownOpen &&
            dropDownItems.map((item) => <MenuItem key={item.id} item={item} forClass={forClass} />)}
        </div>
      </ClickOutside>
    </div>
  );
}

export default DropDown;
