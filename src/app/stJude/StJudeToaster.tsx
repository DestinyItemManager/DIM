import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { AppIcon, disabledIcon } from '../shell/icons';
import './st-jude-toaster.scss';
import stJudeImage from '../../images/stjude_finding-cures_londyn-learn-more_animated_300x50.gif';

const StJudeToaster = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {});

  const openCampaignWindow = () => {
    const campaign = window.open(
      'https://tiltify.com/@thisisdim/dim-2019-fundraising-event/donate',
      '_blank'
    );

    if (campaign !== null) {
      campaign.opener = null;
    }
  };

  const openCampaign = () => {
    setIsMinimized(false);
    setTimeout(() => {
      setVisible(true);
    });
  };

  const closeCampaign = () => {
    setIsMinimized(true);
    setVisible(false);
  };

  return (
    <>
      <div
        className={classNames(`st-jude-toaster`, {
          minimized: isMinimized,
          maximized: !isMinimized
        })}
      >
        {!isMinimized && (
          <div className={classNames(`st-jude-info`, { visible: visible })}>
            <span className="st-jude-hide" onClick={closeCampaign}>
              <span className="sheet-close">
                <AppIcon icon={disabledIcon} />
              </span>
            </span>
            <p>
              The team at DIM joins the Destiny community to urge you to support St. Jude Children's
              Research Hospital. Your support helps ensures that families will never receive a bill
              from St. Jude for treatment, travel, housing or food.
            </p>
            <p>Help make a difference, and donate today.</p>
            <span className="st-jude-donate" onClick={openCampaignWindow}>
              Donate
            </span>
          </div>
        )}
        {isMinimized && <img src={stJudeImage} onClick={openCampaign} />}
      </div>
    </>
  );
};

export { StJudeToaster };
