import React from 'react';
import styles from './PageWithMenu.m.scss';
import classNames from 'classnames';
import { scrollToHref } from './scroll';

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
  anchor,
  ...otherProps
}: {
  children: React.ReactNode;
  className?: string;
  /** An optional string ID of a section to scroll into view when this is clicked. */
  anchor?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const classes = classNames(className, styles.menuButton);
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
