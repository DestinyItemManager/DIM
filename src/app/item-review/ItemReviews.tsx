import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { RootState } from '../store/reducers';
import { t } from 'i18next';
import './item-review.scss';
import { connect } from 'react-redux';
import { AppIcon, thumbsUpIcon, thumbsDownIcon } from '../shell/icons';
import { setSetting } from '../settings/actions';
import { getRating } from './reducer';
import { D2RatingData, D2ItemUserReview } from './d2-dtr-api-types';
import { D1RatingData, D1ItemUserReview } from './d1-dtr-api-types';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import ItemReview from './ItemReview';
import ItemReviewSettings from './ItemReviewSettings';
import { StarRatingEditor } from '../shell/star-rating/StarRatingEditor';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  canReview: boolean;
  dtrRating?: D2RatingData | D1RatingData;
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  const settings = state.settings;
  return {
    canReview: settings.allowIdPostToDtr,
    dtrRating: getRating(item, state.reviews.ratings)
  };
}

const mapDispatchToProps = {
  setSetting
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

class ItemReviews extends React.Component<Props> {
  render() {
    const { canReview, item, dtrRating } = this.props;

    if (!$featureFlags.reviewsEnabled) {
      return null;
    }

    // TODO: "your review"

    // TODO: plumb up "edit review" for your review?

    return (
      <div>
        {!canReview && <ItemReviewSettings item={item} />}

        {canCreateReview && (
          <div className="user-review--header">
            <span>{t('DtrReview.YourReview')}</span>

            {item.isDestiny2() ? (
              <div className="user-review--thumbs">
                <div className="user-review--thumbs-up link" onClick={this.thumbsUp}>
                  <span className="user-review--thumbs-up-button">
                    <AppIcon
                      icon={
                        dtrRating && dtrRating.userReview.voted === 1 ? thumbsUpIcon : faThumbsUp
                      }
                    />
                  </span>
                </div>

                <div className="user-review--thumbs-down">
                  <span className="user-review--thumbs-down-button" onClick={this.thumbsDown}>
                    <AppIcon
                      icon={
                        dtrRating && dtrRating.userReview.voted === -1
                          ? thumbsDownIcon
                          : faThumbsDown
                      }
                    />
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <StarRatingEditor
                  rating={dtrRating.userReview.rating}
                  onRatingChange={this.setRating}
                />
              </div>
            )}

            {expandReview && (
              <span ng-show="expandReview">
                <button className="dim-button" onClick={this.submitReview}>
                  {t('DtrReview.Submit')}
                </button>
                <button className="dim-button" onClick={this.toggleEdit}>
                  {t('DtrReview.Cancel')}
                </button>
              </span>
            )}
          </div>
        )}

        {canReview && expandReview && (
          <div className="community-review--details">
            {item.isDestiny2() && (
              <div className="community-review--mode">
                <label htmlFor="reviewMode">{t('DtrReview.ForGameMode')}</label>
                <select name="reviewMode" onChange={this.changeMode}>
                  {reviewModeOptions.map((reviewModeOption) => (
                    <option key={reviewModeOption.mode} value={reviewModeOption.mode}>
                      {reviewModeOption.mode}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <textarea
              placeholder={t('DtrReview.Help')}
              onChange={this.updateReview}
              name={item.isDestiny2() ? 'text' : 'review'}
              onBlur={this.reviewBlur}
            />
          </div>
        )}

        {canReview && !expandReview && (
          <div className="community-review--reviews">
            {submitted && (
              <div className="community-review--message">{t('DtrReview.ThankYou')}</div>
            )}
            {/* TODO: loading screen for when reviewsResponse is missing */}
            {!(
              dtrRating &&
              dtrRating.reviewsResponse &&
              dtrRating.reviewsResponse.reviews.length > 0
            ) &&
              !submitted && (
                <div className="community-review--message">{t('DtrReview.NoReviews')}</div>
              )}
            {dtrRating &&
              (dtrRating.reviewsResponse.reviews as (D1ItemUserReview | D2ItemUserReview)[])
                .filter((r) => !r.isIgnored)
                .map((review) => <ItemReview key={review.id} item={item} review={review} />)}
          </div>
        )}
      </div>
    );
  }
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ItemReviews);
