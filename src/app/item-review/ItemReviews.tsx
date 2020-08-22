import React from 'react';
import { DimItem } from '../inventory/item-types';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { t } from 'app/i18next-t';
import './item-review.scss';
import { connect } from 'react-redux';
import {
  AppIcon,
  thumbsUpIcon,
  thumbsDownIcon,
  faThumbsUpRegular,
  faThumbsDownRegular,
} from '../shell/icons';
import { getRating, ratingsSelector, getReviews, getUserReview, shouldShowRating } from './reducer';
import { D2ItemUserReview, WorkingD2Rating } from './d2-dtr-api-types';
import { D1ItemUserReview, WorkingD1Rating } from './d1-dtr-api-types';
import ItemReview from './ItemReview';
import ItemReviewSettings from './ItemReviewSettings';
import { StarRatingEditor } from '../shell/star-rating/StarRatingEditor';
import { getReviewModes, D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';
import { getItemReviews, submitReview, reportReview } from './destiny-tracker.service';
import { DtrRating } from './dtr-api-types';
import { saveUserReview } from './actions';
import { isD1UserReview, isD2UserReview } from '../destinyTrackerApi/reviewSubmitter';
import RatingIcon from '../inventory/RatingIcon';
import { settingsSelector } from 'app/settings/reducer';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  canReview: boolean;
  dtrRating?: DtrRating;
  reviews: (D1ItemUserReview | D2ItemUserReview)[];
  userReview: WorkingD2Rating | WorkingD1Rating;
  reviewModeOptions?: D2ReviewMode[];
}

