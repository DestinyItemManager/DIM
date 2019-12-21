import React, { useState, ReactNode } from 'react';
import styles from './DropDown.m.scss';
import { AppIcon, openDropdownIcon } from 'app/shell/icons';
import ClickOutside from 'app/dim-ui/ClickOutside';

export interface DropDownItem {
  id: string;
  content: ReactNode;
  checked?: boolean;
}

function DropDown({
  buttonText,
  dropDownItems,
  onItemSelect
}: {
  buttonText: string;
  dropDownItems: DropDownItem[];
  onItemSelect: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={styles.dropDown}>
      <ClickOutside onClickOutside={() => setDropdownOpen(false)}>
        <div
          className={`dim-button ${styles.dropDownButton}`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {buttonText} <AppIcon icon={openDropdownIcon} />
        </div>
        <div className={styles.dropDownMenu}>
          {dropdownOpen &&
            dropDownItems.map((item) => (
              <label key={item.id} className={`check-button ${styles.dropDownCheckButton}`}>
                <input
                  name={item.id}
                  type="checkbox"
                  checked={item.checked}
                  onChange={onItemSelect}
                />{' '}
                {item.content}
              </label>
            ))}
        </div>
      </ClickOutside>
    </div>
  );
}

export default DropDown;
