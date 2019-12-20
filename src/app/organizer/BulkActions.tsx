import React from 'react';
import styles from './BulkActions.m.scss';
import { AppIcon, lockIcon } from 'app/shell/icons';
import { Row } from 'react-table';
import { DimItem } from 'app/inventory/item-types';

function BulkActions({
  selectedFlatRows,
  onLock
}: {
  selectedFlatRows: Row<DimItem>[];
  onLock(e: any): Promise<void>;
}) {
  return (
    <div className={styles.bulkActions}>
      <button
        className="dim-button"
        disabled={selectedFlatRows.length === 0}
        name="lock"
        onClick={onLock}
      >
        Lock <AppIcon icon={lockIcon} />
      </button>
      <button
        className="dim-button"
        disabled={selectedFlatRows.length === 0}
        name="unlock"
        onClick={onLock}
      >
        Unlock <AppIcon icon={lockIcon} />
      </button>
      <button className="dim-button" disabled={selectedFlatRows.length === 0}>
        Tag
      </button>
      <button className="dim-button" disabled={selectedFlatRows.length === 0}>
        Move To
      </button>
    </div>
  );
}

export default BulkActions;
