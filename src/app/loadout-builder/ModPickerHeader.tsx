import React, { ChangeEvent } from 'react';
import { t } from 'app/i18next-t';
import { AppIcon, searchIcon } from 'app/shell/icons';
import styles from './ModPickerHeader.m.scss';

interface Props {
  categoryOrder?: { category: number | 'seasonal'; nameTranslation: string }[];
  isPhonePortrait: boolean;
  query: string;
  onSearchChange(event: ChangeEvent<HTMLInputElement>): void;
  scrollToBucket(bucketOrSeasonal: number | string): void;
}

function PickerHeader(props: Props) {
  const { categoryOrder, isPhonePortrait, query, onSearchChange, scrollToBucket } = props;
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
        {categoryOrder?.map((category) => (
          <div
            key={category.category}
            className={styles.tab}
            onClick={() => scrollToBucket(category.category)}
          >
            {t(category.nameTranslation)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PickerHeader;
