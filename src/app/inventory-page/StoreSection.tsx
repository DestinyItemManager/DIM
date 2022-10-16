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
      <div className={clsx('store-row', styles.title)}>{title}</div>
      <div>{children}</div>
    </>
  );
}
