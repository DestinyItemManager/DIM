import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowCircleUp,
  faBars,
  faCog,
  faSearch,
  faSignOutAlt,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

library.add(faArrowCircleUp, faBars, faCog, faSearch, faSignOutAlt, faTimes);

export {
  faArrowCircleUp as updateIcon,
  faBars as menuIcon,
  faCog as settingsIcon,
  faSearch as searchIcon,
  faSignOutAlt as signOutIcon,
  faTimes as closeIcon
};
