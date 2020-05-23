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
    const headerHeight = document.getElementById('header')!.clientHeight;
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
