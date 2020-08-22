import React from 'react';
import { DimItem } from '../inventory/item-types';
import { D2ItemUserReview } from './d2-dtr-api-types';
import { D1ItemUserReview } from './d1-dtr-api-types';
import {
  AppIcon,
  thumbsUpIcon,
  thumbsDownIcon,
  faFlag,
  faPenSquare,
  faExclamationTriangle,
  banIcon,
} from '../shell/icons';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { StarRatingDisplay } from '../shell/star-rating/StarRatingDisplay';
import { D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';
import { translateReviewMode } from './reviewModeTranslator';
import { PLATFORM_LABELS } from '../accounts/destiny-account';
import { getIgnoredUsers } from 'app/destinyTrackerApi/userFilter';
import { DtrD2ActivityModes } from '@destinyitemmanager/dim-api-types';

interface Props {
  item: DimItem;
  review: D2ItemUserReview | D1ItemUserReview;
  reviewModeOptions?: D2ReviewMode[];
  onEditReview(review: D2ItemUserReview | D1ItemUserReview): void;
  onReportReview(review: D2ItemUserReview | D1ItemUserReview): void;
}

interface State {
  flagged?: boolean;
  reportSent?: boolean;
}

async function isIgnoredUser(review: D2ItemUserReview | D1ItemUserReview): Promise<boolean> {
  const ignoredUsers = await getIgnoredUsers();

  return Boolean(ignoredUsers.find((iu) => iu === review.reviewer.membershipId));
}

/** A single item review. */
export default class ItemReview extends React.Component<Props, State> {
  state: State = {};

  async componentDidMount() {
    if (!this.state.flagged && (await isIgnoredUser(this.props.review))) {
      this.setState({ reportSent: true });
    }
  }

  render() {
    const { item, review, reviewModeOptions } = this.props;
    const { flagged, reportSent } = this.state;

    const reviewText = isD2Review(item, review) ? review.text : review.review;

    if (!reviewText || reviewText.length === 0 || reportSent) {
      return null;
    }

    return (
      <div className="community-review">
        <div>
          <div
            className={clsx({
              'link community-review--clickable': review.isReviewer,
            })}
            onClick={this.editReview}
          >
            <div className="community-review--who">
              <div>
                {isD1Review(item, review) ? (
                  <StarRatingDisplay rating={review.rating} />
                ) : review.voted === 1 ? (
                  <span className="community-review--thumbs-up">
                    <AppIcon icon={thumbsUpIcon} />
                  </span>
                ) : (
                  review.voted === -1 && (
                    <span className="community-review--thumbs-down">
                      <AppIcon icon={thumbsDownIcon} />
                    </span>
                  )
                )}{' '}
                <span
                  className={clsx('community-review--review-author', {
                    'community-review--who__special': review.isHighlighted,
                  })}
                >
                  {review.reviewer.displayName}
                </span>{' '}
                <span className="community-review--days-ago">
                  {daysAgo(review.timestamp, PLATFORM_LABELS[review.reviewer.membershipType])}
                </span>
              </div>
              {!item.isVendorItem && !reportSent && (
                <a
                  className="community-review--clickable"
                  onClick={review.isReviewer ? this.editReview : this.openFlagContext}
                >
                  <AppIcon icon={review.isReviewer ? faPenSquare : faFlag} />
                </a>
              )}
            </div>
            {isD2Review(item, review) &&
              reviewModeOptions &&
              review.mode !== DtrD2ActivityModes.notSpecified && (
                <div className="community-review--game-mode">
                  {t('DtrReview.ForGameMode', {
                    mode: translateReviewMode(reviewModeOptions, review),
                  })}
                </div>
              )}
            <div className="community-review--review">{reviewText}</div>
          </div>
          {flagged && !reportSent && (
            <div className="community-revew--report-container">
              <div className="community-review--report">
                <AppIcon icon={faExclamationTriangle} />
                {t('DtrReview.VerifyReport')}
              </div>
              <div className="community-review--report-buttons">
                <button
                  type="button"
                  className="dim-button community-review--report-yes"
                  onClick={this.reportReview}
                >
                  <AppIcon icon={faFlag} /> {t('DtrReview.ReallyReport')}
                </button>
                <button
                  type="button"
                  className="dim-button community-review--report-cancel"
                  onClick={this.closeFlagContext}
                >
                  <AppIcon icon={banIcon} /> {t('DtrReview.Cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  private editReview = () => {
    const { review, onEditReview } = this.props;
    if (!review.isReviewer) {
      return;
    }

    onEditReview(review);
  };

  private openFlagContext = () => {
    const { review } = this.props;

    if (review.isReviewer || review.isHighlighted) {
      return;
    }

    this.setState({ flagged: true });
  };

  private closeFlagContext = () => {
    this.setState({ flagged: false });
  };

  private reportReview = () => {
    const { onReportReview } = this.props;
    const { reportSent } = this.state;
    if (!reportSent) {
      this.setState({ reportSent: true });

      const { review } = this.props;
      onReportReview(review);
    }
  };
}

export function isD1Review(
  item: DimItem,
  _review: D2ItemUserReview | D1ItemUserReview
): _review is D1ItemUserReview {
  return item.isDestiny1();
}

export function isD2Review(
  item: DimItem,
  _review: D2ItemUserReview | D1ItemUserReview
): _review is D2ItemUserReview {
  return item.isDestiny2();
}

function daysAgo(timestamp: Date, platform: string) {
  const days = Math.floor((Date.now() - timestamp.getTime()) / (24 * 60 * 60 * 1000));
  return (
    <span title={timestamp.toLocaleDateString()}>
      {t('DtrReview.DaysAgo', { count: days, platform })}
    </span>
  );
}
