import React from 'react';
import { parse } from 'simple-query-string';
import { registerApp } from 'app/dim-api/register-app';

interface State {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  dimApiKey?: string;
  dimAppName?: string;
}

export default class Developer extends React.Component<{}, State> {
  constructor(props) {
    super(props);
    const urlParams = parse(window.location.href);
    this.state = {
      apiKey: localStorage.getItem('apiKey') || urlParams.apiKey || undefined,
      clientId: localStorage.getItem('oauthClientId') || urlParams.oauthClientId || undefined,
      clientSecret:
        localStorage.getItem('oauthClientSecret') || urlParams.oauthClientSecret || undefined,
      dimApiKey: localStorage.getItem('dimApiKey') || urlParams.dimApiKey || undefined,
      dimAppName: localStorage.getItem('dimAppName') || urlParams.dimAppName || undefined,
    };
  }

  render() {
    const { apiKey, clientId, clientSecret, dimAppName, dimApiKey } = this.state;
    const createAppUrl = 'https://www.bungie.net/en/Application/Create';
    const URL = window.location.origin;
    const URLRet = `${URL}/return.html`;

    let warning;
    if (window.location.protocol === 'http:') {
      warning = 'Bungie.net will not accept the http protocol. Serve over https:// and try again.';
    }

    const prefillLink = `${URL}/developer?apiKey=${apiKey}&oauthClientId=${clientId}&oauthClientSecret=${clientSecret}&dimApiKey=${dimApiKey}&dimAppName=${dimAppName}`;

    return (
      <div className="dim-page">
        <h1>Developer Settings</h1>
        <p>
          To run DIM locally, you need to create and register your own personal app with both the
          Bungie.net and DIM APIs.
        </p>
        {apiKey && clientId && clientSecret && dimAppName && dimApiKey && (
          <a href={prefillLink}>
            Open this link in another browser to clone these settings to DIM there
          </a>
        )}
        {warning ? (
          <div>
            <h3>Configuration Error</h3>
            <span>{warning}</span>
          </div>
        ) : (
          <form onSubmit={this.save}>
            <h3>Bungie.net API Key</h3>
            <ol>
              <li>
                Visit{' '}
                <a href={createAppUrl} target="_blank">
                  {createAppUrl}
                </a>
              </li>
              <li>
                Paste{' '}
                <input name="redirectUrl" type="text" value={URLRet} readOnly={true} size={30} />{' '}
                into the "Redirect URL" section under "App Authentication".
              </li>
              <li>
                Paste{' '}
                <input name="originHeader" type="text" value={URL} readOnly={true} size={20} /> into
                the "Origin Header" section under "Browser Based Apps".
              </li>
              <li>Select "Confidential" OAuth type.</li>
              <li>
                After saving, copy the "API Key" here:
                <br />
                <input
                  name="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={this.onChange}
                  size={40}
                />
              </li>
              <li>
                Copy the "OAuth client_id" here:
                <br />
                <input
                  name="clientId"
                  type="text"
                  value={clientId}
                  onChange={this.onChange}
                  size={5}
                />
              </li>
              <li>
                Copy the "OAuth client_secret" here:
                <br />
                <input
                  name="clientSecret"
                  type="text"
                  value={clientSecret}
                  onChange={this.onChange}
                  size={50}
                />
              </li>
            </ol>

            <h3>DIM API Key</h3>
            <ol>
              <li>
                Choose a name for your DIM API app (only required to create or recover your API
                key). This should be in the form of "yourname-dev" and will show up in API audit
                logs.
                <br />
                <input
                  name="dimAppName"
                  type="text"
                  value={dimAppName}
                  onChange={this.onChange}
                  size={25}
                />
                <button
                  type="button"
                  className="dim-button"
                  onClick={this.getDimApiKey}
                  disabled={!apiKey || !dimAppName || dimAppName.length < 6}
                >
                  Get API Key
                </button>
              </li>
              <li>
                DIM API key
                <br />
                <input
                  name="clientSecret"
                  type="dimApiKey"
                  value={dimApiKey}
                  size={36}
                  readOnly={true}
                />
              </li>
            </ol>
            <button
              type="submit"
              className="dim-button"
              disabled={!(apiKey && clientId && clientSecret && dimAppName && dimApiKey)}
            >
              Save API Keys
            </button>
          </form>
        )}
      </div>
    );
  }

  private save = (e) => {
    e.preventDefault();
    const { apiKey, clientId, clientSecret, dimAppName, dimApiKey } = this.state;
    if (apiKey && clientId && clientSecret && dimAppName && dimApiKey) {
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('oauthClientId', clientId);
      localStorage.setItem('oauthClientSecret', clientSecret);
      localStorage.setItem('dimAppName', dimAppName);
      localStorage.setItem('dimApiKey', dimApiKey);
      localStorage.removeItem('dimApiToken');
      localStorage.removeItem('authorization');
      window.location.href = `${window.location.origin}/index.html`;
    } else {
      alert('You need to fill in the whole form');
    }
  };

  private onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      console.error(new Error('You need to have a name on the form input'));
    }

    this.setState({ [e.target.name]: e.target.value });
  };

  private getDimApiKey = async (e) => {
    e.preventDefault();
    const { apiKey, dimAppName } = this.state;
    try {
      const app = await registerApp(dimAppName!, apiKey!);
      this.setState({ dimApiKey: app.dimApiKey });
    } catch (e) {
      alert(e.message);
    }
  };
}
