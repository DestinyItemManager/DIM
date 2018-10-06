import { library } from '@fortawesome/fontawesome-svg-core';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowAltCircleUp,
  faCheckCircle as faCheckCircleRegular,
  faCircle as faCircleRegular,
  faMinusSquare,
  faPlusSquare,
  faQuestionCircle,
  faTrashAlt
} from '@fortawesome/free-regular-svg-icons';
import {
  faArrowCircleUp,
  faBars,
  faCheckCircle,
  faCog,
  faDownload,
  faEnvelope,
  faEraser,
  faPlusCircle,
  faSave,
  faSearch,
  faSignInAlt,
  faSignOutAlt,
  faStar,
  faSync,
  faThumbsUp,
  faTimes,
  faTimesCircle,
  faUpload,
  faLevelUpAlt,
  faBan,
  faUndo,
  faPencilAlt,
  faChevronCircleDown
} from '@fortawesome/free-solid-svg-icons';

import { dimEngramIcon, dimPowerIcon, dimPowerAltIcon } from './custom';

// TODO: remove when Angular is out and all icons are imported
//       in JS
library.add(
  faTwitter,

  faArrowAltCircleUp,
  faCheckCircleRegular,
  faCircleRegular,
  faMinusSquare,
  faPlusSquare,
  faQuestionCircle,
  faTrashAlt,

  faArrowCircleUp,
  faBan,
  faBars,
  faCheckCircle,
  faChevronCircleDown,
  faCog,
  faDownload,
  faEnvelope,
  faEraser,
  faLevelUpAlt,
  faPencilAlt,
  faPlusCircle,
  faSave,
  faSearch,
  faSignInAlt,
  faSignOutAlt,
  faStar,
  faSync,
  faThumbsUp,
  faTimes,
  faTimesCircle,
  faUndo,
  faUpload,

  dimEngramIcon,
  dimPowerIcon,
  dimPowerAltIcon
);

export {
  dimEngramIcon as engramIcon,
  dimPowerIcon as powerIndicatorIcon,
  dimPowerAltIcon as powerActionIcon,
  faArrowAltCircleUp as raiseReputationIcon,
  faArrowCircleUp as updateIcon,
  faBan as banIcon,
  faBars as menuIcon,
  faCheckCircle as enabledIcon,
  faCheckCircle as redeemedIcon,
  faCheckCircleRegular as completedIcon,
  faChevronCircleDown as openDropdownIcon,
  faCircleRegular as uncompletedIcon,
  faCog as settingsIcon,
  faDownload as downloadIcon,
  faEnvelope as sendIcon,
  faEraser as clearIcon,
  faLevelUpAlt as levellingIcon,
  faMinusSquare as collapseIcon,
  faPencilAlt as editIcon,
  faPlusSquare as expandIcon,
  faPlusCircle as addIcon,
  faQuestionCircle as helpIcon,
  faSave as saveIcon,
  faSearch as searchIcon,
  faSignInAlt as signInIcon,
  faSignOutAlt as signOutIcon,
  faStar as starIcon,
  faSync as refreshIcon,
  faThumbsUp as thumbsUpIcon,
  faTimes as closeIcon,
  faTimesCircle as disabledIcon,
  faTrashAlt as deleteIcon,
  faTwitter as twitterIcon,
  faUndo as undoIcon,
  faUpload as revisionsIcon,
  faUpload as uploadIcon
};
