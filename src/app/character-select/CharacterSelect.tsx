import * as React from 'react';
import classNames from 'classnames';
import { DimStore } from '../inventory/store-types';
import SimpleCharacterTile from '../inventory/SimpleCharacterTile';
import './characterdropdown.scss';

interface Props {
  stores: DimStore[];
  selectedStore: DimStore;
  onCharacterChanged(order: string): void;
}

/**
 * Select for picking a character
 */
export default class CharacterSelect extends React.Component<Props> {
  render() {
    const { stores, selectedStore } = this.props;

    return (
      <div className="character-select">
        {stores
          .filter((s) => !s.isVault)
          .map((store) => (
            <div
              key={store.id}
              className={classNames('character-tile', {
                unselected: store.id !== selectedStore.id
              })}
            >
              <SimpleCharacterTile character={store} onClick={this.selectCharacter} />
            </div>
          ))}
      </div>
    );
  }

  private selectCharacter = (storeId: string) => {
    this.props.onCharacterChanged(storeId);
  };
}
