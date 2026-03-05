/**
 * Clinic Selector Component
 * 
 * Displays a dropdown for switching between accessible clinics and branches.
 * Shows in the header for easy access.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Clinic, ClinicBranch, UserClinicAccess } from '../../auth/types';

interface ClinicSelectorProps {
  variant?: 'default' | 'compact' | 'minimal';
  showBranches?: boolean;
  className?: string;
}

export const ClinicSelector: React.FC<ClinicSelectorProps> = ({
  variant = 'default',
  showBranches = true,
  className = '',
}) => {
  const {
    currentClinic,
    currentBranch,
    accessibleClinics,
    isLoadingClinics,
    isSwitchingClinic,
    switchClinic,
    switchBranch,
    refreshClinics,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group clinics by clinic ID (to show branches)
  const groupedClinics = accessibleClinics.reduce((acc, access) => {
    if (!acc[access.clinicId]) {
      acc[access.clinicId] = {
        clinic: {
          id: access.clinicId,
          name: access.clinicName || 'Unknown Clinic',
        } as Clinic,
        branches: [],
        access: access,
      };
    }
    if (access.branchId) {
      if (!acc[access.clinicId].branches.some((b) => b.id === access.branchId)) {
        acc[access.clinicId].branches.push({
          id: access.branchId,
          name: access.branchName || `Branch ${access.branchId.slice(0, 8)}`,
          clinicId: access.clinicId,
        } as ClinicBranch);
      }
    }
    return acc;
  }, {} as Record<string, { clinic: Clinic; branches: ClinicBranch[]; access: UserClinicAccess }>);

  const handleClinicSelect = async (clinicId: string, branchId?: string) => {
    setIsOpen(false);
    
    try {
      await switchClinic(clinicId, branchId);
    } catch (error) {
      console.error('Error switching clinic:', error);
    }
  };

  const handleBranchSelect = async (branchId: string) => {
    if (!currentClinic) return;
    await handleClinicSelect(currentClinic.id, branchId);
  };

  // Compact variant - just shows current clinic name with dropdown
  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoadingClinics || isSwitchingClinic}
          className="w-full sm:w-auto flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="max-w-[72px] sm:max-w-[150px] truncate">
            {isSwitchingClinic ? 'Switching...' : currentBranch?.name || currentClinic?.name || 'Select Clinic'}
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-[min(18rem,calc(100vw-1rem))] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-2">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Your Clinics
              </p>
            </div>
            
              {Object.values(groupedClinics).map(({ clinic, branches }) => (
                <div key={clinic.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <button
                    onClick={() => handleClinicSelect(clinic.id)}
                    className={`w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      currentClinic?.id === clinic.id ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        currentClinic?.id === clinic.id ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        currentClinic?.id === clinic.id 
                          ? 'text-cyan-700 dark:text-cyan-300' 
                          : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {clinic.name}
                      </span>
                    </div>
                  </button>
                  
                  {/* Branches List */}
                  {showBranches && branches.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      <button
                        onClick={() => handleClinicSelect(clinic.id)}
                        className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                          currentClinic?.id === clinic.id && !currentBranch?.id
                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M3 12h18M3 19h18" />
                        </svg>
                        All Data / جميع البيانات
                      </button>
                      {branches.map(branch => (
                        <button
                          key={branch.id}
                          onClick={() => handleClinicSelect(clinic.id, branch.id)}
                          className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                            currentClinic?.id === clinic.id && currentBranch?.id === branch.id
                              ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {branch.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            
            {Object.keys(groupedClinics).length === 0 && (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No clinics available
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant - full dropdown with more details
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingClinics || isSwitchingClinic}
        className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {/* Clinic Logo or Icon */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
          {currentClinic?.logoUrl ? (
            <img 
              src={currentClinic.logoUrl} 
              alt={currentClinic.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            currentClinic?.name?.charAt(0) || 'C'
          )}
        </div>

        {/* Clinic Info */}
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {isSwitchingClinic ? 'Switching...' : currentBranch?.name || currentClinic?.name || 'Select Clinic'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentBranch ? currentClinic?.name : 'Click to switch'}
          </p>
        </div>

        {/* Dropdown Arrow */}
        <svg 
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Your Clinics & Branches
            </p>
          </div>

          {/* Clinic List */}
          <div className="max-h-96 overflow-y-auto py-2">
            {Object.values(groupedClinics).map(({ clinic, branches, access }) => (
              <div key={clinic.id} className="px-2">
                {/* Clinic Header */}
                <button
                  onClick={() => handleClinicSelect(clinic.id)}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                    currentClinic?.id === clinic.id
                      ? 'bg-cyan-50 dark:bg-cyan-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {/* Clinic Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    currentClinic?.id === clinic.id
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {clinic.name.charAt(0)}
                  </div>

                  {/* Clinic Info */}
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${
                      currentClinic?.id === clinic.id
                        ? 'text-cyan-700 dark:text-cyan-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {clinic.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {access.roleAtClinic}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {currentClinic?.id === clinic.id && (
                    <svg className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Branches List */}
                {showBranches && currentClinic?.id === clinic.id && branches.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    <button
                      onClick={() => handleClinicSelect(clinic.id)}
                      className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                        !currentBranch?.id
                          ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M3 12h18M3 19h18" />
                      </svg>
                      All Data / جميع البيانات
                    </button>
                    {branches.map(branch => (
                      <button
                        key={branch.id}
                        onClick={() => handleBranchSelect(branch.id)}
                        className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                          currentBranch?.id === branch.id
                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {branch.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {Object.keys(groupedClinics).length === 0 && (
              <div className="px-4 py-8 text-center">
                <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No clinics available
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Contact your administrator
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => {
                refreshClinics();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicSelector;
