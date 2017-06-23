let apiKey;

if ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') {
  if (window.chrome && window.chrome.extension) {
    apiKey = $DIM_API_KEY;
  } else {
    apiKey = $DIM_WEB_API_KEY;
  }
} else {
  apiKey = localStorage.apiKey;
}

function bungieApiUpdate(path, data) {
  return {
    method: 'POST',
    url: 'https://www.bungie.net' + path,
    headers: {
      'X-API-Key': apiKey
    },
    withCredentials: true,
    dataType: 'json',
    data: data
  };
}

function bungieApiQuery(path) {
  return {
    method: 'GET',
    url: 'https://www.bungie.net' + path,
    headers: {
      'X-API-Key': apiKey
    },
    withCredentials: true
  };
}

function oauthClientId() {
  let clientId;
  if ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') {
    if (window.chrome && window.chrome.extension) {
      clientId = $DIM_CLIENT_ID;
    } else {
      clientId = $DIM_WEB_CLIENT_ID;
    }
  } else {
    clientId = localStorage.oauthClientId;
  }
  return clientId;
}

function oauthClientSecret() {
  let clientSecret;
  if ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') {
    if (window.chrome && window.chrome.extension) {
      clientSecret = $DIM_CLIENT_SECRET;
    } else {
      clientSecret = $DIM_WEB_CLIENT_SECRET;
    }
  } else {
    clientSecret = localStorage.oauthClientSecret;
  }
  return clientSecret;
}

export {
  bungieApiQuery,
  bungieApiUpdate,
  oauthClientId,
  oauthClientSecret
};
