import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { AuthProvider } from './contexts/AuthContext';
import { ClinicProvider } from './contexts/ClinicContext';
import { ReportsFilterProvider } from './contexts/ReportsFilterContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { I18nProvider } from './contexts/I18nContext';
import { ResponsiveProvider } from './contexts/ResponsiveContext';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import ReportsPage from './components/reports/ReportsPage';
import PatientList from './components/patients/PatientList';
import Scheduler from './components/scheduler/Scheduler';
import TreatmentRecords from './components/treatments/TreatmentRecords';
import Settings from './components/settings/Settings';
import UserManagement from './components/userManagement/UserManagement';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <I18nProvider>
          <ThemeProvider>
            <NotificationProvider>
              <ResponsiveProvider>
                <AuthProvider>
                  <ClinicProvider>
                    <UserPreferencesProvider>
                      <ReportsFilterProvider>
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route 
                            path="/" 
                            element={
                              <ProtectedRoute>
                                <Layout>
                                  <Dashboard />
                                </Layout>
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/dashboard" 
                            element={
                              <ProtectedRoute>
                                <Layout>
                                  <Dashboard />
                                </Layout>
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/reports" 
                            element={
                              <ProtectedRoute>
                                <Layout>
                                  <ReportsPage />
                                </Layout>
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/patients" 
                            element={
                              <ProtectedRoute>
                                <Layout>
                                  <PatientList />
                                </Layout>
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/scheduler" 
                            element={
                              <ProtectedRoute>
                                <Layout>
                                  <Scheduler />
                                </Layout>
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/treatments" 
                            element={
                              <ProtectedRoute>
                                <Layout>
                                  <TreatmentRecords />
                                </Layout>
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/settings" 
                            element={
                              <ProtectedRoute>
                                <Layout>
                                  <Settings />
                                </Layout>
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/users" 
                            element={
                              <ProtectedRoute>
                                <Layout>
                                  <UserManagement />
                                </Layout>
                              </ProtectedRoute>
                            } 
                          />
                        </Routes>
                      </ReportsFilterProvider>
                    </UserPreferencesProvider>
                  </ClinicProvider>
                </AuthProvider>
              </ResponsiveProvider>
            </NotificationProvider>
          </ThemeProvider>
        </I18nProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;