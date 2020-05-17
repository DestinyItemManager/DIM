import React, { ChangeEvent } from 'react';
import { t } from 'app/i18next-t';
import { AppIcon, searchIcon } from 'app/shell/icons';
import styles from './ModPickerHeader.m.scss';

interface Props {
  categoryOrder?: { category: number | 'seasonal'; translatedName: string }[];
  isPhonePortrait: boolean;
  query: string;
  onSearchChange(event: ChangeEvent<HTMLInputElement>): void;
  scrollToBucket(bucketOrSeasonal: number | string): void;
}

function ModPickerHeader(props: Props) {
  const { categoryOrder, isPhonePortrait, query, onSearchChange, scrollToBucket } = props;
  // On iOS at least, focusing the keyboard pushes the content off the screen
  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  return (
    <div>
      <h1>{t('LB.ChooseAMod')}</h1>
      <div className="item-picker-search">
        <div className="search-filter" role="search">
          <AppIcon icon={searchIcon} />
          <input
            className="filter-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            autoFocus={autoFocus}
            placeholder={t('LB.SearchAMod')}
            type="text"
            name="filter"
            value={query}
            onChange={onSearchChange}
          />
        </div>
      </div>
      <div className={styles.tabs}>
        {categoryOrder?.map((category) => (
          <div
            key={category.category}
            className={styles.tab}
            onClick={() => scrollToBucket(category.category)}
          >
            {/* t('LB.Helmet') t('LB.Gauntlets') t('LB.Chest') t('LB.Legs') t('LB.ClassItem') t('LB.General') t('LB.Seasonal') */}
            {category.translatedName}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModPickerHeader;
