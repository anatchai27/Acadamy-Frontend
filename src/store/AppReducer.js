export function AppReducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload };
    case 'SET_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'CLEAR_USER':
      return { ...state, user: null, userProfile: null, isAuthenticated: false };
    default:
      return state;
  }
}
