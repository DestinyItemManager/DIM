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

function bungieApiUpdate(path, data, ver) {
  if (!ver) {
    if (path.includes("/Platform/Destiny")) {
      ver = '/D1';
    } else {
      ver = '';
    }
  }
  return {
    method: 'POST',
    url: 'https://www.bungie.net' + ver + path,
    headers: {
      'X-API-Key': apiKey
    },
    withCredentials: true,
    dataType: 'json',
    data: data
  };
}

function bungieApiQuery(path, ver) {
  if (!ver) {
    if (path.includes("/Platform/Destiny")) {
      ver = '/D1';
    } else {
      ver = '';
    }
  }
  return {
    method: 'GET',
    url: 'https://www.bungie.net' + ver + path,
    headers: {
      'X-API-Key': apiKey
    },
    withCredentials: true
  };
}

export {
  bungieApiQuery,
  bungieApiUpdate
};
