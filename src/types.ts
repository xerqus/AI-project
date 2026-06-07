export type PaymentMethod = 'POS' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';

export interface PaymentMethodDetail {
  id: PaymentMethod;
  label: string;
}

export const PAYMENT_METHODS: PaymentMethodDetail[] = [
  { id: 'POS', label: 'کارتخوان' },
  { id: 'BANK_TRANSFER', label: 'انتقال بانکی' },
  { id: 'CASH', label: 'نقدی' },
  { id: 'OTHER', label: 'سایر' }
];

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  unitPriceAed: number;
}

export interface LicencePlate {
  part1: string;
  letter: string;
  part2: string;
  cityCode: string;
}

export interface InvoiceState {
  id: string; // unique ID for local db
  invoiceNo: string;
  date: string;
  time: string;
  contactNo: string;
  managerName: string;
  
  // Customer Info
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  
  // Car Info
  carModel: string;
  carYear: string;
  carColor: string;
  licencePlate: LicencePlate;
  carVin: string;
  carMileage: string;
  
  // Invoice Items
  items: InvoiceItem[];
  
  // Financials
  discountUsd: number;
  discountAed: number;
  vatRatePercent: number;
  
  // Notes
  notes: string;
  
  // Payment Method
  paymentMethod: PaymentMethod;
  
  // Signature Toggle
  isSignedDummy: boolean;
}

export interface AppSettings {
  logoBase64: string | null;
  themeColor: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  logoBase64: null,
  themeColor: '#1e3a8a' // default brand primary (blue-900)
};
