import clsx from 'clsx';
import React from 'react';
import styles from './PageWithMenu.m.scss';
import { scrollToHref } from './scroll';

function PageWithMenu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx(className, styles.page)}>{children}</div>;
}

PageWithMenu.Menu = function ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx(className, styles.menu)}>
      <div>{children}</div>
    </div>
  );
};

PageWithMenu.Contents = function ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(className, styles.contents)}>{children}</div>;
};

PageWithMenu.MenuHeader = function ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(className, styles.menuHeader)}>{children}</div>;
};

PageWithMenu.MenuButton = function ({
  children,
  className,
  anchor,
  ...otherProps
}: {
  children: React.ReactNode;
  className?: string;
  /** An optional string ID of a section to scroll into view when this is clicked. */
  anchor?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
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
