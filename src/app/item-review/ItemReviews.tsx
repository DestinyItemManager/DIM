import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { RootState } from '../store/reducers';
import { t } from 'i18next';
import './item-review.scss';
import { connect, DispatchProp } from 'react-redux';
import { AppIcon, thumbsUpIcon, thumbsDownIcon } from '../shell/icons';
import { getRating, ratingsSelector, getReviews, getUserReview } from './reducer';
import { D2ItemUserReview, DtrD2ActivityModes, WorkingD2Rating } from './d2-dtr-api-types';
import { D1ItemUserReview, WorkingD1Rating } from './d1-dtr-api-types';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import ItemReview, { isD2Review } from './ItemReview';
import ItemReviewSettings from './ItemReviewSettings';
import { StarRatingEditor } from '../shell/star-rating/StarRatingEditor';
import { getReviewModes, D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { getItemReviews, submitReview } from './destiny-tracker.service';
import { DtrRating } from './dtr-api-types';
import { saveUserReview } from './actions';
import { isD1UserReview, isD2UserReview } from '../destinyTrackerApi/reviewSubmitter';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  canReview: boolean;
  reviewsModeSelection: DtrD2ActivityModes;
  dtrRating?: DtrRating;
  reviews: (D1ItemUserReview | D2ItemUserReview)[];
  userReview: WorkingD2Rating | WorkingD1Rating;
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  const settings = state.settings;
  const reviewsResponse = getReviews(item, state);
  return {
    canReview: settings.allowIdPostToDtr,
    reviewsModeSelection: settings.reviewsModeSelection,
    dtrRating: getRating(item, ratingsSelector(state)),
    reviews: reviewsResponse ? reviewsResponse.reviews : [],
    userReview: getUserReview(item, state)
  };
}

type Props = ProvidedProps & StoreProps & DispatchProp<any>;

interface State {
  reviewModeOptions?: D2ReviewMode[];
  submitted: boolean;
  draftRating?: number;
  draftReviewText?: string;
  expandReview: boolean;
}

class ItemReviews extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { item, reviewsModeSelection, userReview } = props;

    let expandReview = false;
    if (userReview) {
      if (isD1UserReview(item, userReview)) {
        expandReview = userReview.rating !== 0 && !userReview.treatAsSubmitted;
      } else if (isD2UserReview(item, userReview)) {
        expandReview = userReview.voted !== 0 && !userReview.treatAsSubmitted;

        // TODO: Bad!
        if (!userReview.mode) {
          userReview.mode = reviewsModeSelection;
        }
      }
    }

    this.state = { submitted: false, expandReview };
  }

  componentDidMount() {
    const { item, dispatch, reviews } = this.props;
    if (item.isDestiny2()) {
      getDefinitions().then((defs) => {
        const reviewModeOptions = getReviewModes(defs);
        this.setState({ reviewModeOptions });
      });
    }

    // TODO: want to prevent double loading these
    if (!reviews) {
      dispatch(getItemReviews(item));
    }
  }

  render() {
    const { canReview, item, dtrRating, reviews, userReview } = this.props;
    const { reviewModeOptions, submitted, draftReviewText, expandReview } = this.state;

    if (!$featureFlags.reviewsEnabled || !dtrRating) {
      return null;
    }

    if (!canReview) {
      return <div>{!canReview && <ItemReviewSettings item={item} />}}</div>;
    }

    const canCreateReview = canReview && item.owner;

    // TODO: "your review"

    // TODO: plumb up "edit review" for your review?

    // TODO: show the total number of thumbs up and down?

    // TODO: Needs more redux

    console.log({ reviews, dtrRating, item });

    return (
      <div>
        {canCreateReview && (
          <div className="user-review--header">
            <span>{t('DtrReview.YourReview')}</span>

            {isD2UserReview(item, userReview) ? (
              <div className="user-review--thumbs">
                <div className="user-review--thumbs-up link" onClick={this.thumbsUp}>
                  <span className="user-review--thumbs-up-button">
                    <AppIcon
                      icon={dtrRating && userReview.voted === 1 ? thumbsUpIcon : faThumbsUp}
                    />
                  </span>
                </div>

                <div className="user-review--thumbs-down">
                  <span className="user-review--thumbs-down-button" onClick={this.thumbsDown}>
                    <AppIcon
                      icon={dtrRating && userReview.voted === -1 ? thumbsDownIcon : faThumbsDown}
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
                <button className="dim-button" onClick={this.submitReview}>
                  {t('DtrReview.Submit')}
                </button>
                <button className="dim-button" onClick={this.cancelEdit}>
                  {t('DtrReview.Cancel')}
                </button>
              </span>
            )}
          </div>
        )}

        {expandReview ? (
          <div className="community-review--details">
            {isD2UserReview(item, userReview) && (
              <div className="community-review--mode">
                <label htmlFor="reviewMode">{t('DtrReview.ForGameMode')}</label>
                <select name="reviewMode" onChange={this.changeMode}>
                  {reviewModeOptions &&
                    reviewModeOptions.map((reviewModeOption) => (
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
              value={draftReviewText}
              onBlur={this.reviewBlur}
            />
          </div>
        ) : (
          <div className="community-review--reviews">
            {/* TODO: loading screen for when reviewsResponse is missing */}
            {submitted ? (
              <div className="community-review--message">{t('DtrReview.ThankYou')}</div>
            ) : reviews.length === 0 ? (
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
      draftRating: undefined,
      draftReviewText: undefined
    }));
  };

  private changeMode = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { item, userReview } = this.props;
    if (userReview && isD2UserReview(item, userReview)) {
      // TODO: NO! REDUX!
      // this "working review" is really what should live in state!
      userReview.mode = parseInt(e.currentTarget.value, 10);
    }
  };

  private updateReview = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ draftReviewText: e.currentTarget.value });
  };

  private editReview = (review: D2ItemUserReview | D1ItemUserReview) => {
    const { item, dtrRating } = this.props;
    if (!review || !review.isReviewer || !dtrRating) {
      return;
    }

    // TODO: handle empty starting review
    this.setState({
      expandReview: true,
      draftReviewText: isD2Review(item, review) ? review.text : review.review,
      draftRating: isD2Review(item, review) ? review.voted : review.rating
    });
  };

  private submitReview = async () => {
    const { item, userReview, dispatch } = this.props;
    await dispatch(submitReview(item, userReview));
    this.cancelEdit();
  };

  private setRating = (rating: number) => {
    const { item, userReview } = this.props;
    if (rating) {
      if (!userReview || !isD1UserReview(item, userReview)) {
        return;
      }

      userReview.rating = rating;
    }

    this.setState({
      expandReview: true,
      draftRating: rating
    });
  };

  private reviewBlur = () => {
    const { item, userReview, dispatch } = this.props;
    if (userReview) {
      dispatch(saveUserReview({ item, review: userReview }));
    }
  };

  private thumbsUp = () => {
    this.setUserVote(1);
  };

  private thumbsDown = () => {
    this.setUserVote(-1);
  };

  private setUserVote = (userVote: number) => {
    const { item, userReview } = this.props;
    if (!userReview || !isD2UserReview(item, userReview)) {
      return;
    }

    userReview.voted = userReview.voted === userVote ? 0 : userVote;

    const treatAsTouched = userReview.voted !== 0;

    userReview.treatAsSubmitted = !treatAsTouched;

    this.setState({
      expandReview: treatAsTouched
    });

    this.reviewBlur();
  };
}

export default connect<StoreProps>(mapStateToProps)(ItemReviews);
