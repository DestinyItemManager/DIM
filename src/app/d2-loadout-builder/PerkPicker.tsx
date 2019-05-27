import React from 'react';
import Sheet from '../dim-ui/Sheet';
import SearchFilterInput from '../search/SearchFilterInput';
import '../item-picker/ItemPicker.scss';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBuckets, InventoryBucket } from 'app/inventory/inventory-buckets';
import { LockableBuckets, LockedItemType, BurnItem, LockedMap, ItemsByBucket } from './types';
import _, { escapeRegExp } from 'lodash';
import { t } from 'app/i18next-t';
import PerksForBucket from './PerksForBucket';
import { removeLockedItem, lockedItemsEqual, addLockedItem } from './generated-sets/utils';
import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import styles from './PerkPicker.m.scss';
import GlobalHotkeys from 'app/hotkeys/GlobalHotkeys';
import { AppIcon, searchIcon } from 'app/shell/icons';
import copy from 'fast-copy';

const burns: BurnItem[] = [
  {
    dmg: 'arc',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeArc'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/arc.png'
    }
  },
  {
    dmg: 'solar',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeSolar'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/thermal.png'
    }
  },
  {
    dmg: 'void',
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
  items: ItemsByBucket;
  lockedMap: LockedMap;
  language: string;
  onPerksSelected(perks: LockedMap): void;
  onClose(): void;
}

interface State {
  query: string;
  height?: number;
  selectedPerks: LockedMap;
}

/**
 * A sheet that allows picking a perk.
 */
export default class PerkPicker extends React.Component<Props, State> {
  state: State = {
    query: '',
    selectedPerks: copy(this.props.lockedMap)
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
    const { perks, buckets, items, language, onClose, isPhonePortrait } = this.props;
    const { query, height, selectedPerks } = this.state;

    const order = Object.values(LockableBuckets);

    const header = (
      <div>
        <h1>Choose a perk</h1>
        <div className="item-picker-search">
          <div className="search-filter" role="search">
            <AppIcon icon={searchIcon} />
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
        <div className={styles.tabs}>
          {order.map((bucketId) => (
            <div
              key={bucketId}
              className={styles.tab}
              onClick={() => this.scrollToBucket(bucketId)}
            >
              {buckets.byHash[bucketId].name}
            </div>
          ))}
        </div>
      </div>
    );

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

    const flattenedPerks: LockedItemType[] = Object.values(selectedPerks)
      .flat()
      .filter(Boolean);

    const footer = Object.values(selectedPerks).some((f) => Boolean(f && f.length))
      ? ({ onClose }) => (
          <div className={styles.footer}>
            <div>
              <button className={styles.submitButton} onClick={(e) => this.onSubmit(e, onClose)}>
                {!isPhonePortrait && '⏎ '}
                {t('LoadoutBuilder.SelectPerks')}
              </button>
            </div>
            <div className={styles.selectedPerks}>
              {flattenedPerks.map((lockedItem) => (
                <LockedItemIcon
                  key={
                    (lockedItem.type === 'perk' && lockedItem.perk.hash) ||
                    (lockedItem.type === 'burn' && lockedItem.burn.dmg) ||
                    'unknown'
                  }
                  lockedItem={lockedItem}
                  onClick={() => this.onPerkSelected(lockedItem, lockedItem.bucket)}
                />
              ))}
              <GlobalHotkeys
                hotkeys={[
                  {
                    combo: 'enter',
                    description: t('LoadoutBuilder.SelectPerks'),
                    callback: (event) => {
                      this.onSubmit(event, onClose);
                    }
                  }
                ]}
              />
            </div>
          </div>
        )
      : undefined;

    // TODO: tabs for armor types?
    // TODO: sort unfiltered items to the front?
    // TODO: keep the list of greyed out perks updated
    return (
      <Sheet onClose={onClose} header={header} footer={footer} sheetClassName="item-picker">
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
                  locked={selectedPerks[bucketId] || []}
                  items={items[bucketId]}
                  onPerkSelected={(perk) => this.onPerkSelected(perk, buckets.byHash[bucketId])}
                />
              )
          )}
        </div>
      </Sheet>
    );
  }

  private onPerkSelected = (item: LockedItemType, bucket: InventoryBucket) => {
    const { selectedPerks } = this.state;

    const perksForBucket = selectedPerks[bucket.hash];
    if (perksForBucket && perksForBucket.some((li) => lockedItemsEqual(li, item))) {
      this.setState({
        selectedPerks: {
          ...selectedPerks,
          [bucket.hash]: removeLockedItem(item, selectedPerks[bucket.hash])
        }
      });
    } else {
      this.setState({
        selectedPerks: {
          ...selectedPerks,
          [bucket.hash]: addLockedItem(item, selectedPerks[bucket.hash])
        }
      });
    }
  };

  private onSubmit = (e, onClose: () => void) => {
    e.preventDefault();
    this.props.onPerksSelected(this.state.selectedPerks);
    onClose();
  };

  private scrollToBucket = (bucketId) => {
    const elem = document.getElementById(`perk-bucket-${bucketId}`)!;
    elem.scrollIntoView();
  };
}

function LockedItemIcon({ lockedItem, onClick }: { lockedItem: LockedItemType; onClick(e): void }) {
  switch (lockedItem.type) {
    case 'perk':
      return (
        <BungieImageAndAmmo
          onClick={onClick}
          className={styles.selectedPerk}
          hash={lockedItem.perk.hash}
          title={lockedItem.perk.displayProperties.name}
          src={lockedItem.perk.displayProperties.icon}
        />
      );
    case 'burn':
      return (
        <div
          className={styles.selectedPerk}
          title={lockedItem.burn.displayProperties.name}
          onClick={onClick}
        >
          <img src={lockedItem.burn.displayProperties.icon} />
        </div>
      );
  }

  return null;
}
