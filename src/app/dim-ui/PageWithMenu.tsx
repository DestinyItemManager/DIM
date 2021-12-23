import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './PageWithMenu.m.scss';
import { scrollToHref } from './scroll';

function PageWithMenu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx(className, styles.page)}>{children}</div>;
}

/** Detect the presence of scrollbars that take up space. This may only work in this particular case! */
function useHasScrollbars(ref: React.RefObject<HTMLDivElement>) {
  const [hasScrollbars, setHasScrollbars] = useState(false);

  const updateResize = useCallback(() => {
    if (ref.current) {
      setHasScrollbars(ref.current.clientWidth < ref.current.offsetWidth);
    }
  }, [ref]);

  useEffect(() => {
    updateResize();
  });

  useEffect(() => {
    window.addEventListener('resize', updateResize);
    return () => window.removeEventListener('resize', updateResize);
  });
  return hasScrollbars;
}

PageWithMenu.Menu = function Menu({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasScrollbars = useHasScrollbars(ref);
  return (
    <div
      ref={ref}
      className={clsx(className, styles.menu, { [styles.menuScrollbars]: hasScrollbars })}
    >
      <div>{children}</div>
    </div>
  );
};

PageWithMenu.Contents = function Contents({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(className, styles.contents)}>{children}</div>;
};

PageWithMenu.MenuHeader = function MenuHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(className, styles.menuHeader)}>{children}</div>;
};

PageWithMenu.MenuButton = function MenuButton({
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