const EMPTY = [];

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  const settings = settingsSelector(state);
  const reviewsResponse = getReviews(item, state);
  return {
    canReview: settings.allowIdPostToDtr,
    dtrRating: getRating(item, ratingsSelector(state)),
    reviews: reviewsResponse ? reviewsResponse.reviews : EMPTY,
    userReview: getUserReview(item, state),
    reviewModeOptions: state.manifest.d2Manifest
      ? getReviewModes(state.manifest.d2Manifest)
      : EMPTY,
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

interface State {
  submitted: boolean;
  expandReview: boolean;
}

class ItemReviews extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { item, userReview } = props;

    let expandReview = false;
    if (userReview) {
      if (isD1UserReview(item, userReview)) {
        expandReview = userReview.rating !== 0 && !userReview.treatAsSubmitted;
      } else if (isD2UserReview(item, userReview)) {
        expandReview = userReview.voted !== 0 && !userReview.treatAsSubmitted;
      }
    }

    this.state = { submitted: false, expandReview };
  }

  componentDidMount() {
    const { item, dispatch, reviews } = this.props;

    // TODO: want to prevent double loading these
    if (!reviews.length) {
      dispatch(getItemReviews(item));
    }
  }

  componentDidUpdate() {
    const { item, dispatch, reviews } = this.props;
    // TODO: want to prevent double loading these
    if (!reviews.length) {
      dispatch(getItemReviews(item));
    }
  }

  render() {
    const { reviewModeOptions, canReview, item, dtrRating, reviews, userReview } = this.props;
    const { submitted, expandReview } = this.state;

    if (!$featureFlags.reviewsEnabled) {
      return null;
    }

    if (!canReview) {
      return <div>{!canReview && <ItemReviewSettings item={item} />}</div>;
    }

    const canCreateReview = canReview && item.owner;

    // TODO: "your review"

    // TODO: plumb up "edit review" for your review?

    // TODO: show the total number of thumbs up and down?

    return (
      <div>
        <div className="user-review--header">
          {dtrRating?.votes && (
            <div className="user-review--vote-summary">
              <span>
                <AppIcon icon={thumbsUpIcon} className="community-review--thumbs-up" />{' '}
                {dtrRating.votes.upvotes}
              </span>
              <span>+</span>
              <span>
                <AppIcon icon={thumbsDownIcon} className="community-review--thumbs-down" />{' '}
                {dtrRating.votes.downvotes}
              </span>
              <span>≈</span>
              <span>
                {shouldShowRating(dtrRating) ? (
                  <>
                    <RatingIcon rating={dtrRating.overallScore} uiWishListRoll={undefined} /> (
                    {dtrRating.overallScore.toFixed(1)})
                  </>
                ) : (
                  t('DtrReview.TooFew')
                )}
              </span>
            </div>
          )}
          {canCreateReview && (
            <>
              <span>{t('DtrReview.YourReview')}</span>

              {isD2UserReview(item, userReview) ? (
                <div className="user-review--thumbs">
                  <div className="user-review--thumbs-up link" onClick={this.thumbsUp}>
                    <span className="user-review--thumbs-up-button">
                      <AppIcon
                        className="fa-2x"
                        icon={
                          dtrRating && userReview.voted === 1 ? thumbsUpIcon : faThumbsUpRegular
                        }
                      />
                    </span>
                  </div>

                  <div className="user-review--thumbs-down">
                    <span className="user-review--thumbs-down-button" onClick={this.thumbsDown}>
                      <AppIcon
                        className="fa-2x"
                        icon={
                          dtrRating && userReview.voted === -1
                            ? thumbsDownIcon
                            : faThumbsDownRegular
                        }
                      />
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <StarRatingEditor rating={userReview.rating} onRatingChange={this.setRating} />
                </div>
              )}

              {expandReview && (
                <span ng-show="expandReview">
                  <button type="button" className="dim-button" onClick={this.submitReview}>
                    {t('DtrReview.Submit')}
                  </button>{' '}
                  <button type="button" className="dim-button" onClick={this.cancelEdit}>
                    {t('DtrReview.Cancel')}
                  </button>
                </span>
              )}
            </>
          )}
        </div>

        {expandReview ? (
          <div className="community-review--details">
            {isD2UserReview(item, userReview) && (
              <div className="community-review--mode">
                <label htmlFor="reviewMode">{t('DtrReview.ForGameModeLabel')}</label>{' '}
                <select name="reviewMode" onChange={this.changeMode}>
                  {reviewModeOptions?.map((reviewModeOption) => (
                    <option key={reviewModeOption.mode} value={reviewModeOption.mode}>
                      {reviewModeOption.description}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <textarea
              placeholder={t('DtrReview.Help')}
              onChange={this.updateReview}
              value={isD2UserReview(item, userReview) ? userReview.text : userReview.review}
              onKeyDown={this.stopEvents}
              onTouchStart={this.stopEvents}
              onMouseDown={this.stopEvents}
            />
          </div>
        ) : (
          <div className="community-review--reviews">
            {/* TODO: loading screen for when reviewsResponse is missing */}
            {submitted && (
              <div className="community-review--message">{t('DtrReview.ThankYou')}</div>
            )}
            {reviews.length === 0 ? (
              <div className="community-review--message">{t('DtrReview.NoReviews')}</div>
            ) : (
              reviews
                .filter((r) => !r.isIgnored)
                .map((review) => (
                  <ItemReview
                    key={review.id}
                    item={item}
                    review={review}
                    reviewModeOptions={reviewModeOptions}
                    onEditReview={this.editReview}
                    onReportReview={this.reportReview}
                  />
                ))
            )}
          </div>
        )}
      </div>
    );
  }

  private cancelEdit = () => {
    this.setState((state) => ({
      expandReview: !state.expandReview,
    }));
  };

  private changeMode = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { item, userReview, dispatch } = this.props;
    if (userReview && isD2UserReview(item, userReview)) {
      const newUserReview = {
        ...userReview,
        mode: parseInt(e.currentTarget.value, 10),
      };
      dispatch(saveUserReview({ item, review: newUserReview }));
    }
  };

  private updateReview = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { item, userReview, dispatch } = this.props;

    const newUserReview = {
      ...userReview,
      [isD2UserReview(item, userReview) ? 'text' : 'review']: e.currentTarget.value,
    };
    dispatch(saveUserReview({ item, review: newUserReview }));
  };

  private editReview = (review: D2ItemUserReview | D1ItemUserReview) => {
    const { dtrRating } = this.props;
    if (!review || !review.isReviewer || !dtrRating) {
      return;
    }

    // TODO: handle empty starting review
    this.setState({
      expandReview: true,
    });
  };

  private reportReview = (review: D2ItemUserReview | D1ItemUserReview) => {
    const { dispatch } = this.props;
    dispatch(reportReview(review));
  };

  private submitReview = async () => {
    const { item, userReview, dispatch } = this.props;
    await dispatch(submitReview(item, userReview));
    this.setState({ submitted: true });
    this.cancelEdit();
  };

  private setRating = (rating: number) => {
    const { item, userReview, dispatch } = this.props;
    if (rating) {
      if (!userReview || !isD1UserReview(item, userReview)) {
        return;
      }

      userReview.rating = rating;
    }
    const updatedUserReview = {
      ...userReview,
      rating,
    };

    this.setState({
      expandReview: true,
    });

    dispatch(saveUserReview({ item, review: updatedUserReview }));
  };

  private thumbsUp = () => {
    const { item, userReview } = this.props;
    if (!userReview || !isD2UserReview(item, userReview)) {
      return;
    }
    this.setUserVote(userReview.voted === 1 ? 0 : 1);
  };

  private thumbsDown = () => {
    const { item, userReview } = this.props;
    if (!userReview || !isD2UserReview(item, userReview)) {
      return;
    }
    this.setUserVote(userReview.voted === -1 ? 0 : -1);
  };

  private setUserVote = (userVote: number) => {
    const { item, userReview, dispatch } = this.props;
    if (!userReview || !isD2UserReview(item, userReview)) {
      return;
    }

    const newVote = userReview.voted === userVote ? 0 : userVote;
    const treatAsTouched = newVote !== 0;

    const updatedUserReview = {
      ...userReview,
      voted: newVote,
      treatAsSubmitted: !treatAsTouched,
    };

    this.setState({
      expandReview: treatAsTouched,
    });

    dispatch(saveUserReview({ item, review: updatedUserReview }));
  };

  private stopEvents = (e) => {
    e.stopPropagation();
  };
}

export default connect<StoreProps>(mapStateToProps)(ItemReviews);
