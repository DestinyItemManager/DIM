import React, { useState, ReactNode } from 'react';
import styles from './DropDown.m.scss';
import { AppIcon, openDropdownIcon, enabledIcon, unselectedCheckIcon } from 'app/shell/icons';
import ClickOutside from 'app/dim-ui/ClickOutside';

export interface DropDownItem {
  id: string;
  content: ReactNode;
  checked?: boolean;
}

function getClickHandler(item: DropDownItem, onItemSelect: (item: DropDownItem) => void) {
  return () => onItemSelect(item);
}

function getCheckedStatusIcon(item: DropDownItem) {
  const { checked } = item;
  if (checked !== undefined) {
    const icon = checked ? enabledIcon : unselectedCheckIcon;
    return <AppIcon icon={icon} />;
  }
}

function DropDown({
  buttonText,
  dropDownItems,
  onItemSelect
}: {
  buttonText: string;
  dropDownItems: DropDownItem[];
  onItemSelect(item: DropDownItem): void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={styles.dropDown}>
      <ClickOutside onClickOutside={() => setDropdownOpen(false)}>
        <button
          className={`dim-button ${styles.dropDownButton}`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {buttonText} <AppIcon icon={openDropdownIcon} />
        </button>
        <div className={styles.dropDownMenu}>
          {dropdownOpen &&
            dropDownItems.map((item) => (
              <div
                key={item.id}
                className={`check-button ${styles.dropDownCheckButton}`}
                onClick={getClickHandler(item, onItemSelect)}
              >
                <label>{item.content}</label>
                {getCheckedStatusIcon(item)}
              </div>
            ))}
        </div>
      </ClickOutside>
    </div>
  );
}

export default DropDown;
