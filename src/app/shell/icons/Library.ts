import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowCircleUp,
  faBars,
  faCog,
  faSearch,
  faSignOutAlt,
  faStar,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { faMinusSquare, faPlusSquare } from '@fortawesome/free-regular-svg-icons';

library.add(faArrowCircleUp, faBars, faCog, faSearch, faSignOutAlt, faTimes);

export {
  faArrowCircleUp as updateIcon,
  faBars as menuIcon,
  faCog as settingsIcon,
  faMinusSquare as collapseIcon,
  faPlusSquare as expandIcon,
  faSearch as searchIcon,
  faSignOutAlt as signOutIcon,
  faStar as starIcon,
  faTimes as closeIcon
};
