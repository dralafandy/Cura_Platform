import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  ResponsiveState, 
  useResponsive, 
  BREAKPOINTS,
  DeviceType 
} from '../hooks/useResponsive';

// Default responsive state
const defaultState: ResponsiveState = {
  width: 1024,
  height: 768,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isMobileSmall: false,
  isMobileLarge: false,
  deviceType: 'desktop',
  currentBreakpoint: 'lg',
  isLandscape: true,
  isPortrait: false,
  isTouch: false,
  isRetina: false,
  isReducedMotion: false
};

// Context type
interface ResponsiveContextType {
  state: ResponsiveState;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileSmall: boolean;
  deviceType: DeviceType;
  currentBreakpoint: string;
  setDeviceOverride: (device: DeviceType | null) => void;
}

// Create context
const ResponsiveContext = createContext<ResponsiveContextType>({
  state: defaultState,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isMobileSmall: false,
  deviceType: 'desktop',
  currentBreakpoint: 'lg',
  setDeviceOverride: () => {}
});

// Provider props
interface ResponsiveProviderProps {
  children: ReactNode;
  defaultDevice?: DeviceType;
}

// Provider component
export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ 
  children,
  defaultDevice = null 
}) => {
  const responsiveState = useResponsive();
  const [deviceOverride, setDeviceOverride] = useState<DeviceType | null>(null);

  // Allow manual device override for testing or forced responsive view
  useEffect(() => {
    if (deviceOverride) {
      // Apply CSS classes for override
      document.documentElement.dataset.deviceOverride = deviceOverride;
    } else {
      document.documentElement.removeAttribute('data-deviceOverride');
    }
  }, [deviceOverride]);

  // Calculate effective state with override
  const effectiveState: ResponsiveState = deviceOverride 
    ? {
        ...responsiveState,
        isMobile: deviceOverride === 'mobile',
        isTablet: deviceOverride === 'tablet',
        isDesktop: deviceOverride === 'desktop',
        deviceType: deviceOverride
      }
    : responsiveState;

  const value: ResponsiveContextType = {
    state: effectiveState,
    isMobile: effectiveState.isMobile,
    isTablet: effectiveState.isTablet,
    isDesktop: effectiveState.isDesktop,
    isMobileSmall: effectiveState.isMobileSmall,
    deviceType: effectiveState.deviceType,
    currentBreakpoint: effectiveState.currentBreakpoint,
    setDeviceOverride: setDeviceOverride
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// Custom hook to use responsive context
export const useResponsiveContext = (): ResponsiveContextType => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsiveContext must be used within a ResponsiveProvider');
  }
  return context;
};

// Export breakpoints for external use
export { BREAKPOINTS };

export default ResponsiveContext;
