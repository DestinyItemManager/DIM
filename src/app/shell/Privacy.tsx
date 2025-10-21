import ExternalLink from 'app/dim-ui/ExternalLink';
import StaticPage from 'app/dim-ui/StaticPage';
import { Link } from 'react-router';
import * as styles from './Privacy.m.scss';

export default function Privacy() {
  return (
    <StaticPage className={styles.privacy}>
      <h1>Privacy Policy</h1>
      <p>Last updated August 23, 2020</p>

      <ol style={{ padding: 0, listStylePosition: 'inside' }}>
        <li>
          <strong>Introduction.</strong>
          <ol>
            <li>
              Destiny Item Manager ("DIM") is a free, open source, fan made service for the Destiny
              and Destiny 2 video games. This privacy policy explains how your data is used by this
              application.
            </li>
            <li>
              DIM is constantly improving, and we may modify this Privacy Policy from time to time
              to reflect changes in our privacy practices. You are encouraged to review this Privacy
              Policy periodically and to check the "Last Updated" date at the top of the Privacy
              Policy for the most recent version.
            </li>
          </ol>
        </li>

        <li>
          <strong>How we use your personal data.</strong>
          <ol>
            <li>
              <strong>Usage data.</strong>
              <ol>
                <li>
                  We may process data about your use of our website and services ("usage data"). The
                  usage data may include your IP address, geographical location, browser type and
                  version, operating system, referral source, length of visit, page views and
                  website navigation paths, as well as information about the timing, frequency and
                  pattern of your service use. The source of the usage data is our analytics
                  tracking system. This usage data may be processed for the purposes of analyzing
                  the use of the website and services. The legal basis for this processing is your
                  consent or our legitimate interests, namely monitoring and improving our website
                  and services.
                </li>
                <li>
                  We may use Google Analytics to analyze the use of our website. Google Analytics
                  gathers information about website use by means of cookies. The information
                  gathered relating to our website is used to create reports about the use of our
                  website. Besides generic usage data, we also share your Bungie.net membership ID
                  with Google Analytics to help provide a more accurate measure of how users use
                  DIM. Google's privacy policy is available at:{' '}
                  <ExternalLink href="https://www.google.com/policies/privacy/">
                    https://www.google.com/policies/privacy/
                  </ExternalLink>
                  . We respect the Do Not Track setting. If you want to opt out of Google Analytics,
                  you may use the{' '}
                  <ExternalLink href="https://chrome.google.com/webstore/detail/google-analytics-opt-out/fllaojicojecljbmefodhfapmkghcbnh?hl=en">
                    Google Analytics Opt Out Extension for Chrome
                  </ExternalLink>{' '}
                  or similar tools for other browsers.
                </li>
              </ol>
            </li>

            <li>
              <strong>Destiny and Bungie account info.</strong>
              <ol>
                <li>
                  In order to display and manipulate Destiny game information, DIM uses the
                  Bungie.net API. You must grant permission for DIM to use this API through
                  Bungie.net. The only information DIM receives, or has access to, is your game
                  information (items, characters, etc.) and basic account information including your
                  Bungie.net membership ID, and the identifiers of any linked services such as your
                  public PSN, Xbox Live, Steam, Stadia, Blizzard or Bungie.net usernames. We do not
                  have access to your email, name, address, payment information, or any other
                  personal information held by Bungie or the game platforms.
                </li>
                <li>
                  DIM only stores your Destiny and Bungie information locally on your own device and
                  in memory, in order to provide DIM's functionality. We do not store any of this
                  information anywhere that the DIM maintainers and contributors can access it.
                </li>
                <li>
                  Use of the Bungie.net API is governed by the{' '}
                  <ExternalLink href="https://www.bungie.net/7/en/Legal/Terms">
                    Terms of Use
                  </ExternalLink>{' '}
                  and{' '}
                  <ExternalLink href="https://www.bungie.net/7/en/Legal/PrivacyPolicy">
                    Privacy Policy
                  </ExternalLink>{' '}
                  for Bungie.net.
                </li>
              </ol>
            </li>

            <li>
              <strong>DIM Sync: Settings (preferences), loadouts, tags and notes.</strong>
              <ol>
                <li>
                  DIM allows you to connect to DIM Sync, a cloud service operated by the DIM team,
                  in order to store your data and sync it between instances of DIM or other Destiny
                  apps. This information is only accessible to you and the DIM team. Information
                  stored in DIM Sync includes your DIM preferences and settings, loadouts, any
                  per-item item tags and notes, saved and recently used search filters, and tracked
                  triumphs. Your Bungie.net authentication information is sent to DIM Sync only in
                  order to verify your account - it is not saved.
                </li>
              </ol>
            </li>

            {$featureFlags.sentry && (
              <li>
                <strong>Sentry: Error reporting</strong>
                <ol>
                  <li>
                    Errors encountered while using DIM may be sent to Sentry, a service provided by
                    Functional Software, Inc. These error reports contain information about your
                    browser, recent actions in DIM as well as the details of any errors. No personal
                    information is shared with Sentry.
                  </li>
                  <li>
                    Use of Sentry for error reporting is governed by the Sentry{' '}
                    <ExternalLink href="https://sentry.io/terms/">Terms of Service</ExternalLink>{' '}
                    and{' '}
                    <ExternalLink href="https://sentry.io/privacy/">Privacy Policy</ExternalLink>.
                  </li>
                </ol>
              </li>
            )}
          </ol>
        </li>

        <li>
          <strong>Who can I ask if I have additional questions?</strong>
          <ol>
            <li>
              For additional inquiries about the privacy of your information, you can contact us via
              any of the means listed on our <Link to="/about">About page</Link>
            </li>
          </ol>
        </li>
      </ol>
    </StaticPage>
  );
}
