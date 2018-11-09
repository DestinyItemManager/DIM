import * as React from 'react';

interface State {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
}

export default class Developer extends React.Component<{}, State> {
  state: State = {
    apiKey: localStorage.getItem('apiKey') || undefined,
    clientId: localStorage.getItem('oauthClientId') || undefined,
    clientSecret: localStorage.getItem('oauthClientSecret') || undefined
  };

  render() {
    const { apiKey, clientId, clientSecret } = this.state;
    const createAppUrl = 'https://www.bungie.net/en/Application/Create';
    const URL = window.location.origin;
    const URLRet = `${URL}/return.html`;

    let warning;
    if (window.location.protocol === 'http:') {
      warning = 'Bungie.net will not accept the http protocol. Serve over https:// and try again.';
    }

    return (
      <div className="dim-page">
        <h1>Developer Settings</h1>
        {warning ? (
          <div>
            <h3>Configuration Error</h3>
            <span>{warning}</span>
          </div>
        ) : (
          <form onSubmit={this.save}>
            <h3>Configure API Key</h3>
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
                After saving, copy the "API Key" here{' '}
                <input
                  name="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={this.onChange}
                  size={40}
                />
              </li>
              <li>
                Copy the "OAuth client_id" here{' '}
                <input
                  name="clientId"
                  type="text"
                  value={clientId}
                  onChange={this.onChange}
                  size={5}
                />
              </li>
              <li>
                Copy the "OAuth client_secret" here{' '}
                <input
                  name="clientSecret"
                  type="text"
                  value={clientSecret}
                  onChange={this.onChange}
                  size={50}
                />
              </li>
              <li>
                <button>Save</button>
              </li>
            </ol>
          </form>
        )}
      </div>
    );
  }

  private save = () => {
    const { apiKey, clientId, clientSecret } = this.state;
    if (apiKey && clientId && clientSecret) {
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('oauthClientId', clientId);
      localStorage.setItem('oauthClientSecret', clientSecret);
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
}
