import { settingsSelector } from 'app/dim-api/selectors';
import { deepEqual } from 'fast-equals';
import { isPhonePortraitSelector } from './shell/selectors';
import { StoreObserver } from './store/observerMiddleware';

function setCSSVariable(property: string, value: { toString: () => string }) {
  if (value) {
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
      // The amount the bottom of the visual viewport is offset from the layout viewport
      setCSSVariable(
        '--viewport-bottom-offset',
        `${window.innerHeight - (viewportHeight + Math.round(viewport.offsetTop))}px`,
      );
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
