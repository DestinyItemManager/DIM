import React from 'react';
import styles from './PageWithMenu.m.scss';
import clsx from 'clsx';
import { scrollToHref } from './scroll';

const PageWithMenu = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={clsx(className, styles.page)}>{children}</div>;

PageWithMenu.Menu = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={clsx(className, styles.menu)}>{children}</div>;

PageWithMenu.Contents = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={clsx(className, styles.contents)}>{children}</div>;

PageWithMenu.MenuHeader = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={clsx(className, styles.menuHeader)}>{children}</div>;

PageWithMenu.MenuButton = ({
  children,
  className,
  anchor,
  ...otherProps
}: {
  children: React.ReactNode;
  className?: string;
  /** An optional string ID of a section to scroll into view when this is clicked. */
  anchor?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const classes = clsx(className, styles.menuButton);
  return anchor ? (
    <a className={classes} href={`#${anchor}`} onClick={scrollToHref} {...otherProps}>
      {children}
    </a>
  ) : (
    <a className={classes} {...otherProps}>
      {children}
    </a>
  );
};

export default PageWithMenu;
