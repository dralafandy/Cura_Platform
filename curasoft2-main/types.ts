export enum ToothStatus {
  HEALTHY = 'HEALTHY',
  FILLING = 'FILLING',
  CROWN = 'CROWN',
  MISSING = 'MISSING',
  IMPLANT = 'IMPLANT',
  ROOT_CANAL = 'ROOT_CANAL',
  CAVITY = 'CAVITY',
}

export interface Tooth {
  status: ToothStatus;
  notes: string;
}

export type DentalChartData = Record<string, Tooth>; // Key is tooth number, e.g., 'T1', 'T2'

export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
  treatmentNotes: string; // Existing unstructured notes
  lastVisit: string;
  allergies: string;
  medications: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  dentalChart: DentalChartData;
  images: string[]; // Array of base64 data URLs for attached images
  attachments: string[]; // Array of base64 data URLs for patient attachments (images only)
}

export interface Dentist {
  id: string;
  name: string;
  specialty: string;
  color: string;
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Add the missing Appointment interface
export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  status: AppointmentStatus;
  reminderTime: 'none' | '1_hour_before' | '2_hours_before' | '1_day_before'; // New field for reminders
  reminderSent: boolean; // New field to track if reminder was sent
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// --- New Interfaces for Finance & Inventory ---

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  type: 'Material Supplier' | 'Dental Lab'; // Added to distinguish supplier type
}

// Renamed from LabMaterial
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  supplierId: string; // Link to Supplier
  currentStock: number;
  unitCost: number; // Cost per unit for the clinic
  minStockLevel: number; // Minimum stock before re-order alert
  expiryDate?: string; // YYYY-MM-DD
}

export enum ExpenseCategory {
  RENT = 'RENT',
  SALARIES = 'SALARIES',
  UTILITIES = 'UTILITIES',
  LAB_FEES = 'LAB_FEES',
  SUPPLIES = 'SUPPLIES',
  MARKETING = 'MARKETING',
  MISC = 'MISC',
}

export interface Expense {
  id:string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: ExpenseCategory;
  supplierId?: string; // Link to a specific supplier
  supplierInvoiceId?: string; // Link to a specific supplier invoice
  method?: PaymentMethod; // Payment method for the expense
  expenseReceiptImageUrl?: string; // URL for the expense receipt image
}

export interface TreatmentDefinition { // Renamed from TreatmentCost to be more descriptive of a template
  id: string;
  name: string;
  description: string;
  basePrice: number; // The patient-facing price
  doctorPercentage: number; // e.g., 0.60 for 60%
  clinicPercentage: number; // e.g., 0.40 for 40%
}

