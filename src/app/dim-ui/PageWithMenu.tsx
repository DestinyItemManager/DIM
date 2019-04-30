import React from 'react';
import styles from './PageWithMenu.m.scss';
import classNames from 'classnames';

const PageWithMenu = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={classNames(className, styles.page)}>{children}</div>;

PageWithMenu.Menu = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={classNames(className, styles.menu)}>{children}</div>;

PageWithMenu.Contents = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={classNames(className, styles.contents)}>{children}</div>;

export default PageWithMenu;
