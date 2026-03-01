// Responsive Design System - Main Export
// Curasoft Medical Clinic Management

// Hooks
export { 
  useResponsive, 
  useBreakpoint, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop,
  useOrientation,
  useDebouncedResize,
  BREAKPOINTS,
  type Breakpoint,
  type DeviceType,
  type ResponsiveState
} from './hooks/useResponsive';

// Context
export { 
  ResponsiveProvider, 
  useResponsiveContext,
  BREAKPOINTS as ResponsiveBreakpoints
} from './contexts/ResponsiveContext';

// Components
export { default as ResponsiveLayout } from './components/ResponsiveLayout';
export { default as ResponsiveTable } from './components/ResponsiveTable';
export { default as MobileHeader } from './components/MobileHeader';
export type { ResponsiveColumn, SortDirection } from './components/ResponsiveTable';

// Styles - import this in your main CSS file
// import './styles/responsive.css';
