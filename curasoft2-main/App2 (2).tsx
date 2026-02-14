import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import PatientList from './components/PatientList';
import Dashboard from './components/Dashboard';
import Scheduler from './components/Scheduler';
import DoctorList from './components/DoctorList';
import Reports from './components/Reports';
import PatientReportPage from './components/reports/PatientReportPage';
import DoctorReportPage from './components/reports/DoctorReportPage';
import SupplierReportPage from './components/reports/SupplierReportPage';
import UserManagement from './components/UserManagement';
import { useClinicData, ClinicData } from './hooks/useClinicData';
import BottomNavBar from './components/BottomNavBar';
import { View, Appointment, LabCaseStatus } from './types';
import { useI18n } from './hooks/useI18n';
import { useAuth } from './contexts/AuthContext';

// Import newly separated finance components
import { SuppliersManagement } from './components/finance/SuppliersManagement';
import InventoryManagement from './components/finance/InventoryManagement';
import LabCaseManagement from './components/finance/LabCaseManagement';
import ExpensesManagement from './components/finance/ExpensesManagement';
import TreatmentDefinitionManagement from './components/finance/TreatmentDefinitionManagement';
import Settings from './components/Settings';

const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const WhatsAppIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.062 17.498a9.423 9.423 0 0 1-4.71-1.392l-5.13.84 1.09-4.992a9.423 9.423 0 0 1-1.282-5.024C2.03 3.018 6.54-1.5 12 .002c5.46 1.5 8.97 7.018 7.47 12.478a9.423 9.423 0 0 1-7.408 5.02z"/></svg>);
const InventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const LabCaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;


type NotificationItem = {
    id: string;
    type: 'appointment' | 'inventory' | 'lab';
    title: string;
    description: string;
    action?: () => void;
    actionLabel?: string;
    data: any;
};

