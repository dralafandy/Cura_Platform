/**
 * Common UI Icons
 * Reusable SVG icon components for the application
 * All icons use the same strokeWidth and follow consistent sizing patterns
 */

import React from 'react';

// Common props for all icons
interface IconProps {
  className?: string;
  'aria-hidden'?: boolean;
}

// Size variants
const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const CloseIcon: React.FC<IconProps> = ({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const AddUserIcon: React.FC<IconProps> = ({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

export const EditIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export const DollarSignIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

export const UserIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const BriefcaseIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const EyeIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const StethoscopeIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'lg', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const PrintIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

export const DocumentIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h2 0 14a2 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const PaymentIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

export const ChartIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const AddPaymentIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export const TrashIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const SearchIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const FilterIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

export const SortIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

export const ClockIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const TrendUpIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export const MoreOptionsIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

export const XIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Grid View Icon
export const GridViewIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

// List View Icon
export const ListViewIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

// Arrow Down Icon (for scroll indicators)
export const ArrowDownIcon: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'sm', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || sizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

// Loading Spinner
export const LoadingSpinner: React.FC<IconProps & { size?: 'sm' | 'md' | 'lg' }> = ({ className, size = 'md', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`${className || sizeClasses[size]} animate-spin`} fill="none" viewBox="0 0 24 24" aria-hidden={ariaHidden}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Empty State Icon
export const EmptyStateIcon: React.FC<IconProps> = ({ className = 'h-16 w-16', 'aria-hidden': ariaHidden = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden={ariaHidden}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Export all icons as a named export object for convenience
export const Icons = {
  Close: CloseIcon,
  AddUser: AddUserIcon,
  Edit: EditIcon,
  DollarSign: DollarSignIcon,
  User: UserIcon,
  Briefcase: BriefcaseIcon,
  Eye: EyeIcon,
  Stethoscope: StethoscopeIcon,
  Print: PrintIcon,
  Document: DocumentIcon,
  Calendar: CalendarIcon,
  Payment: PaymentIcon,
  CheckCircle: CheckCircleIcon,
  ArrowUp: ArrowUpIcon,
  Chart: ChartIcon,
  AddPayment: AddPaymentIcon,
  Trash: TrashIcon,
  Search: SearchIcon,
  Filter: FilterIcon,
  Sort: SortIcon,
  Clock: ClockIcon,
  TrendUp: TrendUpIcon,
  MoreOptions: MoreOptionsIcon,
  X: XIcon,
  ChevronDown: ChevronDownIcon,
  GridView: GridViewIcon,
  ListView: ListViewIcon,
  ArrowDown: ArrowDownIcon,
  Loading: LoadingSpinner,
  EmptyState: EmptyStateIcon,
};

export default Icons;
