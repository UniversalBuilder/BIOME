import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
  theme: 'light'
});

export { ThemeContext };
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('biome_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let shouldUseDark = false;
    
    if (savedTheme) {
      shouldUseDark = savedTheme === 'dark';
    } else {
      // Respect system preference as default
      shouldUseDark = systemPrefersDark;
      localStorage.setItem('biome_theme', shouldUseDark ? 'dark' : 'light');
    }
    
    setIsDarkMode(shouldUseDark);
    applyTheme(shouldUseDark);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (!localStorage.getItem('biome_theme_manual_override')) {
        const newTheme = e.matches;
        setIsDarkMode(newTheme);
        applyTheme(newTheme);
        localStorage.setItem('biome_theme', newTheme ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const applyTheme = (darkMode) => {
    const html = document.documentElement;
    const body = document.body;
    
    if (darkMode) {
      html.classList.add('dark');
      body.classList.add('dark');
      body.classList.remove('theme-pandora-day');
      body.classList.add('theme-pandora-night');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
      body.classList.add('theme-pandora-day');
      body.classList.remove('theme-pandora-night');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    applyTheme(newMode);
    localStorage.setItem('biome_theme', newMode ? 'dark' : 'light');
    localStorage.setItem('biome_theme_manual_override', 'true');
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      toggleDarkMode, 
      theme: isDarkMode ? 'dark' : 'light' 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};