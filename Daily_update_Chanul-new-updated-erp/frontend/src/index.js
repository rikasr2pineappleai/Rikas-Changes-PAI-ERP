import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Import navigation interceptor to prevent access to cached protected pages
import './utils/navigationInterceptor';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

