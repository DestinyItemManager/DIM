const INITIAL_STATE = {
  platforms: [],
  platform: null
};

export default function platforms(state = INITIAL_STATE, action) {
  if (!action || !action.type) {
    return state;
  }

  switch (action.type) {
  case 'ADD_PLATFORM':
    return {
      platforms: [...state.platforms, action.payload],
      platform: state.platform
    };
  default:
    return state;
  }
}