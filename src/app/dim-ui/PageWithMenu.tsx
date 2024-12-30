import useResizeObserver from '@react-hook/resize-observer';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import styles from './PageWithMenu.m.scss';

function PageWithMenu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx(className, styles.page)}>{children}</div>;
}

/** Detect the presence of scrollbars that take up space. This may only work in this particular case! */
function useHasScrollbars(ref: React.RefObject<HTMLDivElement | null>) {
  const [hasScrollbars, setHasScrollbars] = useState(false);

  useResizeObserver(ref, () => {
    const elem = ref.current;
    if (!elem) {
      return;
    }
    setHasScrollbars(elem.clientWidth < elem.offsetWidth);
  });

  return hasScrollbars;
}

/** A sidebar menu. This gets displayed inline on mobile. */
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

/** The main contents of the page, displayed beside the menu on desktop and below the menu on mobile. */
PageWithMenu.Contents = function Contents({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx(className, styles.contents)}>
      <ErrorBoundary name="pageWithMenu-contents">{children}</ErrorBoundary>
    </div>
  );
};

/** A header for a section of links (MenuButtons) within a Menu. */
PageWithMenu.MenuHeader = function MenuHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(className, styles.menuHeader)}>{children}</div>;
};

/**
 * A link into a section of the page, to be displayed in the menu. The page
 * will smoothly scroll to the given anchor name.
 */
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
    <a className={classes} href={`#${anchor}`} {...otherProps}>
      {children}
    </a>
  ) : (
    <a className={classes} {...otherProps}>
      {children}
    </a>
  );
};

export default PageWithMenu;