export interface TreatmentRecord { // A specific treatment performed on a patient
    id: string;
    patientId: string;
    dentistId: string;
    treatmentDate: string; // YYYY-MM-DD
    treatmentDefinitionId: string; // Link to TreatmentDefinition
    notes: string;
    inventoryItemsUsed: { inventoryItemId: string; quantity: number; cost: number; }[]; // Materials consumed, updated name
    doctorShare: number;
    clinicShare: number;
    totalTreatmentCost: number; // Total cost charged to the patient
    affectedTeeth: string[]; // Array of tooth IDs affected by this treatment, e.g., ['UR1', 'UL2']
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export type PaymentMethod = 'Cash' | 'Instapay' | 'Vodafone Cash' | 'Other' | 'Discount';

export interface Payment {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  method: PaymentMethod;
  notes?: string;
  treatmentRecordId: string;
  clinicShare: number;
  doctorShare: number;
  paymentReceiptImageUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// --- New interfaces for Lab Case Management ---
export enum LabCaseStatus {
    DRAFT = 'DRAFT',
    SENT_TO_LAB = 'SENT_TO_LAB',
    RECEIVED_FROM_LAB = 'RECEIVED_FROM_LAB',
    FITTED_TO_PATIENT = 'FITTED_TO_PATIENT',
    CANCELLED = 'CANCELLED',
}

export interface LabCase {
    id: string;
    patientId: string;
    labId: string; // Supplier of type 'Dental Lab'
    caseType: string; // e.g., 'Zirconia Crown', 'E-Max Veneer'
    sentDate: string; // YYYY-MM-DD
    dueDate: string; // YYYY-MM-DD
    returnDate?: string; // YYYY-MM-DD
    status: LabCaseStatus;
    labCost: number;
    notes: string;
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
  SYSTEM = 'system',
  USER = 'user',
  FINANCIAL = 'financial',
  PATIENT = 'patient',
  INVENTORY = 'inventory',
  APPOINTMENT = 'appointment',
  LAB_CASE = 'lab_case',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  label: string;
  action: string;
  payload?: any;
}

export interface NotificationFilter {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}


export type FilterOptions = {
    dentistId?: string;
    supplierId?: string;
    labId?: string;
};

export type PatientDetailTab = 'details' | 'chart' | 'treatments' | 'prescriptions' | 'financials' | 'attachments'; // Added 'attachments' tab
export type DoctorDetailTab = 'details' | 'treatments' | 'financials' | 'schedule';
export type View = 'dashboard' | 'patients' | 'scheduler' | 'doctors' | 'suppliers' | 'inventory' | 'labCases' | 'expenses' | 'treatmentDefinitions' | 'statistics' | 'accounting' | 'financialAccounts' | 'doctorAccounts' | 'settings' | 'userManagement' | 'accountSelection' | 'patient-details' | 'doctor-details' | 'test-patient-cards' | 'experimental-patient-reports' | 'insuranceCompanies' | 'insuranceAccounts' | 'insuranceTransactions' | 'patientInsuranceLink' | 'treatmentInsuranceLink' | 'insuranceIntegration' | 'insuranceUnified' | 'databaseVerification' | 'systemTesting' | 'reports' | 'publicBooking' | 'pendingReservations';








// --- New interfaces for Supplier Financials ---
export enum SupplierInvoiceStatus {
    UNPAID = 'UNPAID',
    PAID = 'PAID',
}

export interface SupplierInvoice {
    id: string;
    supplierId: string;
    invoiceNumber?: string;
    invoiceDate: string; // YYYY-MM-DD
    dueDate?: string; // YYYY-MM-DD
    amount: number;
    status: SupplierInvoiceStatus;
    items: { description: string; amount: number; }[];
    payments: { expenseId: string; amount: number; date: string; }[];
    labCaseId?: string; // Optional lab case ID for dental lab invoices
    invoiceImageUrl?: string; // URL for the invoice image
}

// --- New interface for Doctor Payments ---
export interface DoctorPayment {
    id: string;
    dentistId: string;
    amount: number;
    date: string; // YYYY-MM-DD
    notes?: string;
}

// --- Prescription Module Types ---
export interface Prescription {
    id: string;
    patientId: string;
    dentistId: string;
    prescriptionDate: string; // YYYY-MM-DD
    notes?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface PrescriptionItem {
    id: string;
    prescriptionId: string;
    medicationName: string;
    dosage?: string;
    quantity: number;
    instructions?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

// Patient Attachments Interface
export interface PatientAttachment {
    id: string;
    patientId: string;
    filename: string;
    originalFilename: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    thumbnailUrl?: string;
    description?: string;
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
}

// Supplier Invoice Attachments Interface
export interface SupplierInvoiceAttachment {
    id: string;
    supplierInvoiceId: string;
    filename: string;
    originalFilename: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    thumbnailUrl?: string;
    description?: string;
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
}

// Purchase Order Interface
export interface PurchaseOrderItem {
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export interface PurchaseOrder {
    id: string;
    name?: string; // Optional name for the purchase order
    supplierId: string;
    orderDate: string; // YYYY-MM-DD
    status: 'draft' | 'sent' | 'received' | 'cancelled';
    items: PurchaseOrderItem[];
    totalAmount: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// --- Online Reservation System Types ---

export enum OnlineReservationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export interface WorkingHours {
    id: string;
    dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    slotDurationMinutes: number;
    breakStart?: string; // HH:MM format
    breakEnd?: string; // HH:MM format
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface OnlineReservation {
    id: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    preferredDentistId?: string;
    serviceId?: string;
    requestedDate: string; // YYYY-MM-DD
    requestedTime: string; // HH:MM format
    durationMinutes: number;
    reason?: string;
    status: OnlineReservationStatus;
    adminNotes?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
    // Joined fields for display
    dentistName?: string;
    serviceName?: string;
}

export interface TimeSlot {
    time: string; // HH:MM format
    available: boolean;
    dentistId?: string;
    dentistName?: string;
}

export interface AvailabilityResponse {
    date: string;
    slots: TimeSlot[];
}

export interface BookingService {
    id: string;
    name: string;
    description?: string;
    duration: number; // minutes
    price?: number;
}

export interface CreateReservationRequest {
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    preferredDentistId?: string;
    serviceId?: string;
    requestedDate: string;
    requestedTime: string;
    durationMinutes: number;
    reason?: string;
}

export interface CreateReservationResponse {
    success: boolean;
    reservationId: string;
    message: string;
}

export interface ReservationStatusResponse {
    id: string;
    status: OnlineReservationStatus;
    appointmentDate?: string;
    appointmentTime?: string;
    dentistName?: string;
    message: string;
}

// Extended Appointment interface for online reservations
export interface AppointmentWithReservation extends Appointment {
    onlineReservationId?: string;
}


// ==========================================
// USER MANAGEMENT, ROLES & PERMISSIONS TYPES
// ==========================================

export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  ASSISTANT = 'ASSISTANT',
  RECEPTIONIST = 'RECEPTIONIST',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum Permission {
  // User Management
  USER_MANAGEMENT_VIEW = 'USER_MANAGEMENT_VIEW',
  USER_MANAGEMENT_CREATE = 'USER_MANAGEMENT_CREATE',
  USER_MANAGEMENT_EDIT = 'USER_MANAGEMENT_EDIT',
  USER_MANAGEMENT_DELETE = 'USER_MANAGEMENT_DELETE',

  // Patient Management
  PATIENT_VIEW = 'PATIENT_VIEW',
  PATIENT_CREATE = 'PATIENT_CREATE',
  PATIENT_EDIT = 'PATIENT_EDIT',
  PATIENT_DELETE = 'PATIENT_DELETE',

  // Appointment Management
  APPOINTMENT_VIEW = 'APPOINTMENT_VIEW',
  APPOINTMENT_CREATE = 'APPOINTMENT_CREATE',
  APPOINTMENT_EDIT = 'APPOINTMENT_EDIT',
  APPOINTMENT_DELETE = 'APPOINTMENT_DELETE',

  // Treatment Management
  TREATMENT_VIEW = 'TREATMENT_VIEW',
  TREATMENT_CREATE = 'TREATMENT_CREATE',
  TREATMENT_EDIT = 'TREATMENT_EDIT',
  TREATMENT_DELETE = 'TREATMENT_DELETE',

  // Prescription Management
  PRESCRIPTION_VIEW = 'PRESCRIPTION_VIEW',
  PRESCRIPTION_CREATE = 'PRESCRIPTION_CREATE',
  PRESCRIPTION_EDIT = 'PRESCRIPTION_EDIT',
  PRESCRIPTION_DELETE = 'PRESCRIPTION_DELETE',

  // Finance Management
  FINANCE_VIEW = 'FINANCE_VIEW',
  FINANCE_EXPENSES_MANAGE = 'FINANCE_EXPENSES_MANAGE',
  FINANCE_INVOICES_MANAGE = 'FINANCE_INVOICES_MANAGE',
  FINANCE_ACCOUNTS_VIEW = 'FINANCE_ACCOUNTS_VIEW',
  FINANCE_ACCOUNTS_MANAGE = 'FINANCE_ACCOUNTS_MANAGE',

  // Inventory Management
  INVENTORY_VIEW = 'INVENTORY_VIEW',
  INVENTORY_MANAGE = 'INVENTORY_MANAGE',
  INVENTORY_LOW_STOCK_ALERT = 'INVENTORY_LOW_STOCK_ALERT',

  // Lab Case Management
  LAB_CASE_VIEW = 'LAB_CASE_VIEW',
  LAB_CASE_MANAGE = 'LAB_CASE_MANAGE',

  // Supplier Management
  SUPPLIER_VIEW = 'SUPPLIER_VIEW',
  SUPPLIER_MANAGE = 'SUPPLIER_MANAGE',

  // Reports
  REPORTS_VIEW = 'REPORTS_VIEW',
  REPORTS_GENERATE = 'REPORTS_GENERATE',

  // Settings
  SETTINGS_VIEW = 'SETTINGS_VIEW',
  SETTINGS_EDIT = 'SETTINGS_EDIT',

  // Notifications
  NOTIFICATIONS_VIEW = 'NOTIFICATIONS_VIEW',
  NOTIFICATIONS_MANAGE = 'NOTIFICATIONS_MANAGE',

  // System Administration
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_RESTORE = 'SYSTEM_RESTORE',
  SYSTEM_LOGS_VIEW = 'SYSTEM_LOGS_VIEW',
}

export interface UserProfile {
  id: string;
  user_id: string; // Supabase auth user id
  username: string;
  role: UserRole;
  avatar_url?: string; // URL for user avatar image
  status: UserStatus; // User status
  last_login?: string; // Last login timestamp
  created_at: string;
  updated_at: string;
  // OAuth fields
  oauth_provider?: string; // 'google', 'facebook', etc.
  oauth_id?: string; // OAuth provider user ID
  oauth_email?: string; // OAuth provider email
  linked_at?: string; // When OAuth was linked
  password_hash?: string; // For direct login
  // Custom permissions for individual user permission overrides
  custom_permissions?: Permission[]; // Custom permissions beyond role-based permissions
  override_permissions?: boolean; // When true, use only custom_permissions, ignoring role-based permissions
  // Backward compatibility: old permissions array
  permissions?: string[]; // Legacy permissions array for backward compatibility
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string; // e.g., 'login', 'update_profile', 'delete_user'
  details?: string;
  timestamp: string;
  ip_address?: string;
}

// Clinic interface for database
export interface Clinic {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}
