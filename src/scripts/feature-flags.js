const featureFlag = {
  isExtension: window.chrome && window.chrome.extension,
  tagsEnabled: true,
  compareEnabled: true,
  vendorsEnabled: true,
  qualityEnabled: true,
  debugMode: false,                           // Additional debugging / item info tools
  debugMoves: false,                          // Print debug info to console about item moves
  changelogToaster: $DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta',   // show changelog toaster
  materialsExchangeEnabled: $DIM_FLAVOR !== 'release',
  importExport: $DIM_FLAVOR !== 'release'     // allow importing and exporting your DIM data to JSON
};

export default featureFlag;