interface NotificationBellProps {
    clinicData: ClinicData;
    setCurrentView: (view: View) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ clinicData, setCurrentView }) => {
    const { t, locale } = useI18n();
    const { patients, appointments, updateAppointment, inventoryItems, labCases } = clinicData;
    const [isOpen, setIsOpen] = useState(false);

    const notifications = useMemo(() => {
        const allNotifications: NotificationItem[] = [];
        const now = new Date();
        const lowStockThreshold = 10;
        const labCaseDueThresholdDays = 3;

        // 1. Appointment Reminders
        appointments.forEach(apt => {
            if (apt.reminderSent || apt.reminderTime === 'none' || apt.startTime < now) return;
            
            const aptTime = apt.startTime.getTime();
            let reminderThreshold = 0;
            if (apt.reminderTime === '1_hour_before') reminderThreshold = 60 * 60 * 1000;
            else if (apt.reminderTime === '2_hours_before') reminderThreshold = 2 * 60 * 60 * 1000;
            else if (apt.reminderTime === '1_day_before') reminderThreshold = 24 * 60 * 60 * 1000;
            
            if ((aptTime - now.getTime()) <= reminderThreshold) {
                const patient = patients.find(p => p.id === apt.patientId);
                allNotifications.push({
                    id: `apt_${apt.id}`,
                    type: 'appointment',
                    title: patient?.name || t('common.unknownPatient'),
                    description: `${apt.reason} at ${new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(apt.startTime)}`,
                    actionLabel: t('reminders.sendReminder'),
                    action: () => handleSendReminder(apt),
                    data: apt
                });
            }
        });
        
        // 2. Low Inventory Alerts
        inventoryItems.forEach(item => {
            if (item.currentStock <= lowStockThreshold) {
                 allNotifications.push({
                    id: `inv_${item.id}`,
                    type: 'inventory',
                    title: t('notifications.lowStockAlert'),
                    description: t('notifications.lowStockMessage', {itemName: item.name, count: item.currentStock}),
                    actionLabel: t('sidebar.inventory'),
                    action: () => { setCurrentView('inventory'); setIsOpen(false); },
                    data: item
                });
            }
        });

        // 3. Lab Cases Due
        labCases.forEach(lc => {
             if ([LabCaseStatus.FITTED_TO_PATIENT, LabCaseStatus.CANCELLED].includes(lc.status)) return;
             const dueDate = new Date(lc.dueDate);
             const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
             if(diffDays <= labCaseDueThresholdDays) {
                const patient = patients.find(p => p.id === lc.patientId);
                allNotifications.push({
                    id: `lab_${lc.id}`,
                    type: 'lab',
                    title: t('notifications.labCaseDueAlert'),
                    description: t('notifications.labCaseDueMessage', { caseType: lc.caseType, patientName: patient?.name || '', date: new Intl.DateTimeFormat(locale).format(dueDate)}),
                    actionLabel: t('sidebar.labCases'),
                    action: () => { setCurrentView('labCases'); setIsOpen(false); },
                    data: lc
                });
             }
        });

        return allNotifications;
    }, [appointments, inventoryItems, labCases, patients, setCurrentView, t, locale]);


    const handleSendReminder = (appointment: Appointment) => {
        const patient = patients.find(p => p.id === appointment.patientId);
        const dentist = clinicData.dentists.find(d => d.id === appointment.dentistId);
        if (!patient) return;

        let phoneNumber = patient.phone.replace(/[^0-9]/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = phoneNumber.substring(1);
        }
        // Assuming an Egyptian country code for now
        const internationalPhoneNumber = `20${phoneNumber}`;

        const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
        const timeFormatter = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });

        const message = clinicData.reminderMessageTemplate
            .replace(/\{patientName\}/g, patient.name)
            .replace(/\{doctorName\}/g, dentist?.name || '')
            .replace(/\{clinicName\}/g, clinicData.clinicInfo.name || 'عيادة كيوراسوف')
            .replace(/\{appointmentDate\}/g, dateFormatter.format(appointment.startTime))
            .replace(/\{appointmentTime\}/g, timeFormatter.format(appointment.startTime))
            .replace(/\{clinicAddress\}/g, clinicData.clinicInfo.address || '')
            .replace(/\{clinicPhone\}/g, clinicData.clinicInfo.phone || '');

        const url = `https://wa.me/${internationalPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        updateAppointment({ ...appointment, reminderSent: true });
        if (notifications.length <= 1) {
            setIsOpen(false);
        }
    };


    const renderNotificationContent = (item: NotificationItem) => {
        switch(item.type) {
            case 'appointment':
                return (
                     <button 
                        onClick={item.action}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-300"
                    >
                        <WhatsAppIcon /> {item.actionLabel}
                    </button>
                );
            case 'inventory':
            case 'lab':
                 return (
                    <button 
                        onClick={item.action}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1 bg-sky-100 text-sky-800 rounded-lg hover:bg-sky-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                        {item.type === 'inventory' ? <InventoryIcon/> : <LabCaseIcon />} {item.actionLabel}
                    </button>
                );
            default:
                return null;
        }
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(prev => !prev)} 
                className="relative p-2 rounded-full hover:bg-slate-200"
                aria-label={t('reminders.toggleNotifications')}
            >
                <BellIcon />
                {notifications.length > 0 && (
                    <span className="absolute top-0 end-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                        {notifications.length}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute end-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-20">
                    <div className="p-3 border-b">
                        <h4 className="font-semibold text-slate-800">{t('reminders.pendingReminders')}</h4>
                    </div>
                    {notifications.length > 0 ? (
                        <ul className="max-h-96 overflow-y-auto">
                            {notifications.map(item => (
                                <li key={item.id} className="p-3 hover:bg-slate-50 border-b last:border-b-0">
                                    <p className="font-semibold text-sm">{item.title}</p>
                                    <p className="text-xs text-slate-600">{item.description}</p>
                                    {renderNotificationContent(item)}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-4 text-center text-sm text-slate-500">{t('reminders.noPendingReminders')}</p>
                    )}
                </div>
            )}
        </div>
    );
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const clinicData = useClinicData();
  const { t, direction, locale } = useI18n();
  const { isAdmin, hasPermission, loading: authLoading } = useAuth();

  console.log('App rendering - auth loading:', authLoading);
  console.log('App rendering - clinic data available:', !!clinicData);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  const renderView = useCallback(() => {
    // Permission checks based on user roles
    const { userProfile } = useAuth();

    switch (currentView) {
      case 'dashboard':
        return userProfile?.permissions?.includes('view_dashboard') ? <Dashboard clinicData={clinicData} setCurrentView={setCurrentView} /> : <div className="text-center py-8">Access denied.</div>;
      case 'patients':
        return userProfile?.permissions?.includes('view_patients') ? <PatientList clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'scheduler':
        return userProfile?.permissions?.includes('view_scheduler') ? <Scheduler clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'doctors':
        return userProfile?.permissions?.includes('view_patients') ? <DoctorList clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'suppliers':
        return userProfile?.permissions?.includes('view_finance') ? <SuppliersManagement clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'inventory':
        return userProfile?.permissions?.includes('view_finance') ? <InventoryManagement clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'labCases':
        return userProfile?.permissions?.includes('view_finance') ? <LabCaseManagement clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'expenses':
        return userProfile?.permissions?.includes('view_finance') ? <ExpensesManagement clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'treatmentDefinitions':
        return userProfile?.permissions?.includes('view_finance') ? <TreatmentDefinitionManagement clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'reports':
        return userProfile?.permissions?.includes('view_reports') ? <Reports clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;

      case 'settings':
        return userProfile?.permissions?.includes('view_dashboard') ? <Settings clinicData={clinicData} /> : <div className="text-center py-8">Access denied.</div>;
      case 'userManagement':
        return isAdmin ? <UserManagement /> : <div className="text-center py-8">Access denied. Admin privileges required.</div>;
      default:
        return userProfile?.permissions?.includes('view_dashboard') ? <Dashboard clinicData={clinicData} setCurrentView={setCurrentView} /> : <div className="text-center py-8">Access denied.</div>;
    }
  }, [currentView, clinicData, setCurrentView]);
  
  const viewTitles: Record<View, string> = {
      dashboard: t('sidebar.dashboard'),
      patients: t('patientManagement.title'),
      scheduler: t('appointmentScheduler.title'),
      doctors: t('doctorManagement.title'),
      suppliers: t('suppliersManagement.title'),
      inventory: t('inventoryManagement.title'),
      labCases: t('labCasesManagement.title'),
      expenses: t('expensesManagement.title'),
      treatmentDefinitions: t('treatmentDefinitionsManagement.title'),
      reports: t('sidebar.reports'),
      settings: t('sidebar.settings'),
      userManagement: 'User Management',
  }

  // Show loading state while auth is loading
  if (authLoading) {
    console.log('Showing loading state - auth still loading');
    return (
      <div className="bg-neutral-light text-slate-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering main app content');
  return (
    <div className="bg-neutral-light text-slate-800 min-h-screen">
      <div className="md:flex">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <div className="flex-1 flex flex-col w-full print:block">
            <header className="bg-white shadow-sm p-4 z-10 sticky top-0 md:static print:hidden"> {/* Hide header in print */}
                <div className="flex items-center justify-between">
                    <img src="/vite.svg" alt={t('appName')} className="h-8 w-8 me-3 md:hidden"/>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-700">{viewTitles[currentView]}</h1>
                    <NotificationBell clinicData={clinicData} setCurrentView={setCurrentView} />
                </div>
            </header>
            <main className="flex-1 bg-neutral p-4 md:p-6 pb-24 md:pb-6 print:p-0 print:pb-0 print:block"> {/* Adjust padding for print */}
              {renderView()}
            </main>
        </div>
      </div>
      <BottomNavBar currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

export default App;