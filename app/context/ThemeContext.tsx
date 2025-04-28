import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  colorScheme: ColorSchemeName;
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>('light');

  // Load saved theme on startup
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme !== null) {
          setColorScheme(savedTheme as ColorSchemeName);
        } else {
          // Use system default if no saved preference
          setColorScheme(Appearance.getColorScheme());
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadSavedTheme();

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      // Only update if user hasn't set a preference
      AsyncStorage.getItem('userTheme').then(savedTheme => {
        if (!savedTheme) {
          setColorScheme(newColorScheme);
        }
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const toggleTheme = async () => {
    const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newTheme);
    try {
      await AsyncStorage.setItem('userTheme', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        colorScheme, 
        toggleTheme,
        isDark: colorScheme === 'dark'
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);