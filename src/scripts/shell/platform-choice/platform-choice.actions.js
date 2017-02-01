export function updatePlatforms(platforms) {
  return {
    type: 'ADD_PLATFORMS',
    platforms
  };
}

export default {
  updatePlatforms
};