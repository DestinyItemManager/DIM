import React from 'react';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { refresh } from '../shell/refresh';
import { clearWishLists } from '../wishlists/actions';
import HelpLink from '../dim-ui/HelpLink';
import { DropzoneOptions } from 'react-dropzone';
import FileUpload from '../dim-ui/FileUpload';
import { wishListsEnabledSelector, loadWishListAndInfoFromIndexedDB } from '../wishlists/reducer';
import _ from 'lodash';
import { Settings } from './reducer';
import { setSetting } from './actions';
import { fetchWishList, transformAndStoreWishList } from 'app/wishlists/wishlist-fetch';

interface StoreProps {
  wishListsEnabled: boolean;
  numWishListRolls: number;
  title?: string;
  description?: string;
  settings: Settings;
}

const mapDispatchToProps = {
  clearWishListAndInfo: clearWishLists,
  loadWishListAndInfoFromIndexedDB: loadWishListAndInfoFromIndexedDB as any,
  setSetting
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  const settings = state.settings;
  return {
    wishListsEnabled: wishListsEnabledSelector(state) || Boolean(settings.wishListSource),
    numWishListRolls: state.wishLists.wishListAndInfo.wishListRolls.length,
    title: state.wishLists.wishListAndInfo.title,
    description: state.wishLists.wishListAndInfo.description,
    settings
  };
}

class WishListSettings extends React.Component<Props> {
  componentDidMount() {
    this.props.loadWishListAndInfoFromIndexedDB();
  }

  render() {
    const { wishListsEnabled, numWishListRolls, title, description, settings } = this.props;

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
              <div>{t('WishListRoll.ExternalSource')}</div>
              <div>
                <input
                  type="text"
                  onChange={_.noop}
                  onInput={this.wishListSourceChangeEvent}
                  value={settings.wishListSource}
                  placeholder={t('WishListRoll.ExternalSource')}
                />
              </div>
            </div>

            {wishListsEnabled && (
              <>
                <div className="setting">
                  <div className="horizontal">
                    <label>
                      {t('WishListRoll.Num', {
                        num: numWishListRolls
                      })}
                    </label>
                    <button className="dim-button" onClick={this.clearWishListEvent}>
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

  private wishListSourceChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newWishListSource = e.target.value;
    if (!newWishListSource) {
      return;
    }

    newWishListSource = newWishListSource.trim();

    if (newWishListSource === this.props.settings.wishListSource) {
      return;
    }

    this.props.setSetting('wishListSource', newWishListSource);

    fetchWishList(true);

    refresh();
  };

  private loadWishList: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    this.props.setSetting('wishListSource', undefined);

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        transformAndStoreWishList(reader.result, 'Load Wish List', true);
        refresh();
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

  private clearWishListEvent = () => {
    this.props.setSetting('wishListSource', undefined);
    this.props.clearWishListAndInfo();
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(WishListSettings);
