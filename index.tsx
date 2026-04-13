
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const mountApp = () => {
  // Load Cloud Config from persistence if it exists
  const configStr = localStorage.getItem('SUPABASE_CONFIG');
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      (window as any).SUPABASE_URL = config.url;
      (window as any).SUPABASE_ANON_KEY = config.key;
    } catch (e) {
      console.error("Invalid cloud config found");
    }
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to render React application:", error);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
