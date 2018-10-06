import { library } from '@fortawesome/fontawesome-svg-core';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faMinusSquare, faPlusSquare } from '@fortawesome/free-regular-svg-icons';
import {
  faArrowCircleUp,
  faBars,
  faCheckCircle,
  faCog,
  faDownload,
  faEraser,
  faSave,
  faSearch,
  faSignInAlt,
  faSignOutAlt,
  faStar,
  faSync,
  faThumbsUp,
  faTimes,
  faTimesCircle,
  faUpload
} from '@fortawesome/free-solid-svg-icons';

// necessary while angular code still lives
library.add(
  faTwitter,

  faMinusSquare,
  faPlusSquare,

  faArrowCircleUp,
  faBars,
  faCheckCircle,
  faCog,
  faDownload,
  faEraser,
  faSave,
  faSearch,
  faSignInAlt,
  faSignOutAlt,
  faStar,
  faSync,
  faThumbsUp,
  faTimes,
  faTimesCircle,
  faUpload
);

export {
  faArrowCircleUp as updateIcon,
  faBars as menuIcon,
  faCheckCircle as enabledIcon,
  faCog as settingsIcon,
  faDownload as downloadIcon,
  faEraser as clearIcon,
  faMinusSquare as collapseIcon,
  faPlusSquare as expandIcon,
  faSave as saveIcon,
  faSearch as searchIcon,
  faSignInAlt as signInIcon,
  faSignOutAlt as signOutIcon,
  faStar as starIcon,
  faSync as refreshIcon,
  faThumbsUp as thumbsUpIcon,
  faTimes as closeIcon,
  faTimesCircle as disabledIcon,
  faTwitter as twitterIcon,
  faUpload as revisionsIcon,
  faUpload as uploadIcon
};
