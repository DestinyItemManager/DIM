import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { D2ItemUserReview } from './d2-dtr-api-types';
import { D1ItemUserReview } from './d1-dtr-api-types';
import { AppIcon, thumbsUpIcon, thumbsDownIcon } from '../shell/icons';
import { faPenSquare, faExclamationTriangle, faBan } from '@fortawesome/free-solid-svg-icons';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { t } from 'i18next';
import classNames from 'classnames';
import { StarRatingDisplay } from '../shell/star-rating/StarRatingDisplay';

interface Props {
  item: DimItem;
  review: D2ItemUserReview | D1ItemUserReview;
}

export default class ItemReview extends React.Component<Props> {
  render() {
    const { item, review } = this.props;

    return (
      <div className="community-review">
        {item.isDestiny1() && (
          <div>
            <div
              ng-className="{'link community-review--clickable' : review.isReviewer}"
              onClick={this.editReview(review.id)}
            >
              <div className="community-review--who">
                <StarRatingDisplay rating={review.rating} />
                <div
                  className={classNames({
                    'community-review--who__special': review.isHighlighted
                  })}
                >
                  {review.reviewer.displayName}
                </div>
                <div>{review.timestamp.toLocaleDateString()}</div>
                <a
                  className="community-review--clickable"
                  aria-hidden="true"
                  onClick={() => this.openFlagContext(review.id)}
                >
                  <AppIcon icon={review.isReviewer ? faPenSquare : faFlag} />
                </a>
              </div>
              <div className="community-review--review">{review.review}</div>
            </div>
            {toggledFlags.indexOf(review.reviewId) != -1 && (
              <div className="community-revew--report-container">
                <div className="community-review--report">
                  <AppIcon icon={faExclamationTriangle} />
                  {t('DtrReview.VerifyReport')}
                </div>
                <div className="community-review--report-buttons">
                  <button
                    className="dim-button community-review--report-yes"
                    onClick={() => this.reportReview(review.reviewId)}
                  >
                    <AppIcon icon={faFlag} />
                    {t('DtrReview.ReallyReport')}
                  </button>
                  <button
                    className="dim-button community-review--report-cancel"
                    onClick={() => this.closeFlagContext(review.reviewId)}
                  >
                    <AppIcon icon={faBan} /> {t('DtrReview.Cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {item.isDestiny2() && (
          <div>
            <div
              className={classNames({
                'link community-review--clickable': review.isReviewer
              })}
              onClick={() => this.editReview(review.id)}
            >
              <div className="community-review--who">
                {review.voted === 1 && (
                  <div>
                    <span className="community-review--thumbs-up">
                      <AppIcon icon={thumbsUpIcon} />
                    </span>
                  </div>
                )}
                {review.voted === -1 && (
                  <div>
                    <span className="community-review--thumbs-down">
                      <AppIcon icon={thumbsDownIcon} />
                    </span>
                  </div>
                )}
                <div
                  className={classNames({
                    'community-review--who__special': review.isHighlighted
                  })}
                >
                  {review.reviewer.displayName}
                </div>
                <div>{review.timestamp.toLocaleDateString()}</div>
                {!item.isVendorItem && (
                  <a
                    className="community-review--clickable"
                    aria-hidden="true"
                    onClick={() => this.openFlagContext(review.id)}
                  >
                    <AppIcon icon={review.isReviewer ? faPenSquare : faFlag} />
                  </a>
                )}
              </div>
              <div className="community-review--game-mode">
                <div className="community-review--game-mode-for">{t('DtrReview.ForGameMode')}</div>
                <div className="community-review--game-mode" ng-bind="translateReviewMode(review)">
                  {this.translateReviewMode(review)}
                </div>
              </div>
              <div className="community-review--review">{review.text}</div>
            </div>
            {toggledFlags.indexOf(review.id) !== -1 && (
              <div className="community-revew--report-container">
                <div className="community-review--report">
                  <AppIcon icon={faExclamationTriangle} />
                  {t('DtrReview.VerifyReport')}
                </div>
                <div className="community-review--report-buttons">
                  <button
                    className="dim-button community-review--report-yes"
                    onClick={() => this.reportReview(review.reviewId)}
                  >
                    <AppIcon icon={faFlag} />
                    {t('DtrReview.ReallyReport')}
                  </button>
                  <button
                    className="dim-button community-review--report-cancel"
                    onClick={() => this.closeFlagContext(review.reviewId)}
                  >
                    <AppIcon icon={faBan} /> {t('DtrReview.Cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
