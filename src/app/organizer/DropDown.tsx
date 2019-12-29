import React, { useState, ReactNode } from 'react';
import styles from './DropDown.m.scss';
import { AppIcon, openDropdownIcon, enabledIcon, unselectedCheckIcon } from 'app/shell/icons';
import ClickOutside from 'app/dim-ui/ClickOutside';

export interface DropDownItem {
  id: string;
  content: ReactNode;
  checked?: boolean;
  onItemSelect?(e: any): void;
}

function MenuItem({ item }: { item: DropDownItem }) {
  const { checked } = item;
  let icon;
  if (checked !== undefined) {
    icon = <AppIcon icon={checked ? enabledIcon : unselectedCheckIcon} />;
  }

  return (
    <div key={item.id} className={`check-button ${styles.checkButton}`} onClick={item.onItemSelect}>
      <label>{item.content}</label>
      {icon}
    </div>
  );
}

function DropDown({
  buttonText,
  buttonDisabled,
  dropDownItems
}: {
  buttonText: string;
  buttonDisabled?: boolean;
  dropDownItems: DropDownItem[];
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
          {dropdownOpen && dropDownItems.map((item) => <MenuItem key={item.id} item={item} />)}
        </div>
      </ClickOutside>
    </div>
  );
}

export default DropDown;
