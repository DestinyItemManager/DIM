import * as React from "react";
import { D2Item } from "./item-types";
import showRatingFn from "./show-ratings";
import "./ItemRender.scss";
import { dtrRatingColor } from "../shell/dimAngularFilters.filter";

interface Props {
  item: D2Item;
}

export default class ItemRender extends React.Component<Props> {
  render() {
    const { item } = this.props;
    const showRating = showRatingFn(item);

    if (showRating && item.dtrRating && item.dtrRating.overallScore) {
      return (
        <div className="review-score">
          {item.dtrRating.overallScore}
          <i
            className="fa fa-star"
            style={dtrRatingColor(item.dtrRating.overallScore)}
          />
        </div>
      );
    } else {
      return null;
    }
  }
}
