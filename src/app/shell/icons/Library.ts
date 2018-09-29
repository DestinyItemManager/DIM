import { library } from '@fortawesome/fontawesome-svg-core';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faMinusSquare, faPlusSquare } from '@fortawesome/free-regular-svg-icons';
import {
  faArrowCircleUp,
  faBars,
  faCog,
  faSearch,
  faSignOutAlt,
  faStar,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

// necessary while angular code still lives
library.add(
  faTwitter,

  faMinusSquare,
  faPlusSquare,

  faArrowCircleUp,
  faBars,
  faCog,
  faSearch,
  faSignOutAlt,
  faStar,
  faTimes
);

export {
  faArrowCircleUp as updateIcon,
  faBars as menuIcon,
  faCog as settingsIcon,
  faMinusSquare as collapseIcon,
  faPlusSquare as expandIcon,
  faSearch as searchIcon,
  faSignOutAlt as signOutIcon,
  faStar as starIcon,
  faTimes as closeIcon,
  faTwitter as twitterIcon
};
