import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import GlobalHotkeys from 'app/hotkeys/GlobalHotkeys';
import { t } from 'app/i18next-t';
import { InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { escapeRegExp } from 'app/search/search-filters/freeform';
import { SearchFilterRef } from 'app/search/SearchBar';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import copy from 'fast-copy';
import _ from 'lodash';
import React, { Dispatch, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import ArmorBucketIcon from '../ArmorBucketIcon';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { ItemsByBucket, LockableBuckets, LockedItemType, LockedMap } from '../types';
import {
  addLockedItem,
  filterPlugs,
  isLoadoutBuilderItem,
  lockedItemsEqual,
  removeLockedItem,
} from '../utils';
import styles from './PerkPicker.m.scss';
import PickerSectionPerks from './PickerSectionPerks';

interface ProvidedProps {
  items: ItemsByBucket;
  lockedMap: LockedMap;
  classType: DestinyClass;
  initialQuery?: string;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

interface StoreProps {
  language: string;
  isPhonePortrait: boolean;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  perks: Readonly<{
    [bucketHash: number]: readonly PluggableInventoryItemDefinition[];
  }>;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  // Get a list of lockable perks by bucket.
  const perksSelector = createSelector(
    allItemsSelector,
    (_: RootState, props: ProvidedProps) => props.classType,
    (allItems, classType) => {
      const perks: { [bucketHash: number]: PluggableInventoryItemDefinition[] } = {};
      for (const item of allItems) {
        if (
          !item ||
          !item.sockets ||
          !isLoadoutBuilderItem(item) ||
          !(item.classType === DestinyClass.Unknown || item.classType === classType)
        ) {
          continue;
        }
        if (!perks[item.bucket.hash]) {
          perks[item.bucket.hash] = [];
        }
        // build the filtered unique perks item picker
        item.sockets.allSockets.filter(filterPlugs).forEach((socket) => {
          socket.plugOptions.forEach((option) => {
            perks[item.bucket.hash].push(option.plugDef);
          });
        });
      }

      // sort exotic perks first, then by index
      Object.keys(perks).forEach((bucket) => {
        const bucketPerks = _.uniq<PluggableInventoryItemDefinition>(perks[bucket]);
        bucketPerks.sort((a, b) => b.index - a.index);
        bucketPerks.sort((a, b) => b.inventory!.tierType - a.inventory!.tierType);
        perks[bucket] = bucketPerks;
      });

      return perks;
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: bucketsSelector(state)!,
    language: settingsSelector(state).language,
    perks: perksSelector(state, props),
    defs: state.manifest.d2Manifest!,
  });
}

/**
 * A sheet that allows picking a perk.
 */
function PerkPicker({
  defs,
  lockedMap,
  perks,
  buckets,
  items,
  language,
  isPhonePortrait,
  initialQuery,
  onClose,
  lbDispatch,
}: Props) {
  const [query, setQuery] = useState(initialQuery || '');
  const [selectedPerks, setSelectedPerks] = useState(copy(lockedMap));
  const filterInput = useRef<SearchFilterRef>(null);

  const order = Object.values(LockableBuckets);

  useEffect(() => {
    if (!isPhonePortrait && filterInput.current) {
      filterInput.current.focusFilterInput();
    }
  }, [isPhonePortrait, filterInput]);

  const onPerkSelected = (item: LockedItemType, bucket: InventoryBucket) => {
    const perksForBucket = selectedPerks[bucket.hash];
    if (perksForBucket?.some((li) => lockedItemsEqual(li, item))) {
      setSelectedPerks({
        ...selectedPerks,
        [bucket.hash]: removeLockedItem(item, selectedPerks[bucket.hash]),
      });
    } else {
      setSelectedPerks({
        ...selectedPerks,
        [bucket.hash]: addLockedItem(item, selectedPerks[bucket.hash]),
      });
    }
  };

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    lbDispatch({
      type: 'lockedMapChanged',
      lockedMap: selectedPerks,
    });
    onClose();
  };

  const scrollToBucket = (bucketId: number) => {
    const elem = document.getElementById(`perk-bucket-${bucketId}`)!;
    elem?.scrollIntoView();
  };

  // On iOS at least, focusing the keyboard pushes the content off the screen
  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  const header = (
    <div>
      <h1>{t('LB.ChooseAPerk')}</h1>
      <div className="item-picker-search">
        <div className="search-filter" role="search">
          <AppIcon icon={searchIcon} />
          <input
            className="filter-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            autoFocus={autoFocus}
            placeholder="Search perk name and description"
            type="text"
            name="filter"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </div>
      </div>
      <div className={styles.tabs}>
        {order.map((bucketId) => (
          <div key={bucketId} className={styles.tab} onClick={() => scrollToBucket(bucketId)}>
            <ArmorBucketIcon bucket={buckets.byHash[bucketId]} />
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

  const footer = Object.values(selectedPerks).some((f) => Boolean(f?.length))
    ? ({ onClose }) => (
        <div className={styles.footer}>
          <div>
            <button
              type="button"
              className={styles.submitButton}
              onClick={(e) => onSubmit(e, onClose)}
            >
              {!isPhonePortrait && '⏎ '}
              {t('LoadoutBuilder.SelectPerks')}
            </button>
          </div>
          <div className={styles.selectedPerks}>
            {order.map(
              (bucketHash) =>
                selectedPerks[bucketHash] && (
                  <React.Fragment key={bucketHash}>
                    <ArmorBucketIcon
                      bucket={buckets.byHash[bucketHash]}
                      className={styles.armorIcon}
                    />
                    {selectedPerks[bucketHash]!.map((lockedItem) => (
                      <LockedItemIcon
                        key={(lockedItem.type === 'perk' && lockedItem.perk.hash) || 'unknown'}
                        defs={defs}
                        lockedItem={lockedItem}
                        onClick={() => {
                          if (lockedItem.bucket) {
                            onPerkSelected(lockedItem, lockedItem.bucket);
                          }
                        }}
                      />
                    ))}
                  </React.Fragment>
                )
            )}
            <GlobalHotkeys
              hotkeys={[
                {
                  combo: 'enter',
                  description: t('LoadoutBuilder.SelectPerks'),
                  callback: (event) => {
                    onSubmit(event, onClose);
                  },
                },
              ]}
            />
          </div>
        </div>
      )
    : undefined;

  return (
    <Sheet
      onClose={onClose}
      header={header}
      footer={footer}
      sheetClassName="item-picker"
      freezeInitialHeight={true}
    >
      {order.map(
        (bucketId) =>
          queryFilteredPerks[bucketId] &&
          queryFilteredPerks[bucketId].length > 0 && (
            <PickerSectionPerks
              key={bucketId}
              defs={defs}
              bucket={buckets.byHash[bucketId]}
              perks={queryFilteredPerks[bucketId]}
              locked={selectedPerks[bucketId] || []}
              items={items[bucketId]}
              onPerkSelected={(perk) => onPerkSelected(perk, buckets.byHash[bucketId])}
            />
          )
      )}
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(PerkPicker);

function LockedItemIcon({
  lockedItem,
  onClick,
}: {
  lockedItem: LockedItemType;
  defs: D2ManifestDefinitions;
  onClick(e: React.MouseEvent): void;
}) {
  switch (lockedItem.type) {
    case 'perk':
      return (
        <span onClick={onClick}>
          <BungieImageAndAmmo
            className={styles.selectedPerk}
            hash={lockedItem.perk.hash}
            title={lockedItem.perk.displayProperties.name}
            src={lockedItem.perk.displayProperties.icon}
          />
        </span>
      );
  }

  return null;
}
