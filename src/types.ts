export interface Bill {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  mobileNumber: string;
  date: string;
  workDescription: string;
  totalWorkingHours: number;
  ratePerHour: number;
  additionalCharges: number;
  discount: number;
  notes: string;
  totalAmount: number;
}

export type Language = "en" | "hi";
export type ThemeMode = "light" | "dark";
