import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { RootState } from '../store/reducers';
import { t } from 'i18next';
import './item-review.scss';
import { connect } from 'react-redux';
import { AppIcon, thumbsUpIcon, thumbsDownIcon } from '../shell/icons';
import { setSetting } from '../settings/actions';
import { getRating } from './reducer';
import { D2RatingData, D2ItemUserReview, DtrD2ActivityModes } from './d2-dtr-api-types';
import { D1RatingData, D1ItemUserReview } from './d1-dtr-api-types';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import ItemReview, { isD2Review } from './ItemReview';
import ItemReviewSettings from './ItemReviewSettings';
import { StarRatingEditor } from '../shell/star-rating/StarRatingEditor';
import { getReviewModes, D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { dimDestinyTrackerService } from './destiny-tracker.service';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  canReview: boolean;
  reviewsModeSelection: DtrD2ActivityModes;
  dtrRating?: D2RatingData | D1RatingData;
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  const settings = state.settings;
  return {
    canReview: settings.allowIdPostToDtr,
    reviewsModeSelection: settings.reviewsModeSelection,
    dtrRating: getRating(item, state.reviews.ratings)
  };
}

const mapDispatchToProps = {
  setSetting
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

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

    const { dtrRating, item, reviewsModeSelection } = props;

    let expandReview = false;
    if (dtrRating && dtrRating.userReview) {
      if (isD1RatingData(item, dtrRating)) {
        expandReview = dtrRating.userReview.rating !== 0 && !dtrRating.userReview.treatAsSubmitted;
      } else if (isD2RatingData(item, dtrRating)) {
        expandReview = dtrRating.userReview.voted !== 0 && !dtrRating.userReview.treatAsSubmitted;

        if (!dtrRating.userReview.mode) {
          dtrRating.userReview.mode = reviewsModeSelection;
        }
      }
    }

    this.state = { submitted: false, expandReview };
  }

  componentDidMount() {
    if (this.props.item.isDestiny2()) {
      getDefinitions().then((defs) => {
        const reviewModeOptions = getReviewModes(defs);
        this.setState({ reviewModeOptions });
      });
    }
  }

  render() {
    const { canReview, item, dtrRating, reviewsModeSelection } = this.props;
    const { reviewModeOptions, submitted, draftReviewText } = this.state;

    if (!$featureFlags.reviewsEnabled || !dtrRating) {
      return null;
    }

    if (!canReview) {
      return <div>{!canReview && <ItemReviewSettings item={item} />}}</div>;
    }

    const canCreateReview = canReview && item.owner;

    let expandReview = false;
    if (dtrRating && dtrRating.userReview) {
      if (isD1RatingData(item, dtrRating)) {
        expandReview = dtrRating.userReview.rating !== 0 && !dtrRating.userReview.treatAsSubmitted;
      } else if (isD2RatingData(item, dtrRating)) {
        expandReview = dtrRating.userReview.voted !== 0 && !dtrRating.userReview.treatAsSubmitted;

        if (!dtrRating.userReview.mode) {
          dtrRating.userReview.mode = reviewsModeSelection;
        }
      }
    }

    // TODO: "your review"

    // TODO: plumb up "edit review" for your review?

    // TODO: show the total number of thumbs up and down?

    // TODO: Needs more redux

    const reviews: (D1ItemUserReview | D2ItemUserReview)[] =
      (dtrRating && dtrRating.reviewsResponse && dtrRating.reviewsResponse.reviews) || [];

    return (
      <div>
        {canCreateReview && (
          <div className="user-review--header">
            <span>{t('DtrReview.YourReview')}</span>

            {isD2RatingData(item, dtrRating) ? (
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
                <button className="dim-button" onClick={this.cancelEdit}>
                  {t('DtrReview.Cancel')}
                </button>
              </span>
            )}
          </div>
        )}

        {expandReview ? (
          <div className="community-review--details">
            {isD2RatingData(item, dtrRating) && (
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
    const { item, dtrRating } = this.props;
    if (dtrRating && isD2RatingData(item, dtrRating)) {
      // TODO: NO! REDUX!
      // this "working review" is really what should live in state!
      dtrRating.userReview.mode = parseInt(e.currentTarget.value, 10);
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
    const { item } = this.props;
    // TODO: submit based on draft
    // TODO: make sure submitted review gets added to the cache!
    await dimDestinyTrackerService.submitReview(item);
    this.cancelEdit();
  };

  private setRating = (rating: number) => {
    const { item, dtrRating } = this.props;
    if (rating) {
      if (!dtrRating || !isD1RatingData(item, dtrRating)) {
        return;
      }

      dtrRating.userReview.rating = rating;
    }

    this.setState({
      expandReview: true,
      draftRating: rating
    });
  };

  private reviewBlur = () => {
    const { item, dtrRating } = this.props;
    if (dtrRating) {
      dimDestinyTrackerService.updateCachedUserRankings(item, dtrRating.userReview);
    }
  };

  private thumbsUp = () => {
    this.setUserVote(1);
  };

  private thumbsDown = () => {
    this.setUserVote(-1);
  };

  private setUserVote = (userVote: number) => {
    const { item, dtrRating } = this.props;
    if (!dtrRating || !isD2RatingData(item, dtrRating)) {
      return;
    }

    dtrRating.userReview.voted = dtrRating.userReview.voted === userVote ? 0 : userVote;

    const treatAsTouched = dtrRating.userReview.voted !== 0;

    dtrRating.userReview.treatAsSubmitted = !treatAsTouched;

    this.setState({
      expandReview: treatAsTouched
    });

    this.reviewBlur();
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ItemReviews);

function isD1RatingData(
  item: DimItem,
  _dtrRating: D2RatingData | D1RatingData
): _dtrRating is D1RatingData {
  return item.isDestiny1();
}

function isD2RatingData(
  item: DimItem,
  _dtrRating: D2RatingData | D1RatingData
): _dtrRating is D2RatingData {
  return item.isDestiny2();
}
