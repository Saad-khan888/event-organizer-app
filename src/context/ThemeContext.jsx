import React, { createContext, useContext, useState, useEffect } from 'react';

// -----------------------------------------------------------------------------
// CONTEXT: THEME (Light / Dark Mode)
// -----------------------------------------------------------------------------
// This context manages the "Look and Feel" of the app.
// It allows any part of the app to check if we are in Dark Mode or Light Mode.

const ThemeContext = createContext();

// Shortcut hook for using the theme in components
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {

    // 1. INITIALIZATION
    // When the app starts, check if the user previously saved a preference (Dark or Light).
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('app_theme');
        if (savedTheme) return savedTheme;
        return 'light'; // Default to Light Mode if it's their first time visiting.
    });

    // 2. THEME APPLICATION
    // Every time the 'theme' state changes, we do two things:
    // A. Save it to the browser's memory (LocalStorage) so it persists on reload.
    // B. Inject a 'data-theme' attribute into the HTML <html> tag. 
    //    The CSS (index.css) uses this to switch colors automatically.
    useEffect(() => {
        localStorage.setItem('app_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // 3. TOGGLE FUNCTION
    // A simple function to flip the switch.
    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
