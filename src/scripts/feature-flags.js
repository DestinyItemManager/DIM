const featureFlag = {
  isExtension: window.chrome && window.chrome.extension,
  // Tags are off in release right now
  tagsEnabled: $DIM_FLAVOR !== 'release',
  compareEnabled: true,
  vendorsEnabled: true,
  qualityEnabled: true,
  // Additional debugging / item info tools
  debugMode: false,
  // Print debug info to console about item moves
  debugMoves: false,
  // show changelog toaster
  changelogToaster: $DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta',
  sendingWeaponDataEnabled: true,

  materialsExchangeEnabled: $DIM_FLAVOR !== 'release',
  // allow importing and exporting your DIM data to JSON
  importExport: $DIM_FLAVOR !== 'release'
};

export default featureFlag;
