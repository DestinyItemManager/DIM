// TODO: cache intersection observer?

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { getItemImageStyles } from './ItemIcon';
import * as styles from './ItemIconPlaceholder.m.scss';
import { DimItem } from './item-types';

// We'll use a single intersection observer instead of one per item, roughly following the strategy
// from https://github.com/thebuilder/react-intersection-observer/blob/master/src/observe.ts
const elements = new WeakMap<Element, () => void>();
const observer =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const elem = entry.target;
              const callback = elements.get(elem);
              if (callback) {
                callback();
                elements.delete(elem);
                observer.unobserve(elem);
              }
            }
          }
        },
        {
          root: null,
          rootMargin: '16px',
          threshold: 0,
        },
      )
    : {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        observe: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        unobserve: () => {},
      };

/**
 * A placeholder div that's the same size as our icon, which is replaced by its
 * children when it is roughly onscreen. This is to work around a major
 * performance regression on iOS Safari 15 where rendering image tags hangs the
 * browser.
 */
export default function ItemIconPlaceholder({
  item,
  children,
  hasBadge,
}: {
  item: DimItem;
  children: React.ReactNode;
  hasBadge: boolean;
}) {
  const [visible, setVisible] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const elem = ref.current;
    if (!elem) {
      return;
    }

    elements.set(elem, () => setVisible(true));
    observer.observe(elem);
    return () => observer.unobserve(elem);
  }, []);

  return visible ? (
    <>{children}</>
  ) : (
    <div
      className={clsx(getItemImageStyles(item), { [styles.placeholderBadge]: hasBadge })}
      ref={ref}
    />
  );
}
