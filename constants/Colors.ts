const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

// Main app colors
const appColors = {
  primaryBlue: '#002d4e',
  offWhite: '#f8f8f8',     // Slightly off-white background
  headerBg: '#f8f8f8',     // Header background
  tabBarBg: '#f8f8f8',     // Tab bar background
  borderLight: '#f0f0f0',  // Light borders
  buttonBg: '#f4f4f4',     // Button backgrounds
};

export default {
  light: {
    text: '#000',
    background: appColors.offWhite,
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
  ...appColors,
};