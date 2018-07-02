import store from './store/store';
import { Settings } from './settings/settings';
import { RootState } from './store/reducers';
import { isPhonePortraitStream, isPhonePortrait } from './mediaQueries';

function setCSSVariable(property: string, value: any) {
  document.querySelector('html')!.style.setProperty(property, value.toString());
}

function observeStore<T>(
  select: (state: RootState) => T,
  onChange: (currentState: T, newState: T) => void
) {
  let currentState;

  function handleChange() {
    const nextState = select(store.getState());
    if (nextState !== currentState) {
      onChange(currentState, nextState);
      currentState = nextState;
    }
  }

  const unsubscribe = store.subscribe(handleChange);
  handleChange();
  return unsubscribe;
}

/**
 * Update a set of CSS variables depending on the settings of the app and whether we're in portrait mode.
 */
export default function updateCSSVariables() {
  observeStore(
    (state) => state.settings.settings as Settings,
    (currentState, nextState) => {
      if (currentState.itemSize !== nextState.itemSize) {
        setCSSVariable('--item-size', `${nextState.itemSize}px`);
      }
      if (currentState.charCol !== nextState.charCol) {
        if (!isPhonePortrait()) {
          setCSSVariable('--character-columns', nextState.charCol);
        }
      }
      if (currentState.vaultMaxCol !== nextState.vaultMaxCol) {
        setCSSVariable('--vault-max-columns', nextState.vaultMaxCol);
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
    const settings = store.getState().settings.settings as Settings;
    setCSSVariable(
      '--character-columns',
      isPhonePortrait ? settings.charColMobile : settings.charCol
    );
  });
}
