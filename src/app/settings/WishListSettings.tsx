import React from 'react';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { refresh } from '../shell/refresh';
import { clearWishLists, loadWishLists } from '../wishlists/actions';
import HelpLink from '../dim-ui/HelpLink';
import { DropzoneOptions } from 'react-dropzone';
import FileUpload from '../dim-ui/FileUpload';
import { wishListsEnabledSelector, loadWishListAndInfoFromIndexedDB } from '../wishlists/reducer';
import _ from 'lodash';
import { toWishList } from 'app/wishlists/wishlist-file';

interface StoreProps {
  wishListsEnabled: boolean;
  numWishListRolls: number;
  title?: string;
  description?: string;
}

const mapDispatchToProps = {
  clearWishListAndInfo: clearWishLists,
  loadWishListAndInfo: loadWishLists,
  loadWishListAndInfoFromIndexedDB: loadWishListAndInfoFromIndexedDB as any
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    wishListsEnabled: wishListsEnabledSelector(state),
    numWishListRolls: state.wishLists.wishListAndInfo.wishListRolls.length,
    title: state.wishLists.wishListAndInfo.title,
    description: state.wishLists.wishListAndInfo.description
  };
}

class WishListSettings extends React.Component<Props> {
  componentDidMount() {
    this.props.loadWishListAndInfoFromIndexedDB();
  }

  render() {
    const {
      wishListsEnabled,
      clearWishListAndInfo,
      numWishListRolls,
      title,
      description
    } = this.props;

    return (
      <section id="wishlist">
        <h2>
          {t('CuratedRoll.Header')}
          <HelpLink helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/COMMUNITY_CURATIONS.md" />
        </h2>
        {$featureFlags.wishLists && (
          <>
            <div className="setting">
              <FileUpload onDrop={this.loadWishList} title={t('CuratedRoll.Import')} />
            </div>
            {wishListsEnabled && (
              <>
                <div className="setting">
                  <div className="horizontal">
                    <label>
                      {t('CuratedRoll.Num', {
                        num: numWishListRolls
                      })}
                    </label>
                    <button className="dim-button" onClick={clearWishListAndInfo}>
                      {t('CuratedRoll.Clear')}
                    </button>
                  </div>
                  {(title || description) && (
                    <div className="fineprint">
                      {title && (
                        <div className="overflow-dots">
                          <b>{title}</b>
                          <br />
                        </div>
                      )}
                      <div className="overflow-dots">{description}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>
    );
  }

  private loadWishList: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        const wishListAndInfo = toWishList(reader.result);
        ga('send', 'event', 'Rating Options', 'Load Wish List');

        if (wishListAndInfo.wishListRolls.length > 0) {
          this.props.loadWishListAndInfo(wishListAndInfo);

          const titleAndDescription = _.compact([
            wishListAndInfo.title,
            wishListAndInfo.description
          ]).join('\n');

          refresh();
          alert(
            t('CuratedRoll.ImportSuccess', {
              count: wishListAndInfo.wishListRolls.length,
              titleAndDescription
            })
          );
        } else {
          alert(t('CuratedRoll.ImportFailed'));
        }
      }
    };

    const file = acceptedFiles[0];
    if (file) {
      reader.readAsText(file);
    } else {
      alert(t('CuratedRoll.ImportNoFile'));
    }
    return false;
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(WishListSettings);
