export interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  mobileNumber: string;
  gstin: string;
}

export interface Bill {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  mobileNumber: string;
  clientGstin?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  additionalCharges: number;
  discount: number;
  taxRate: number; // percentage, e.g. 18 for 18%
  taxAmount: number; // calculated tax amount
  notes: string;
  totalAmount: number;
  
  // For backwards compatibility
  workDescription?: string;
  totalWorkingHours?: number;
  ratePerHour?: number;
}

export type Language = "en" | "hi";
export type ThemeMode = "light" | "dark";
