import React from 'react';
import styles from './PageWithMenu.m.scss';

const PageWithMenu = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.page}>{children}</div>
);

PageWithMenu.Menu = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.menu}>{children}</div>
);

PageWithMenu.Contents = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.contents}>{children}</div>
);

export default PageWithMenu;
