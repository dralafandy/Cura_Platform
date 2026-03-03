import { useState, useEffect, useCallback } from 'react';

// Breakpoint constants matching Tailwind defaults
export const BREAKPOINTS = {
  xs: 480,    // Mobile small
  sm: 640,    // Mobile large / Large phones
  md: 768,    // Tablet
  lg: 1024,   // Desktop small
  xl: 1280,   // Desktop
  '2xl': 1536 // Desktop large
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Device types
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Responsive state interface
export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileSmall: boolean;
  isMobileLarge: boolean;
  deviceType: DeviceType;
  currentBreakpoint: Breakpoint;
  isLandscape: boolean;
  isPortrait: boolean;
  isTouch: boolean;
  isRetina: boolean;
  isReducedMotion: boolean;
}

// Custom hook for responsive detection
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => getResponsiveState());

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveState());
    };

    // Use passive listener for better performance
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Also listen for orientation change on mobile
    window.addEventListener('orientationchange', handleResize, { passive: true });
    
    // Listen for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = () => {
      setState(prev => ({
        ...prev,
        isReducedMotion: mediaQuery.matches
      }));
    };
    mediaQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  return state;
};

// Helper function to get current responsive state
const getResponsiveState = (): ResponsiveState => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Check for touch device
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check for retina display
  const isRetina = window.matchMedia('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)').matches;
  
  // Check for reduced motion
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Determine device type based on width
  const isMobileSmall = width <= BREAKPOINTS.xs;
  const isMobile = width < BREAKPOINTS.md;
  const isMobileLarge = width >= BREAKPOINTS.xs && width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;
  
  // Determine device type
  let deviceType: DeviceType = 'desktop';
  if (isMobileSmall || isMobileLarge) {
    deviceType = 'mobile';
  } else if (isTablet) {
    deviceType = 'tablet';
  }
  
  // Determine current breakpoint
  let currentBreakpoint: Breakpoint = 'xs';
  if (width >= BREAKPOINTS['2xl']) {
    currentBreakpoint = '2xl';
  } else if (width >= BREAKPOINTS.xl) {
    currentBreakpoint = 'xl';
  } else if (width >= BREAKPOINTS.lg) {
    currentBreakpoint = 'lg';
  } else if (width >= BREAKPOINTS.md) {
    currentBreakpoint = 'md';
  } else if (width >= BREAKPOINTS.sm) {
    currentBreakpoint = 'sm';
  }
  
  // Orientation
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isMobileSmall,
    isMobileLarge: isMobileLarge || isMobileSmall,
    deviceType,
    currentBreakpoint,
    isLandscape,
    isPortrait,
    isTouch,
    isRetina,
    isReducedMotion
  };
};

// Hook for checking specific breakpoint or above
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      setMatches(window.innerWidth >= BREAKPOINTS[breakpoint]);
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint, { passive: true });

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return matches;
};

// Hook for mobile-only view
export const useIsMobile = (): boolean => {
  const isMdAndUp = useBreakpoint('md');
  return !isMdAndUp;
};

// Hook for tablet-only view
export const useIsTablet = (): boolean => {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= BREAKPOINTS.md && width < BREAKPOINTS.lg);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet, { passive: true });

    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return isTablet;
};

// Hook for desktop-only view
export const useIsDesktop = (): boolean => {
  return useBreakpoint('lg');
};

// Hook for orientation changes
export const useOrientation = (): 'landscape' | 'portrait' => {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(() => {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return orientation;
};

// Hook for debounced resize
export const useDebouncedResize = (delay: number = 150): { width: number; height: number } => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }, delay);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [delay]);

  return size;
};

export default useResponsive;
