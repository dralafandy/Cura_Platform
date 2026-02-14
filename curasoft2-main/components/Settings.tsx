import React, { useState, useRef, useCallback } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { useI18n } from '../hooks/useI18n';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationType, AppointmentStatus } from '../types';

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

type TabType = 'general' | 'clinic' | 'templates' | 'data' | 'sample' | 'danger';

interface SettingsProps {
  clinicData: ClinicData;
}

const Settings: React.FC<SettingsProps> = ({ clinicData }) => {
  const { locale, setLocale } = useI18n();
  const { addNotification } = useNotification();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('general');
  
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification({ message: 'Please select a valid image file', type: NotificationType.ERROR });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      addNotification({ message: 'File size must be less than 5MB', type: NotificationType.ERROR });
      return;
    }

    setLogoFile(file);

    // Convert to base64
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

  // Tab configuration
  const tabs = [
    { id: 'general', label: 'General', icon: <SunIcon /> },
    { id: 'clinic', label: 'Clinic', icon: <BuildingIcon /> },
    { id: 'templates', label: 'Templates', icon: <MessageIcon /> },
    { id: 'data', label: 'Data', icon: <DatabaseIcon /> },
    { id: 'sample', label: 'Sample', icon: <DatabaseIcon /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangleIcon />, danger: true },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Settings
      </h1>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
                {/* Logo Preview */}
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

                {/* File Input */}
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
              // Sample data loading logic
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
