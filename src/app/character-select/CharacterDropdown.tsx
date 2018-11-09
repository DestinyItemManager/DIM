import * as React from 'react';
import ClickOutside from '../dim-ui/ClickOutside';
import { DimStore } from '../inventory/store-types';
import SimpleCharacterTile from '../inventory/SimpleCharacterTile';
import './characterdropdown.scss';

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
      <div className="character-dropdown">
        <SimpleCharacterTile character={selectedStore} onClick={this.toggleDropdown} />
        {dropdownOpen && (
          <ClickOutside onClickOutside={this.closeDropdown}>
            {stores
              .filter((s) => !s.isVault && s.id !== selectedStore.id)
              .map((store) => (
                <SimpleCharacterTile
                  key={store.id}
                  character={store}
                  onClick={this.selectCharacter}
                />
              ))}
          </ClickOutside>
        )}
      </div>
    );
  }

  private toggleDropdown = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  };

  private closeDropdown = () => {
    this.setState({ dropdownOpen: false });
  };

  private selectCharacter = (storeId: string) => {
    this.setState({ dropdownOpen: false });
    this.props.onCharacterChanged(storeId);
  };
}
