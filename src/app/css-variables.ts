import { OrnamentDisplay } from '@destinyitemmanager/dim-api-types';
import { settingsSelector } from 'app/dim-api/selectors';
import { deepEqual } from 'fast-equals';
import { isPhonePortraitSelector } from './shell/selectors';
import { StoreObserver } from './store/observerMiddleware';

/**
 * Visual viewport diffs greater than this value will cause --viewport-bottom-offset
 * to be set. A threshold of 50px accounts for full size keyboards as well as the
 * iPad layout that only shows the predictive text bar.
 */
const KEYBOARD_THRESHOLD = 50;

function setCSSVariable(property: string, value: { toString: () => string }) {
  if (value !== undefined && value !== null) {
    document.querySelector('html')!.style.setProperty(property, value.toString());
  }
}

export function createItemSizeObserver(): StoreObserver<number> {
  return {
    id: 'item-size-observer',
    getObserved: (rs) => settingsSelector(rs).itemSize,
    sideEffect: ({ current }) => {
      setCSSVariable('--item-size', `${Math.max(48, current)}px`);
    },
  };
}

export function createOrnamentDisplayObserver(): StoreObserver<OrnamentDisplay> {
  return {
    id: 'ornament-display-observer',
    getObserved: (rs) => settingsSelector(rs).ornamentDisplay,
    sideEffect: ({ current }) => {
      setCSSVariable('--ornament-display-opacity', current === OrnamentDisplay.All ? 1 : 0);
      setCSSVariable(
        '--ornament-display-visibility',
        current === OrnamentDisplay.All ? 'auto' : 'hidden',
      );
      setCSSVariable(
        '--ornament-display-visibility-inverse',
        current === OrnamentDisplay.All ? 'hidden' : 'auto',
      );
    },
  };
}

export function createThemeObserver(): StoreObserver<{ theme: string; isPhonePortrait: boolean }> {
  return {
    id: 'theme-observer',
    equals: deepEqual,
    getObserved: (rs) => ({
      theme: settingsSelector(rs).theme,
      isPhonePortrait: isPhonePortraitSelector(rs),
    }),
    sideEffect: ({ current }) => {
      // Set a class on the body to control the theme. This must be applied on the body for syncThemeColor to work.
      const themeClass = `theme-${current.theme}`;
      document.body.className = themeClass;
      syncThemeColor(current.isPhonePortrait);
    },
  };
}

export function createTilesPerCharColumnObserver(): StoreObserver<number> {
  return {
    id: 'tiles-per-char-column-observer',
    runInitially: true,
    getObserved: (rs) =>
      isPhonePortraitSelector(rs)
        ? settingsSelector(rs).charColMobile
        : settingsSelector(rs).charCol,
    sideEffect: ({ current }) => {
      setCSSVariable('--tiles-per-char-column', current);
    },
  };
}

/**
 * Update a set of CSS variables depending on the settings of the app and whether we're in portrait mode.
 */
export function setCssVariableEventListeners() {
  // Set a CSS var for the true viewport height. This changes when the keyboard appears/disappears.
  // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/

  if (window.visualViewport) {
    const defineVH = () => {
      const viewport = window.visualViewport!;
      const viewportHeight = Math.round(viewport.height);
      setCSSVariable('--viewport-height', `${viewportHeight}px`);
      /**
       * The amount the bottom of the visual viewport is offset from the layout viewport
       * This is calculated so elements such as sheets are not hidden by the keyboard.
       * However, other viewport changes such as a scrollbar appearing can cause the visual
       * viewport to change. As a result, we only apply the following CSS Variable if the
       * viewport size change is large enough (such as when the keyboard opens).
       */
      const bottomOffset = Math.max(
        0,
        window.innerHeight - (viewportHeight + Math.round(viewport.offsetTop)),
      );

      // bottomOffset === 0 means the visual viewport has been reset to its initial size
      if (bottomOffset === 0 || bottomOffset >= KEYBOARD_THRESHOLD) {
        setCSSVariable('--viewport-bottom-offset', `${bottomOffset}px`);
      }
    };
    defineVH();
    window.visualViewport.addEventListener('resize', () => defineVH());
    window.visualViewport.addEventListener('scroll', () => defineVH());
  } else {
    const defineVH = () => {
      setCSSVariable('--viewport-height', `${window.innerHeight}px`);
    };
    defineVH();
    window.addEventListener('resize', defineVH);
  }

  const defineScrollbarWidth = () => {
    // Set a css var for the width of a scrollbar
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'scrollbar-measure';
    scrollDiv.style.width = '100px';
    scrollDiv.style.height = '100px';
    scrollDiv.style.overflow = 'scroll';
    scrollDiv.style.position = 'absolute';
    scrollDiv.style.top = '-9999px';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

    // Delete the div
    document.body.removeChild(scrollDiv);
    setCSSVariable('--scrollbar-width', `${scrollbarWidth}px`);
  };
  defineScrollbarWidth();
  window.addEventListener('resize', defineScrollbarWidth);
}

/**
 * Read the --theme-pwa-background CSS variable and use it to set the meta theme-color element.
 */
function syncThemeColor(isPhonePortrait: boolean) {
  let background = getComputedStyle(document.body).getPropertyValue('--theme-pwa-background');

  // Extract tint from mobile header on mobile devices to match notch/dynamic island fill
  if (isPhonePortrait) {
    background = getComputedStyle(document.body).getPropertyValue('--theme-mobile-background');
  }

  if (background) {
    const metaElem = document.querySelector("meta[name='theme-color']");
    if (metaElem) {
      metaElem.setAttribute('content', background);
    }
  }
}
