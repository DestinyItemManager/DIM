import { library } from '@fortawesome/fontawesome-svg-core';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowAltCircleUp,
  faMinusSquare,
  faPlusSquare,
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
  faMagic,
  faLevelUpAlt,
  faBan,
  faUndo,
  faPencilAlt
} from '@fortawesome/free-solid-svg-icons';

import { dimEngramIcon, dimPowerIcon, dimPowerAltIcon } from './custom';

// necessary while angular code still lives
library.add(
  faTwitter,

  faArrowAltCircleUp,
  faMinusSquare,
  faPlusSquare,
  faTrashAlt,

  faArrowCircleUp,
  faBan,
  faBars,
  faCheckCircle,
  faCog,
  faDownload,
  faEnvelope,
  faEraser,
  faLevelUpAlt,
  faMagic,
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
  faCog as settingsIcon,
  faDownload as downloadIcon,
  faEnvelope as makeRoomIcon,
  faEraser as clearIcon,
  faLevelUpAlt as levellingIcon,
  faMagic as maximizePowerIcon,
  faMinusSquare as collapseIcon,
  faPencilAlt as editIcon,
  faPlusSquare as expandIcon,
  faPlusCircle as addIcon,
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
