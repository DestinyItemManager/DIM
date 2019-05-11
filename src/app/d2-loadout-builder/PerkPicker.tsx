import React from 'react';
import Sheet from '../dim-ui/Sheet';
import SearchFilterInput from '../search/SearchFilterInput';
import '../item-picker/ItemPicker.scss';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBuckets, InventoryBucket } from 'app/inventory/inventory-buckets';
import { LockableBuckets, LockedItemType, BurnItem } from './types';
import _, { escapeRegExp } from 'lodash';
import { t } from 'app/i18next-t';
import './locked-armor/lockedarmor.scss';
import PerksForBucket from './PerksForBucket';

const burns: BurnItem[] = [
  {
    index: 'arc',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeArc'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/arc.png'
    }
  },
  {
    index: 'solar',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeSolar'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/thermal.png'
    }
  },
  {
    index: 'void',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeVoid'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/void.png'
    }
  }
];

interface Props {
  /** All available perks, by bucket */
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
  language: string;
  onPerkSelected(perk: LockedItemType, bucket: InventoryBucket): void;
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
    const { perks, buckets, filteredPerks, lockedMap, language, onClose } = this.props;
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
            placeholder="Search perk name and description"
            type="text"
            name="filter"
            value={query}
            onChange={(e) => this.setState({ query: e.currentTarget.value })}
          />
        </div>
      </div>
    );

    const order = Object.values(LockableBuckets);

    // Only some languages effectively use the \b regex word boundary
    const regexp = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
      ? new RegExp(`\\b${escapeRegExp(query)}`, 'i')
      : new RegExp(escapeRegExp(query), 'i');

    const queryFilteredPerks = query.length
      ? _.mapValues(perks, (bucketPerks) =>
          bucketPerks.filter(
            (perk) =>
              regexp.test(perk.displayProperties.name) ||
              regexp.test(perk.displayProperties.description)
          )
        )
      : perks;

    const queryFilteredBurns = query.length
      ? burns.filter((burn) => regexp.test(burn.displayProperties.name))
      : burns;

    // TODO: tabs for armor types?
    // TODO: sort unfiltered items to the front?
    return (
      <Sheet onClose={onClose} header={header} sheetClassName="item-picker">
        {({ onClose }) => (
          <div ref={this.itemContainer} style={{ height }}>
            {order.map(
              (bucketId) =>
                queryFilteredPerks[bucketId] &&
                queryFilteredPerks[bucketId].length > 0 && (
                  <PerksForBucket
                    key={bucketId}
                    bucket={buckets.byHash[bucketId]}
                    perks={queryFilteredPerks[bucketId]}
                    burns={queryFilteredBurns}
                    locked={lockedMap[bucketId]}
                    filteredPerks={filteredPerks[bucketId]}
                    onPerkSelected={(perk) =>
                      this.onPerkSelected(perk, buckets.byHash[bucketId], onClose)
                    }
                  />
                )
            )}
          </div>
        )}
      </Sheet>
    );
  }

  private onPerkSelected = (item: LockedItemType, bucket: InventoryBucket, onClose: () => void) => {
    this.props.onPerkSelected(item, bucket);
    onClose();
  };
}
