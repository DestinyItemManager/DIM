import store from './store/store';
import { isPhonePortraitStream, isPhonePortrait } from './mediaQueries';
import { observeStore } from './redux-utils';

function setCSSVariable(property: string, value: any) {
  if (value) {
    document.querySelector('html')!.style.setProperty(property, value.toString());
  }
}

/**
 * Update a set of CSS variables depending on the settings of the app and whether we're in portrait mode.
 */
export default function updateCSSVariables() {
  observeStore(
    (state) => state.settings,
    (currentState, nextState) => {
      if (!currentState) {
        return;
      }

      if (currentState.itemSize !== nextState.itemSize) {
        setCSSVariable('--item-size', `${Math.max(48, nextState.itemSize)}px`);
      }
      if (currentState.charCol !== nextState.charCol) {
        if (!isPhonePortrait()) {
          setCSSVariable('--character-columns', nextState.charCol);
        }
      }
      if (currentState.charColMobile !== nextState.charColMobile) {
        // this check is needed so on start up/load this doesn't override the value set above on "normal" mode.
        if (isPhonePortrait()) {
          setCSSVariable('--character-columns', nextState.charColMobile);
        }
      }

      if ($featureFlags.colorA11y && currentState.colorA11y !== nextState.colorA11y) {
        const color = nextState.colorA11y;
        if (color && color !== '-') {
          setCSSVariable('--color-filter', `url(#${color.toLowerCase()})`);
        } else {
          document.querySelector('html')!.style.removeProperty('--color-filter');
        }
      }
    }
  );

  // a subscribe on isPhonePortraitStream is needed when the user on mobile changes from portrait to landscape
  // or a user on desktop shrinks the browser window below isphoneportrait treshold value
  isPhonePortraitStream().subscribe((isPhonePortrait) => {
    const settings = store.getState().settings;
    setCSSVariable(
      '--character-columns',
      isPhonePortrait ? settings.charColMobile : settings.charCol
    );
  });
}
