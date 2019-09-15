import React from 'react';
import { AppIcon, starIcon } from '../shell/icons';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons/faCaretDown';
import { faCaretUp } from '@fortawesome/free-solid-svg-icons/faCaretUp';
import { faMinus } from '@fortawesome/free-solid-svg-icons/faMinus';
import './RatingIcon.scss';

export default function RatingIcon({ rating }: { rating: number }) {
  if (rating === 5) {
    return <AppIcon className="godroll rating-icon" icon={starIcon} />;
  }

  if (rating < 4) {
    return <AppIcon className="dogroll rating-icon" icon={faCaretDown} />;
  }

  if (rating >= 4.7) {
    return <AppIcon className="goodroll rating-icon" icon={faCaretUp} />;
  }

  return <AppIcon className="mehroll rating-icon" icon={faMinus} />;
}
