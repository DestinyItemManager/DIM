import React, { useState } from 'react';
import classNames from 'classnames';
import './st-jude-toaster.scss';
import stJudeImage from '../../images/stjude_finding-cures_londyn-learn-more_animated_300x50.gif';
import Sheet from 'app/dim-ui/Sheet';

const StJudeToaster = () => {
  const [isMinimized, setIsMinimized] = useState(true);

  const openCampaignWindow = () => {
    const campaign = window.open(
      'https://tiltify.com/@thisisdim/dim-2019-fundraising-event/donate',
      '_blank'
    );

    if (campaign !== null) {
      campaign.opener = null;
    }
  };

  const openShirtWindow = () => {
    const campaign = window.open(
      'https://www.designbyhumans.com/shop/DestinyItemManager/',
      '_blank'
    );

    if (campaign !== null) {
      campaign.opener = null;
    }
  };

  const openCampaign = () => {
    setIsMinimized(false);
  };

  const closeCampaign = () => {
    setIsMinimized(true);
  };

  return (
    <div
      className={classNames(`st-jude-toaster`, {
        minimized: isMinimized,
        maximized: !isMinimized
      })}
    >
      {isMinimized ? (
        <img src={stJudeImage} onClick={openCampaign} />
      ) : (
        <Sheet onClose={closeCampaign}>
          <div className="st-jude-container">
            <p>
              The team at DIM joins the Destiny community to urge you to support St. Jude Children's
              Research Hospital. Your support helps ensures that families will never receive a bill
              from St. Jude for treatment, travel, housing or food.
            </p>
            <p>There are two ways you can make a difference...</p>
            <div className="st-jude-options">
              <div className="left">
                You can make greatest impact with your donation amount by giving directly to St Jude
                Children's Research Hospital via Tiltify.com.
                <span className="st-jude-donate" onClick={openCampaignWindow}>
                  Donate
                </span>
              </div>
              <div className="right">
                You can purchase our newest shirt, Take Control, from our Designed by Humans store.
                All proceeds from the sale until June 30th will go to St. Jude Children's Research
                Hospital.
                <span className="st-jude-donate" onClick={openShirtWindow}>
                  Buy a Shirt
                </span>
              </div>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
};

export { StJudeToaster };
