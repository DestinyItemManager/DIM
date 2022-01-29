import { DimItem } from 'app/inventory-stores/item-types';
import styles from './ItemPop.m.scss';

/**
 * Cross browser safe scrollTo implementation.
 */
export function scrollToPosition(options: ScrollToOptions) {
  const isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
  if (isSmoothScrollSupported) {
    window.scroll(options);
  } else {
    document.scrollingElement!.scrollTop = options.top!;
  }
}

/**
 * Scroll a particular element to the top of the view.
 */
export function scrollToElement(elem: Element | null) {
  if (elem) {
    const headerHeight = parseInt(
      document.querySelector('html')!.style.getPropertyValue('--header-height'),
      10
    );
    const rect = elem.getBoundingClientRect();
    scrollToPosition({
      top: window.scrollY + rect.top - (headerHeight + 6),
      left: 0,
      behavior: 'smooth',
    });
  }
}

/**
 * An event handler for link (a) elements which scrolls the window until the element whose ID matches
 * the hash of the link is in view.
 */
export function scrollToHref(e: React.MouseEvent) {
  e.preventDefault();
  const elem = document.getElementById((e.currentTarget as HTMLAnchorElement).hash.slice(1));
  scrollToElement(elem);
}

/**
 * Scroll to an item tile and make it briefly zoom/wobble for attention
 */
export const itemPop = (item: DimItem) => {
  // TODO: this is tough to do with an ID since we'll have multiple
  const element = document.getElementById(item.index)?.parentNode as HTMLElement;
  if (!element) {
    throw new Error(`No element with id ${item.index}`);
  }
  const elementRect = element.getBoundingClientRect();
  const html = document.querySelector('html')!;
  const headerHeight = parseInt(html.style.getPropertyValue('--header-height'), 10);
  const storeHeaderHeight = parseInt(html.style.getPropertyValue('--store-header-height'), 10);
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  scrollToPosition({ left: 0, top: absoluteElementTop - (headerHeight + storeHeaderHeight + 24) });
  element.classList.add(styles.itemPop);

  const removePop = () => {
    element.classList.remove(styles.itemPop);
    for (const event of ['webkitAnimationEnd', 'oanimationend', 'msAnimationEnd', 'animationend']) {
      element.removeEventListener(event, removePop);
    }
  };

  for (const event of ['webkitAnimationEnd', 'oanimationend', 'msAnimationEnd', 'animationend']) {
    element.addEventListener(event, removePop);
  }
};
