import React, { ChangeEvent } from 'react';
import { t } from 'app/i18next-t';
import { AppIcon, searchIcon } from 'app/shell/icons';
import ArmorBucketIcon from './ArmorBucketIcon';
import styles from './PickerHeader.m.scss';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';

interface Props {
  bucketOrder: number[];
  buckets: InventoryBuckets;
  isPhonePortrait: boolean;
  query: string;
  onSearchChange(event: ChangeEvent<HTMLInputElement>): void;
  scrollToBucket(bucketOrSeasonal: number | string): void;
}

function PickerHeader(props: Props) {
  const { bucketOrder, buckets, isPhonePortrait, query, onSearchChange, scrollToBucket } = props;
  // On iOS at least, focusing the keyboard pushes the content off the screen
  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  return (
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
            onChange={onSearchChange}
          />
        </div>
      </div>
      <div className={styles.tabs}>
        {bucketOrder.map((bucketId) => (
          <div key={bucketId} className={styles.tab} onClick={() => scrollToBucket(bucketId)}>
            <ArmorBucketIcon bucket={buckets.byHash[bucketId]} />
            {buckets.byHash[bucketId].name}
          </div>
        ))}
        <div className={styles.tab} onClick={() => scrollToBucket('seasonal')}>
          {t('LB.Season')}
        </div>
      </div>
    </div>
  );
}

export default PickerHeader;
