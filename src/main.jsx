import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Import Global Styles (CSS Variables, Reset, etc.)
import App from './App.jsx' // Import the Main App Component

// -----------------------------------------------------------------------------
// MAIN ENTRY POINT
// -----------------------------------------------------------------------------
// This file is the "Big Bang" of the React application. 
// It finds the HTML element with id="root" (in index.html) and injects our entire App into it.

createRoot(document.getElementById('root')).render(
  // StrictMode is a development tool that warns about potential problems.
  // It runs checks and warnings for its descendants.
  <StrictMode>
    <App />
  </StrictMode>,
)
