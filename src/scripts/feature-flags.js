import {
  compare
} from './utils';

const featureFlag = {
  isExtension: window.chrome && window.chrome.extension,
  // Tags are off in release right now
  tagsEnabled: !compare('$DIM_FLAVOR', 'release'),
  compareEnabled: true,
  vendorsEnabled: true,
  qualityEnabled: true,
  // Additional debugging / item info tools
  debugMode: false,
  // Print debug info to console about item moves
  debugMoves: false,
  // show changelog toaster
  changelogToaster: compare('$DIM_FLAVOR', 'release') || compare('$DIM_FLAVOR', 'beta'),

  materialsExchangeEnabled: !compare('$DIM_FLAVOR', 'release'),
  // allow importing and exporting your DIM data to JSON
  importExport: compare('$DIM_FLAVOR', 'release')
};

export default featureFlag;
