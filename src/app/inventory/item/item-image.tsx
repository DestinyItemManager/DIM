import * as React from 'react';
import classNames from 'classnames';
import './item-image.scss';

interface Props {
  backgroundUrl: string;
  hasBorder: boolean;
}

export default class ItemImage extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { backgroundUrl, hasBorder, rarity, isMasterwork } = this.props;

    if (!backgroundUrl) {
      return null;
    }

    const styles = {
      backgroundImage: `url('https://www.bungie.net${ backgroundUrl }')`
    };

    const imageClass = classNames('image-well', {
      'has-border': hasBorder
    });

    return (
      <div className={imageClass}>
        <div className="item-image" style={styles} />
        <div className="item-overlay"/>
      </div>
    );
  }
}
