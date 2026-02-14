import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AuthApp from './AuthApp';
import { NotificationProvider } from './contexts/NotificationContext';
import { I18nProvider } from './contexts/I18nContext';
import { AuthProvider } from './contexts/AuthContext';
import ToastContainer from './components/ToastContainer';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <NotificationProvider>
        <AuthProvider>
          <AuthApp />
          <ToastContainer />
        </AuthProvider>
      </NotificationProvider>
    </I18nProvider>
  </React.StrictMode>
);