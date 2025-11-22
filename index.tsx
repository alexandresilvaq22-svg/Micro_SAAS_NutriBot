import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Assegura que o TypeScript entenda o root como HTMLElement
const rootElement = document.getElementById('root') as HTMLElement;

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);