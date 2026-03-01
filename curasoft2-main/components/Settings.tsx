import React, { useState, useRef, useCallback } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { useI18n } from '../hooks/useI18n';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { NotificationType } from '../types';
import { 
  useUserPreferences, 
  ViewMode, 
  PageViewPreferences,
  NotificationPreferences,
  PrintExportPreferences,
  DashboardPreferences,
  TablePreferences
} from '../contexts/UserPreferencesContext';

// Icons
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const TableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M12 3v18" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const PrintIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const LayoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const TableSettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M12 3v18M5 10h14a2 2 0 012 2v0a2 2 0 01-2 2H5a2 2 0 01-2-2v0a2 2 0 012-2z" />
  </svg>
);

const AccessibilityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

type TabType = 'general' | 'display' | 'notifications' | 'print' | 'dashboard' | 'table' | 'accessibility' | 'privacy' | 'clinic' | 'templates' | 'data' | 'sample' | 'danger';

// Page view labels mapping
const pageViewLabels: Record<keyof PageViewPreferences, string> = {
  inventory: 'Inventory',
  patients: 'Patients',
  doctors: 'Doctors',
  suppliers: 'Suppliers',
  purchaseOrders: 'Purchase Orders',
  expenses: 'Expenses',
  appointments: 'Appointments',
  treatments: 'Treatments',
  prescriptions: 'Prescriptions',
  labCases: 'Lab Cases',
  financialAccounts: 'Financial Accounts',
  reports: 'Reports',
};

interface SettingsProps {
  clinicData: ClinicData;
}

