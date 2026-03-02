import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthApp from './AuthApp';
import { NotificationProvider } from './contexts/NotificationContext';
import { I18nProvider } from './contexts/I18nContext';
import { AuthProvider } from './contexts/AuthContext';
import { ReportsFilterProvider } from './contexts/ReportsFilterContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <NotificationProvider>
            <AuthProvider>
              <ReportsFilterProvider>
                <AuthApp />
                <ToastContainer />
              </ReportsFilterProvider>
            </AuthProvider>
          </NotificationProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
);

