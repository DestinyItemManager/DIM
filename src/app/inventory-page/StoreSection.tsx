import clsx from 'clsx';
import React from 'react';
import '../dim-ui/CollapsibleTitle.scss';
import styles from './StoreSection.m.scss';

/** Non-Postmaster Store section */
export default function StoreSection({
  title,
  children,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className="store-row">
        <div className={clsx(styles.title)}>
          <span className={styles.handle}>
            <span>{title}</span>
          </span>
        </div>
      </div>
      <div>{children}</div>
    </>
  );
}
