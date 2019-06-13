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

PageWithMenu.MenuHeader = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={classNames(className, styles.menuHeader)}>{children}</div>;

PageWithMenu.MenuButton = ({
  children,
  className,
  ...otherProps
}: {
  children: React.ReactNode;
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a className={classNames(className, styles.menuButton)} {...otherProps}>
    {children}
  </a>
);

export default PageWithMenu;
