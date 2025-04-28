import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Colors from '../../constants/Colors';

// This hook provides consistent themed styles for screens
export const useThemedStyles = () => {
  const { isDark } = useTheme();

  // Common background colors
  const backgroundColor = isDark ? '#000' : Colors.offWhite;
  const cardBackgroundColor = isDark ? '#222' : '#fff';
  const textColor = isDark ? '#fff' : '#1a1a1a';
  const primaryColor = isDark ? '#81b0ff' : Colors.primaryBlue;
  const borderColor = isDark ? '#444' : Colors.borderLight;
  const menuItemBackground = isDark ? '#333' : Colors.buttonBg;
  const lightTextColor = isDark ? '#ccc' : '#888';

  // Common screen styles
  const screenStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    card: {
      backgroundColor: cardBackgroundColor,
      borderColor,
    },
    text: {
      color: textColor,
    },
    title: {
      color: primaryColor,
      fontWeight: '600',
    },
    subtitle: {
      color: lightTextColor,
    },
    menuItem: {
      backgroundColor: menuItemBackground,
      borderColor,
    }
  });

  return {
    isDark,
    colors: {
      background: backgroundColor,
      card: cardBackgroundColor,
      text: textColor,
      primary: primaryColor,
      border: borderColor,
      menuItem: menuItemBackground,
      lightText: lightTextColor,
    },
    styles: screenStyles,
  };
};