import React from 'react';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { refresh } from '../shell/refresh';
import { clearWishLists, loadWishLists } from '../curated-rolls/actions';
import HelpLink from '../dim-ui/HelpLink';
import { DropzoneOptions } from 'react-dropzone';
import FileUpload from '../dim-ui/FileUpload';
import { wishListsEnabledSelector, loadCurationsFromIndexedDB } from '../curated-rolls/reducer';
import { loadCuratedRollsAndInfo } from '../curated-rolls/curatedRollService';
import _ from 'lodash';

interface StoreProps {
  curationsEnabled: boolean;
  numCurations: number;
  title?: string;
  description?: string;
}

const mapDispatchToProps = {
  clearCurationsAndInfo: clearWishLists,
  loadCurationsAndInfo: loadWishLists,
  loadCurationsFromIndexedDB: loadCurationsFromIndexedDB as any
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    curationsEnabled: wishListsEnabledSelector(state),
    numCurations: state.wishLists.curationsAndInfo.curatedRolls.length,
    title: state.wishLists.curationsAndInfo.title,
    description: state.wishLists.curationsAndInfo.description
  };
}

class WishListSettings extends React.Component<Props> {
  componentDidMount() {
    this.props.loadCurationsFromIndexedDB();
  }

  render() {
    const {
      curationsEnabled,
      clearCurationsAndInfo,
      numCurations,
      title,
      description
    } = this.props;

    return (
      <section id="wishlist">
        <h2>
          {t('CuratedRoll.Header')}
          <HelpLink helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/COMMUNITY_CURATIONS.md" />
        </h2>
        {$featureFlags.curatedRolls && (
          <>
            <div className="setting">
              <FileUpload onDrop={this.loadCurations} title={t('CuratedRoll.Import')} />
            </div>
            {curationsEnabled && (
              <>
                <div className="setting">
                  <div className="horizontal">
                    <label>
                      {t('CuratedRoll.Num', {
                        number: numCurations
                      })}
                    </label>
                    <button className="dim-button" onClick={clearCurationsAndInfo}>
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

  private loadCurations: DropzoneOptions['onDrop'] = (acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        const curatedRollsAndInfo = loadCuratedRollsAndInfo(reader.result);
        ga('send', 'event', 'Rating Options', 'Load Wish List');

        if (curatedRollsAndInfo.curatedRolls.length > 0) {
          this.props.loadCurationsAndInfo(curatedRollsAndInfo);

          const titleAndDescription = _.compact([
            curatedRollsAndInfo.title,
            curatedRollsAndInfo.description
          ]).join('\n');

          refresh();
          alert(
            t('CuratedRoll.ImportSuccess', {
              count: curatedRollsAndInfo.curatedRolls.length,
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
