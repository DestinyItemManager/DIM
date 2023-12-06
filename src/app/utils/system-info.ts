import UAParser from 'ua-parser-js';

export const [systemInfo, browserName, browserVersion] = getSystemInfo();

function getSystemInfo() {
  const parser = new UAParser();
  const { name: browserName, version: browserVersion } = parser.getBrowser();
  const { name: osName, version: osVersion } = parser.getOS();
  const userAgent = parser.getUA();
  const dimAppStoreIndex = userAgent.indexOf('DIM AppStore');
  let browserInfo = `${browserName} ${browserVersion}`;
  if (dimAppStoreIndex >= 0) {
    browserInfo = userAgent.substring(dimAppStoreIndex);
  }

  const info = `${browserInfo} - ${osName} ${osVersion}`;
  return [info, browserName, browserVersion] as const;
}
