import { setSearchQuery } from 'app/shell/actions';
import { AppIcon, searchIcon } from 'app/shell/icons';
import React from 'react';
import { useDispatch } from 'react-redux';
import styles from './SetFilterButton.m.scss';

export function SetFilterButton({ filter }: { filter: string }) {
  const dispatch = useDispatch();
  return (
    <a
      onClick={() => {
        dispatch(setSearchQuery(filter));
      }}
      title={filter}
      className={styles.setFilterButton}
    >
      <AppIcon icon={searchIcon} />
    </a>
  );
}
