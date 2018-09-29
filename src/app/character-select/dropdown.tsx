import * as React from 'react';
import ClickOutside from '../dim-ui/ClickOutside';
import { DimStore } from '../inventory/store-types';
import StoreHeading from '../inventory/StoreHeading';

interface Props {
  stores: DimStore[];
  selectedStore: DimStore;
  onCharacterChanged(order: string): void;
}

interface State {
  dropdownOpen: boolean;
}

/**
 * Dropdown for picking a character
 */
export default class CharacterDropdown extends React.Component<Props, State> {
  state: State = { dropdownOpen: false };

  render() {
    const { stores, selectedStore } = this.props;
    const { dropdownOpen } = this.state;

    return (
      <ClickOutside onClickOutside={this.closeDropdown} className="character-select">
        <StoreHeading
          store={selectedStore}
          selectedStore={selectedStore}
          onTapped={this.toggleDropdown}
        />
        {dropdownOpen &&
          stores
            .filter((s) => !s.isVault && s.id !== selectedStore.id)
            .map((store) => (
              <StoreHeading
                key={store.id}
                store={store}
                selectedStore={selectedStore}
                hideDropdownIcon={true}
                onTapped={this.selectCharacter}
              />
            ))}
      </ClickOutside>
    );
  }

  private toggleDropdown = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  };

  private closeDropdown = () => {
    this.setState({ dropdownOpen: false });
  };

  private selectCharacter = (storeId?: string) => {
    this.setState({ dropdownOpen: false });
    if (storeId) {
      this.props.onCharacterChanged(storeId);
    }
  };
}
