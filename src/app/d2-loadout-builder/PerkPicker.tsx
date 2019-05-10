import React from 'react';
import Sheet from '../dim-ui/Sheet';
import SearchFilterInput from '../search/SearchFilterInput';
import '../item-picker/ItemPicker.scss';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { LockableBuckets, LockedItemType } from './types';
import _ from 'lodash';
import './locked-armor/lockedarmor.scss';
import PerksForBucket from './PerksForBucket';

interface Props {
  perks: Readonly<{
    [bucketHash: number]: readonly DestinyInventoryItemDefinition[];
  }>;
  buckets: InventoryBuckets;
  isPhonePortrait: boolean;
  filteredPerks: Readonly<{
    [bucketHash: number]: ReadonlySet<DestinyInventoryItemDefinition>;
  }>;
  lockedMap: Readonly<{
    [bucketHash: number]: readonly LockedItemType[];
  }>;
  onPerkSelected(perk: DestinyInventoryItemDefinition): void;
  onClose(): void;
}

interface State {
  query: string;
  height?: number;
}

/**
 * A sheet that allows picking a perk.
 */
export default class PerkPicker extends React.Component<Props, State> {
  state: State = {
    query: ''
  };
  private itemContainer = React.createRef<HTMLDivElement>();
  private filterInput = React.createRef<SearchFilterInput>();

  componentDidMount() {
    if (this.itemContainer.current) {
      this.setState({ height: this.itemContainer.current.clientHeight });
    }
    // On iOS at least, focusing the keyboard pushes the content off the screen
    if (!this.props.isPhonePortrait && this.filterInput.current) {
      this.filterInput.current.focusFilterInput();
    }
  }

  componentDidUpdate() {
    if (this.itemContainer.current && !this.state.height) {
      this.setState({ height: this.itemContainer.current.clientHeight });
    }
  }

  render() {
    const { perks, buckets, filteredPerks, lockedMap, onClose } = this.props;
    const { query, height } = this.state;

    const header = (
      <div>
        <h1 className="destiny">Choose a perk</h1>
        <div className="item-picker-search search-filter" role="search">
          <input
            className="filter-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Type a perk name"
            type="text"
            name="filter"
            value={query}
            onChange={(e) => this.setState({ query: e.currentTarget.value })}
          />
        </div>
      </div>
    );

    const order = Object.values(LockableBuckets);
    const queryFilteredPerks = _.mapValues(perks, (bucketPerks) =>
      bucketPerks.filter((perk) =>
        perk.displayProperties.name.toLowerCase().includes(query.toLowerCase())
      )
    );

    return (
      <Sheet onClose={onClose} header={header} sheetClassName="item-picker">
        {({ onClose }) => (
          <div ref={this.itemContainer} style={{ height }}>
            {order.map(
              (bucketId) =>
                queryFilteredPerks[bucketId] &&
                queryFilteredPerks[bucketId].length > 0 && (
                  <PerksForBucket
                    bucket={buckets.byHash[bucketId]}
                    perks={queryFilteredPerks[bucketId]}
                    locked={lockedMap[bucketId]}
                    filteredPerks={filteredPerks[bucketId]}
                    onPerkSelected={(perk) => this.onItemSelected(perk, onClose)}
                  />
                )
            )}
          </div>
        )}
      </Sheet>
    );
  }

  private onItemSelected = (item: DestinyInventoryItemDefinition, onClose: () => void) => {
    this.props.onPerkSelected(item);
    onClose();
  };
}
