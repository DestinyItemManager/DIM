import React, { SyntheticEvent } from 'react';
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
import { Settings } from './reducer';
import { setSetting } from './actions';
import { settings } from 'cluster';

interface StoreProps {
  wishListsEnabled: boolean;
  numWishListRolls: number;
  title?: string;
  description?: string;
  settings: Settings;
}

const mapDispatchToProps = {
  clearWishListAndInfo: clearWishLists,
  loadWishListAndInfo: loadWishLists,
  loadWishListAndInfoFromIndexedDB: loadWishListAndInfoFromIndexedDB as any
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  const settings = state.settings;
  return {
    wishListsEnabled: wishListsEnabledSelector(state),
    numWishListRolls: state.wishLists.wishListAndInfo.wishListRolls.length,
    title: state.wishLists.wishListAndInfo.title,
    description: state.wishLists.wishListAndInfo.description,
    settings
  };
}

class WishListSettings extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.loadWishListAndInfoFromIndexedDB();
  }

  render() {
    const {
      wishListsEnabled,
      clearWishListAndInfo,
      numWishListRolls,
      title,
      description,
      settings
    } = this.props;

    return (
      <section id="wishlist">
        <h2>
          {t('WishListRoll.Header')}
          <HelpLink helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/COMMUNITY_CURATIONS.md" />
        </h2>
        {$featureFlags.wishLists && (
          <>
            <div className="setting">
              <FileUpload onDrop={this.loadWishList} title={t('WishListRoll.Import')} />
            </div>
            <div className="setting">
              <input
                type="text"
                onChange={this.fetchWishlist}
                value={settings.wishListSource}
                placeholder={t('WishListRoll.ExternalSource')}
              />
            </div>
            {settings.wishListSource && settings.wishListLastChecked && (
              <div className="setting">
                <span>{t('WishListRoll.LastChecked', settings.wishListLastChecked)}</span>
              </div>
            )}
            {wishListsEnabled && (
              <>
                <div className="setting">
                  <div className="horizontal">
                    <label>
                      {t('WishListRoll.Num', {
                        num: numWishListRolls
                      })}
                    </label>
                    <button className="dim-button" onClick={clearWishListAndInfo}>
                      {t('WishListRoll.Clear')}
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

  private transformAndStoreWishList = (wishListResult: string, eventName: string) => {
    const wishListAndInfo = toWishList(wishListResult);
    ga('send', 'event', 'Rating Options', eventName);

    if (wishListAndInfo.wishListRolls.length > 0) {
      this.props.loadWishListAndInfo(wishListAndInfo);

      const titleAndDescription = _.compact([
        wishListAndInfo.title,
        wishListAndInfo.description
      ]).join('\n');

      refresh();
      alert(
        t('WishListRoll.ImportSuccess', {
          count: wishListAndInfo.wishListRolls.length,
          titleAndDescription
        })
      );
    } else {
      alert(t('WishListRoll.ImportFailed'));
    }
  };

  private fetchWishlist = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newWishListSource = e.target.value;
    if (!newWishListSource) {
      return;
    }

    newWishListSource = newWishListSource.trim();

    if (newWishListSource === this.props.settings.wishListSource) {
      return;
    }

    fetch(newWishListSource)
      .then((result) => result.text())
      .then((resultText) => this.transformAndStoreWishList(resultText, 'Fetch Wish List'))
      .then(() => setSetting('wishListLastChecked', new Date()));
  };

  private loadWishList: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        this.transformAndStoreWishList(reader.result, 'Load Wish List');
      }
    };

    const file = acceptedFiles[0];
    if (file) {
      reader.readAsText(file);
    } else {
      alert(t('WishListRoll.ImportNoFile'));
    }
    return false;
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(WishListSettings);
