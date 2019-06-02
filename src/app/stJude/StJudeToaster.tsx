import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import './st-jude-toaster.scss';
import stJudeImage from '../../images/DIMDonateBanners-01.png';
import twitter from '../../images/twitter.png';
import Sheet from 'app/dim-ui/Sheet';

const StJudeToaster = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [amount, setAmount] = useState<number>(0);

  function dimFetch(url: string) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const signal = controller && controller.signal;

    const request = new Request(url, {
      method: 'GET'
    });

    let timer;
    if (controller) {
      timer = setTimeout(() => controller.abort(), 5000);
    }

    return Promise.resolve(fetch(request, { signal })).then((r) => {
      if (controller) {
        clearTimeout(timer);
      }
      return r;
    });
  }

  function status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  }

  function json(response) {
    return response.json();
  }

  useEffect(() => {
    dimFetch('https://tiltify.com/api/v3/users/56859/campaigns/29583')
      .then(status)
      .then(json)
      .then((data) => {
        if (data && data.data) {
          setAmount(data.data.amountRaised);
        }
      })
      .catch((error) => {
        console.log('Request failed', error);
      });
  }, []);

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

  const openTwitter = () => {
    const campaign = window.open('https://twitter.com/ThisIsDIM', '_blank');

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
        <div className="banner">
          <img src={stJudeImage} onClick={openCampaign} />
          <img src={twitter} className="twitter" onClick={openTwitter} />
          {amount > 0 && (
            <div className="progress">
              <div className="underlay">$10k</div>
              <div className="overlay" style={{ width: `${amount / 100}%` }}>
                {`$${amount
                  .toFixed(2)
                  .replace(/\d(?=(\d{3})+\.)/g, '$&,')
                  .slice(0, -3)}`}
              </div>
            </div>
          )}
        </div>
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
            <p>We've got several rewards for donations, and they all stack.</p>
            <ul>
              <li>
                A shout out from DIM on <a href="https://twitter.com/ThisIsDIM">Twitter</a> for
                everyone who donates each day.
              </li>
              <li>Daily Sticker Pack raffle for all $5+ donations that day.</li>
              <li>$10+ donations are entered into two weekly DIM pin raffles.</li>
              <li>$15+ donations are entered into a weekly tee shirt raffle.</li>
              <li>$100+ donations will get DIM Flair in the app for bragging rights.</li>
              <li>
                $250+ donations will get 2 hours of gametime in Destiny with a developer from DIM.
                You bring your friends and pick the game type.
              </li>
              <li>
                The 1st person to donate $500+ will earn a signed ghost from the team behind DIM.
              </li>
            </ul>
          </div>
        </Sheet>
      )}
    </div>
  );
};

export { StJudeToaster };
