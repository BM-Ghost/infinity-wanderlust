import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const changeTheme = (newTheme) => setTheme(newTheme);
  const changeLanguage = (newLanguage) => setLanguage(newLanguage);

  return (
    <ThemeContext.Provider value={{ theme, language, changeTheme, changeLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