const Settings: React.FC<SettingsProps> = ({ clinicData }) => {
  const { locale, setLocale } = useI18n();
  const { addNotification } = useNotification();
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreferences, resetPreferences, exportPreferences, importPreferences } = useUserPreferences();
  const { isAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [preferencesFile, setPreferencesFile] = useState<File | null>(null);
  
  // Clinic info state
  const [clinicName, setClinicName] = useState(clinicData.clinicInfo?.name || '');
  const [clinicAddress, setClinicAddress] = useState(clinicData.clinicInfo?.address || '');
  const [clinicPhone, setClinicPhone] = useState(clinicData.clinicInfo?.phone || '');
  const [clinicEmail, setClinicEmail] = useState(clinicData.clinicInfo?.email || '');
  const [clinicLogo, setClinicLogo] = useState(clinicData.clinicInfo?.logo || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(clinicData.clinicInfo?.logo || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preferencesInputRef = useRef<HTMLInputElement>(null);
  
  // Template states
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    localStorage.getItem('curasoft_whatsapp_template') ||
    'Hello {{patientName}}, this is {{clinicName}}. How can we help you today?'
  );
  const [reminderTemplate, setReminderTemplate] = useState(
    localStorage.getItem('curasoft_reminder_template') ||
    'Hello {{patientName}}, this is a reminder from {{clinicName}} for your appointment on {{appointmentDate}} at {{appointmentTime}}.'
  );
  const [prescriptionTemplate, setPrescriptionTemplate] = useState(
    localStorage.getItem('curasoft_prescription_template') ||
    'Hello {{patientName}}, here is your prescription from {{clinicName}} dated {{date}}.'
  );

  // Discount password state (admin only)
  const [discountPassword, setDiscountPassword] = useState(
    localStorage.getItem('curasoft_discount_password') || '123'
  );
  const [newDiscountPassword, setNewDiscountPassword] = useState('');
  const [confirmDiscountPassword, setConfirmDiscountPassword] = useState('');

  // Save discount password handler
  const handleSaveDiscountPassword = () => {
    if (!newDiscountPassword) {
      addNotification({ message: 'Please enter a new password', type: NotificationType.WARNING });
      return;
    }
    if (newDiscountPassword !== confirmDiscountPassword) {
      addNotification({ message: 'Passwords do not match', type: NotificationType.ERROR });
      return;
    }
    if (newDiscountPassword.length < 3) {
      addNotification({ message: 'Password must be at least 3 characters', type: NotificationType.WARNING });
      return;
    }
    localStorage.setItem('curasoft_discount_password', newDiscountPassword);
    setDiscountPassword(newDiscountPassword);
    setNewDiscountPassword('');
    setConfirmDiscountPassword('');
    addNotification({ message: 'Discount password updated successfully', type: NotificationType.SUCCESS });
  };

  // Backup restore state
  const [backupFile, setBackupFile] = useState<File | null>(null);

  // Handlers
  const handleSaveClinicInfo = () => {
    clinicData.updateClinicInfo({
      name: clinicName,
      address: clinicAddress,
      phone: clinicPhone,
      email: clinicEmail,
      logo: clinicLogo,
    });
    addNotification({ message: 'Clinic info saved', type: NotificationType.SUCCESS });
  };

  const handleSaveTemplate = (type: 'whatsapp' | 'reminder' | 'prescription') => {
    if (type === 'whatsapp') {
      localStorage.setItem('curasoft_whatsapp_template', whatsappTemplate);
    } else if (type === 'reminder') {
      localStorage.setItem('curasoft_reminder_template', reminderTemplate);
    } else {
      localStorage.setItem('curasoft_prescription_template', prescriptionTemplate);
    }
    addNotification({ message: 'Template saved', type: NotificationType.SUCCESS });
  };

  const handleBackup = () => {
    const backupData = {
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        appName: 'CuraSoft',
      },
      data: {
        patients: clinicData.patients,
        dentists: clinicData.dentists,
        appointments: clinicData.appointments,
      }
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curasoft_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification({ message: 'Backup created successfully', type: NotificationType.SUCCESS });
  };

  const handleRestore = async () => {
    if (!backupFile) {
      addNotification({ message: 'Please select a backup file first', type: NotificationType.ERROR });
      return;
    }

    try {
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);

      if (!backupData.data) {
        throw new Error('Invalid backup file format');
      }

      await clinicData.restoreData(backupData.data);
      addNotification({ message: 'Data restored successfully', type: NotificationType.SUCCESS });
      setBackupFile(null);
    } catch (error) {
      console.error('Restore failed:', error);
      addNotification({ message: 'Failed to restore data. Please check the file format.', type: NotificationType.ERROR });
    }
  };

  const handleClearData = () => {
    localStorage.clear();
    addNotification({ message: 'Data cleared successfully', type: NotificationType.SUCCESS });
    setTimeout(() => window.location.reload(), 1500);
  };

  // File handling functions
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification({ message: 'Please select a valid image file', type: NotificationType.ERROR });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addNotification({ message: 'File size must be less than 5MB', type: NotificationType.ERROR });
      return;
    }

    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setClinicLogo(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  }, [addNotification]);

  const handleRemoveLogo = useCallback(() => {
    setLogoFile(null);
    setClinicLogo('');
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle preferences file import
  const handlePreferencesFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreferencesFile(file);
  }, []);

  const handleImportPreferences = async () => {
    if (!preferencesFile) {
      addNotification({ message: 'Please select a preferences file first', type: NotificationType.ERROR });
      return;
    }

    try {
      const fileContent = await preferencesFile.text();
      const success = importPreferences(fileContent);
      if (success) {
        addNotification({ message: 'Preferences imported successfully', type: NotificationType.SUCCESS });
        setPreferencesFile(null);
        if (preferencesInputRef.current) {
          preferencesInputRef.current.value = '';
        }
      } else {
        addNotification({ message: 'Failed to import preferences. Invalid file format.', type: NotificationType.ERROR });
      }
    } catch (error) {
      console.error('Import failed:', error);
      addNotification({ message: 'Failed to import preferences', type: NotificationType.ERROR });
    }
  };

  const handleExportPreferences = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curasoft_preferences_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addNotification({ message: 'Preferences exported successfully', type: NotificationType.SUCCESS });
  };

  const handleResetAllPreferences = () => {
    if (window.confirm('Are you sure you want to reset all preferences to default values?')) {
      resetPreferences();
      addNotification({ message: 'Preferences reset to defaults', type: NotificationType.SUCCESS });
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'general', label: 'General', icon: <SunIcon /> },
    { id: 'display', label: 'Display', icon: <ViewIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
    { id: 'print', label: 'Print/Export', icon: <PrintIcon /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutIcon /> },
    { id: 'table', label: 'Tables', icon: <TableSettingsIcon /> },
    { id: 'accessibility', label: 'Accessibility', icon: <AccessibilityIcon /> },
    { id: 'privacy', label: 'Privacy', icon: <ShieldIcon /> },
    { id: 'clinic', label: 'Clinic', icon: <BuildingIcon /> },
    { id: 'templates', label: 'Templates', icon: <MessageIcon /> },
    { id: 'data', label: 'Data', icon: <DatabaseIcon /> },
    { id: 'sample', label: 'Sample', icon: <DatabaseIcon /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangleIcon />, danger: true },
  ];

  // View mode selector component
  const ViewModeSelector: React.FC<{
    value: ViewMode;
    onChange: (value: ViewMode) => void;
  }> = ({ value, onChange }) => (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => onChange('grid')}
        className={`p-2 rounded-md transition-all ${value === 'grid' 
          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
        title="Grid View"
      >
        <GridIcon />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2 rounded-md transition-all ${value === 'list' 
          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
        title="List View"
      >
        <ListIcon />
      </button>
      <button
        onClick={() => onChange('table')}
        className={`p-2 rounded-md transition-all ${value === 'table' 
          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
        title="Table View"
      >
        <TableIcon />
      </button>
    </div>
  );

  // Toggle switch component
  const Toggle: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
  }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-5' : ''}`}></div>
      </div>
      {label && <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Settings
      </h1>

      {/* Tab Navigation - Horizontal scrollable on mobile */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? tab.danger
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-b-2 border-red-500'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-b-2 border-blue-500'
                : tab.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <SunIcon />
              Appearance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <SunIcon />
                <div className="font-medium text-gray-900 dark:text-white">Light</div>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <MoonIcon />
                <div className="font-medium text-gray-900 dark:text-white">Dark</div>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <GlobeIcon />
              Language
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setLocale('ar')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  locale === 'ar'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-2xl">🇸🇦</span>
                <div className="font-medium text-gray-900 dark:text-white">Arabic</div>
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  locale === 'en'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-2xl">🇬🇧</span>
                <div className="font-medium text-gray-900 dark:text-white">English</div>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshIcon />
              Preferences
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleExportPreferences}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DownloadIcon />
                Export Preferences
              </button>
              <button
                onClick={() => preferencesInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <UploadIcon />
                Import Preferences
              </button>
              <input
                ref={preferencesInputRef}
                type="file"
                accept=".json"
                onChange={handlePreferencesFileSelect}
                className="hidden"
              />
              {preferencesFile && (
                <button
                  onClick={handleImportPreferences}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Apply Import
                </button>
              )}
              <button
                onClick={handleResetAllPreferences}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshIcon />
                Reset All
              </button>
            </div>
            {preferencesFile && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected file: {preferencesFile.name}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Display Settings Tab - View Mode Preferences */}
      {activeTab === 'display' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <ViewIcon />
              Page View Preferences
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Choose your preferred view mode (grid, list, or table) for each page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(pageViewLabels) as Array<keyof PageViewPreferences>).map((page) => (
                <div key={page} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">{pageViewLabels[page]}</span>
                  <ViewModeSelector
                    value={preferences.pageViews[page]}
                    onChange={(value) => updatePreferences('pageViews', { [page]: value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <GlobeIcon />
              Regional Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Format
                </label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => updatePreferences('dateFormat', e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Format
                </label>
                <select
                  value={preferences.timeFormat}
                  onChange={(e) => updatePreferences('timeFormat', e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="12h">12 Hour (AM/PM)</option>
                  <option value="24h">24 Hour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={preferences.currencySymbol}
                  onChange={(e) => updatePreferences('currencySymbol', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="EGP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency Position
                </label>
                <select
                  value={preferences.currencyPosition}
                  onChange={(e) => updatePreferences('currencyPosition', e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="before">Before Amount (EGP 100)</option>
                  <option value="after">After Amount (100 EGP)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Decimal Places
                </label>
                <select
                  value={preferences.decimalPlaces}
                  onChange={(e) => updatePreferences('decimalPlaces', parseInt(e.target.value) as any)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="0">0</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
              <Toggle
                checked={preferences.showCurrencySymbol}
                onChange={(checked) => updatePreferences('showCurrencySymbol', checked)}
                label="Show Currency Symbol"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <BellIcon />
              Notification Channels
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Toggle
                checked={preferences.notifications.enableSound}
                onChange={(checked) => updatePreferences('notifications', { enableSound: checked })}
                label="Sound Notifications"
              />
              <Toggle
                checked={preferences.notifications.enableDesktop}
                onChange={(checked) => updatePreferences('notifications', { enableDesktop: checked })}
                label="Desktop Notifications"
              />
              <Toggle
                checked={preferences.notifications.enableEmail}
                onChange={(checked) => updatePreferences('notifications', { enableEmail: checked })}
                label="Email Notifications"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <BellIcon />
              Alert Types
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle
                checked={preferences.notifications.appointmentReminders}
                onChange={(checked) => updatePreferences('notifications', { appointmentReminders: checked })}
                label="Appointment Reminders"
              />
              <Toggle
                checked={preferences.notifications.lowStockAlerts}
                onChange={(checked) => updatePreferences('notifications', { lowStockAlerts: checked })}
                label="Low Stock Alerts"
              />
              <Toggle
                checked={preferences.notifications.paymentReminders}
                onChange={(checked) => updatePreferences('notifications', { paymentReminders: checked })}
                label="Payment Reminders"
              />
              <Toggle
                checked={preferences.notifications.treatmentReminders}
                onChange={(checked) => updatePreferences('notifications', { treatmentReminders: checked })}
                label="Treatment Reminders"
              />
              <Toggle
                checked={preferences.notifications.labCaseUpdates}
                onChange={(checked) => updatePreferences('notifications', { labCaseUpdates: checked })}
                label="Lab Case Updates"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <MoonIcon />
              Quiet Hours
            </h2>
            <div className="space-y-4">
              <Toggle
                checked={preferences.notifications.quietHoursEnabled}
                onChange={(checked) => updatePreferences('notifications', { quietHoursEnabled: checked })}
                label="Enable Quiet Hours"
              />
              {preferences.notifications.quietHoursEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={preferences.notifications.quietHoursStart}
                      onChange={(e) => updatePreferences('notifications', { quietHoursStart: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={preferences.notifications.quietHoursEnd}
                      onChange={(e) => updatePreferences('notifications', { quietHoursEnd: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print/Export Settings Tab */}
      {activeTab === 'print' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <PrintIcon />
              Print Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Paper Size
                </label>
                <select
                  value={preferences.printExport.defaultPaperSize}
                  onChange={(e) => updatePreferences('printExport', { defaultPaperSize: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Orientation
                </label>
                <select
                  value={preferences.printExport.defaultOrientation}
                  onChange={(e) => updatePreferences('printExport', { defaultOrientation: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle
                checked={preferences.printExport.includeLogo}
                onChange={(checked) => updatePreferences('printExport', { includeLogo: checked })}
                label="Include Logo"
              />
              <Toggle
                checked={preferences.printExport.includeClinicInfo}
                onChange={(checked) => updatePreferences('printExport', { includeClinicInfo: checked })}
                label="Include Clinic Info"
              />
              <Toggle
                checked={preferences.printExport.includeDate}
                onChange={(checked) => updatePreferences('printExport', { includeDate: checked })}
                label="Include Date"
              />
              <Toggle
                checked={preferences.printExport.includePageNumbers}
                onChange={(checked) => updatePreferences('printExport', { includePageNumbers: checked })}
                label="Include Page Numbers"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <DownloadIcon />
              Export Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Export Format
                </label>
                <select
                  value={preferences.printExport.defaultExportFormat}
                  onChange={(e) => updatePreferences('printExport', { defaultExportFormat: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Quality
                </label>
                <select
                  value={preferences.printExport.imageQuality}
                  onChange={(e) => updatePreferences('printExport', { imageQuality: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <Toggle
                checked={preferences.printExport.compressImages}
                onChange={(checked) => updatePreferences('printExport', { compressImages: checked })}
                label="Compress Images"
              />
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Settings Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <LayoutIcon />
              Dashboard Widgets
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Choose which widgets to show on your dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle
                checked={preferences.dashboard.showQuickStats}
                onChange={(checked) => updatePreferences('dashboard', { showQuickStats: checked })}
                label="Quick Stats Cards"
              />
              <Toggle
                checked={preferences.dashboard.showRevenueChart}
                onChange={(checked) => updatePreferences('dashboard', { showRevenueChart: checked })}
                label="Revenue Chart"
              />
              <Toggle
                checked={preferences.dashboard.showAppointmentsToday}
                onChange={(checked) => updatePreferences('dashboard', { showAppointmentsToday: checked })}
                label="Today's Appointments"
              />
              <Toggle
                checked={preferences.dashboard.showLowStockAlerts}
                onChange={(checked) => updatePreferences('dashboard', { showLowStockAlerts: checked })}
                label="Low Stock Alerts"
              />
              <Toggle
                checked={preferences.dashboard.showRecentPatients}
                onChange={(checked) => updatePreferences('dashboard', { showRecentPatients: checked })}
                label="Recent Patients"
              />
              <Toggle
                checked={preferences.dashboard.showPendingPayments}
                onChange={(checked) => updatePreferences('dashboard', { showPendingPayments: checked })}
                label="Pending Payments"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <LayoutIcon />
              Dashboard Display
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Date Range
                </label>
                <select
                  value={preferences.dashboard.defaultDateRange}
                  onChange={(e) => updatePreferences('dashboard', { defaultDateRange: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refresh Interval (seconds)
                </label>
                <select
                  value={preferences.dashboard.refreshInterval}
                  onChange={(e) => updatePreferences('dashboard', { refreshInterval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="0">Disabled</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Layout Style
                </label>
                <select
                  value={preferences.dashboard.layout}
                  onChange={(e) => updatePreferences('dashboard', { layout: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="expanded">Expanded</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Settings Tab */}
      {activeTab === 'table' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <TableSettingsIcon />
              Table Display
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Page Size
                </label>
                <select
                  value={preferences.table.pageSize}
                  onChange={(e) => updatePreferences('table', { pageSize: parseInt(e.target.value) as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="10">10 rows</option>
                  <option value="25">25 rows</option>
                  <option value="50">50 rows</option>
                  <option value="100">100 rows</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Layout Style
                </label>
                <select
                  value={preferences.table.stickyHeader ? 'sticky' : 'static'}
                  onChange={(e) => updatePreferences('table', { stickyHeader: e.target.value === 'sticky' })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="sticky">Sticky Header</option>
                  <option value="static">Static</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle
                checked={preferences.table.enablePagination}
                onChange={(checked) => updatePreferences('table', { enablePagination: checked })}
                label="Enable Pagination"
              />
              <Toggle
                checked={preferences.table.enableSorting}
                onChange={(checked) => updatePreferences('table', { enableSorting: checked })}
                label="Enable Sorting"
              />
              <Toggle
                checked={preferences.table.enableFiltering}
                onChange={(checked) => updatePreferences('table', { enableFiltering: checked })}
                label="Enable Filtering"
              />
              <Toggle
                checked={preferences.table.stripedRows}
                onChange={(checked) => updatePreferences('table', { stripedRows: checked })}
                label="Striped Rows"
              />
              <Toggle
                checked={preferences.table.highlightOnHover}
                onChange={(checked) => updatePreferences('table', { highlightOnHover: checked })}
                label="Highlight on Hover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Settings Tab */}
      {activeTab === 'accessibility' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <AccessibilityIcon />
              Visual Accessibility
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Size
                </label>
                <select
                  value={preferences.fontSize}
                  onChange={(e) => updatePreferences('fontSize', e.target.value as 'small' | 'medium' | 'large' | 'extra-large')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium (Default)</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <Toggle
                checked={preferences.highContrast}
                onChange={(checked) => updatePreferences('highContrast', checked)}
                label="High Contrast Mode"
              />
              <Toggle
                checked={preferences.reduceMotion}
                onChange={(checked) => updatePreferences('reduceMotion', checked)}
                label="Reduce Motion"
              />
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldIcon />
              Security & Privacy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto Lock Timeout
                </label>
                <select
                  value={preferences.autoLockTimeout}
                  onChange={(e) => updatePreferences('autoLockTimeout', parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="0">Disabled</option>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clear Clipboard After
                </label>
                <select
                  value={preferences.clearClipboardAfter}
                  onChange={(e) => updatePreferences('clearClipboardAfter', parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="0">Disabled</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="120">2 minutes</option>
                  <option value="300">5 minutes</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Toggle
                checked={preferences.maskSensitiveData}
                onChange={(checked) => updatePreferences('maskSensitiveData', checked)}
                label="Mask Sensitive Data (show asterisks for sensitive fields)"
              />
            </div>
          </div>

          {/* Discount Password Section (Admin Only) */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldIcon />
                خصم الخصم - إعدادات كلمة المرور
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
               .configure the password required to apply discounts to patient treatments
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={newDiscountPassword}
                    onChange={(e) => setNewDiscountPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={confirmDiscountPassword}
                    onChange={(e) => setConfirmDiscountPassword(e.target.value)}
                    placeholder="أكد كلمة المرور"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleSaveDiscountPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ كلمة المرور
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clinic Settings Tab */}
      {activeTab === 'clinic' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <BuildingIcon />
            Clinic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clinic Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={clinicEmail}
                onChange={(e) => setClinicEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clinic Logo
              </label>
              <div className="space-y-4">
                {logoPreview && (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Clinic Logo Preview"
                      className="w-20 h-20 object-contain border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleSaveClinicInfo}
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSaving ? 'Saving...' : 'Save Clinic Info'}
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">WhatsApp Template</h2>
            <textarea
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="mt-4">
              <button
                onClick={() => handleSaveTemplate('whatsapp')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Backup & Restore</h2>
            <div className="space-y-4">
              <div>
                <button
                  onClick={handleBackup}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Backup
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Backup File to Restore
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div className="mt-2">
                  <button
                    onClick={handleRestore}
                    disabled={!backupFile}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Restore Backup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample Data Tab */}
      {activeTab === 'sample' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sample Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Load sample data for testing</p>
          <button
            onClick={() => {
              addNotification({ message: 'Sample data loaded', type: NotificationType.SUCCESS });
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Load Sample Data
          </button>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-400 flex items-center gap-2">
              <AlertTriangleIcon />
              Danger Zone
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Clear All Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This will delete all your data</p>
                </div>
                <button
                  onClick={handleClearData}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
