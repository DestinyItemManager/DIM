import { registerApp } from 'app/dim-api/register-app';
import React, { useState } from 'react';

const createAppUrl = 'https://www.bungie.net/en/Application/Create';

export default function Developer(this: never) {
  const urlParams = new URLSearchParams(window.location.search);

  // Load parameters from either local storage or the URL
  function useDevParam(param: string) {
    return useState(() => localStorage.getItem(param) || urlParams.get(param) || undefined);
  }

  const [apiKey, setApiKey] = useDevParam('apiKey');
  const [clientId, setClientId] = useDevParam('oauthClientId');
  const [clientSecret, setClientSecret] = useDevParam('oauthClientSecret');
  const [dimApiKey, setDimApiKey] = useDevParam('dimApiKey');
  const [dimAppName, setDimAppName] = useDevParam('dimAppName');

  const URL = window.location.origin;
  const URLRet = `${URL}/return.html`;

  let warning;
  if (window.location.protocol === 'http:') {
    warning = 'Bungie.net will not accept the http protocol. Serve over https:// and try again.';
  }

  const prefillLink = `${URL}/developer?apiKey=${apiKey}&oauthClientId=${clientId}&oauthClientSecret=${clientSecret}&dimApiKey=${dimApiKey}&dimAppName=${dimAppName}`;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey && clientId && clientSecret && dimAppName && dimApiKey) {
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('oauthClientId', clientId);
      localStorage.setItem('oauthClientSecret', clientSecret);
      localStorage.setItem('dimAppName', dimAppName);
      localStorage.setItem('dimApiKey', dimApiKey);
      localStorage.removeItem('dimApiToken');
      localStorage.removeItem('authorization');
      window.location.href = window.location.origin;
    } else {
      // eslint-disable-next-line no-alert
      alert('You need to fill in the whole form');
    }
  };

  const onChange =
    (
      setter: React.Dispatch<React.SetStateAction<string | undefined>>
    ): React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> =>
    (e) => {
      setter(e.target.value);
    };

  const getDimApiKey = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!dimAppName || !apiKey) {
      return;
    }
    try {
      const app = await registerApp(dimAppName, apiKey);
      setDimApiKey(app.dimApiKey);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message);
    }
  };

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
        <form onSubmit={save}>
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
              <input name="redirectUrl" type="text" value={URLRet} readOnly={true} size={30} /> into
              the "Redirect URL" section under "App Authentication".
            </li>
            <li>
              Paste <input name="originHeader" type="text" value={URL} readOnly={true} size={20} />{' '}
              into the "Origin Header" section under "Browser Based Apps".
            </li>
            <li>Select "Confidential" OAuth type.</li>
            <li>
              After saving, copy the "API Key" here:
              <br />
              <input
                name="apiKey"
                type="text"
                value={apiKey}
                onChange={onChange(setApiKey)}
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
                onChange={onChange(setClientId)}
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
                onChange={onChange(setClientSecret)}
                size={50}
              />
            </li>
          </ol>

          <h3>DIM API Key</h3>
          <ol>
            <li>
              Choose a name for your DIM API app (only required to create or recover your API key).
              This should be in the form of "yourname-dev" and will show up in API audit logs. (min
              length: 3, chars allowed [a-z0-9-])
              <br />
              <input
                name="dimAppName"
                type="text"
                value={dimAppName}
                onChange={onChange(setDimAppName)}
                size={25}
              />
              <button
                type="button"
                className="dim-button"
                onClick={getDimApiKey}
                disabled={!apiKey || !dimAppName || !dimAppName.match(/^[a-z0-9-]{3,}$/)}
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
