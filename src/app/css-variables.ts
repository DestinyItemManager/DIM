import { settingsSelector } from 'app/dim-api/selectors';
import { isPhonePortraitSelector } from './shell/selectors';
import { observeStore } from './utils/redux-utils';

function setCSSVariable(property: string, value: { toString(): string }) {
  if (value) {
    document.querySelector('html')!.style.setProperty(property, value.toString());
  }
}

/**
 * Update a set of CSS variables depending on the settings of the app and whether we're in portrait mode.
 */
// TODO: swap these into hooks
export default function updateCSSVariables() {
  observeStore(settingsSelector, (currentState, nextState, state) => {
    if (!currentState) {
      return;
    }

    if (currentState.itemSize !== nextState.itemSize) {
      setCSSVariable('--item-size', `${Math.max(48, nextState.itemSize)}px`);
    }
    if (currentState.charCol !== nextState.charCol && !isPhonePortraitSelector(state)) {
      setCSSVariable('--tiles-per-char-column', nextState.charCol);
    }
    if (
      currentState.charColMobile !== nextState.charColMobile &&
      // this check is needed so on start up/load this doesn't override the value set above on "normal" mode.
      isPhonePortraitSelector(state)
    ) {
      setCSSVariable('--tiles-per-char-column', nextState.charColMobile);
    }
  });

  // a subscribe on isPhonePortrait is needed when the user on mobile changes from portrait to landscape
  // or a user on desktop shrinks the browser window below isphoneportrait threshold value
  observeStore(isPhonePortraitSelector, (_prev, isPhonePortrait, state) => {
    const settings = settingsSelector(state);
    setCSSVariable(
      '--tiles-per-char-column',
      isPhonePortrait ? settings.charColMobile : settings.charCol
    );
  });

  // Set a CSS var for the true viewport height. This changes when the keyboard appears/disappears.
  // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/

  if (window.visualViewport) {
    const defineVH = () => {
      const viewport = window.visualViewport;
      const viewportHeight = Math.round(viewport.height);
      setCSSVariable('--viewport-height', `${viewportHeight}px`);
      // The amount the bottom of the visual viewport is offset from the layout viewport
      setCSSVariable(
        '--viewport-bottom-offset',
        `${window.innerHeight - (viewportHeight + Math.round(viewport.offsetTop))}px`
      );
    };
    defineVH();
    window.visualViewport.addEventListener('resize', defineVH);
  } else {
    const defineVH = () => {
      setCSSVariable('--viewport-height', `${window.innerHeight}px`);
    };
    defineVH();
    window.addEventListener('resize', defineVH);
  }
}
