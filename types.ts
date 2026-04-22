
export interface AppUser {
  id: string;
  username: string;
  password: string; // Storing plain text for simplicity in this local app
  role: 'admin' | 'user';
}

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue'
}

export enum QuotationStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected'
}

export interface Address {
  street: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
}

export interface BankAccount {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: string;
}

export interface LineItem {
  id: string;
  description: string;
  details?: string;
  hsn: string;
  qty: number;
  rate: number;
  taxRate: number; // e.g., 18 for 18%
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: Address;
  gstin?: string;
  pan?: string;
  customFields?: CustomField[];
}

export interface DocumentSequence {
  prefix: string;
  suffix: string;
  nextNumber: number;
  padding: number;
}

export interface UserBusinessProfile {
  companyName: string;
  logoUrl?: string;
  signatureUrl?: string;
  address: Address;
  gstin: string;
  pan: string;
  bankAccounts: BankAccount[];
  emailTemplate?: string;
  defaultInvoiceTerms?: string;
  defaultQuotationTerms?: string;
  defaultChallanTerms?: string;
  invoiceSequence?: DocumentSequence;
  quotationSequence?: DocumentSequence;
  challanSequence?: DocumentSequence;
}

export interface CustomField {
  label: string;
  value: string;
}

export interface AdditionalCharge {
  id: string;
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  poNumber?: string; // Kept for backward compatibility, UI uses customFields
  status: InvoiceStatus;
  clientId: string;
  clientDetails?: Client; // Embedded snapshot of the client at creation/edit time
  items: LineItem[];
  notes?: string;
  terms?: string;
  placeOfSupply: string;
  bankDetails?: BankAccount;
  
  // New fields for enhanced functionality
  customFields?: CustomField[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  additionalCharges?: AdditionalCharge[];
  roundOff?: number;
  showBankDetails?: boolean;
  taxType?: 'auto' | 'cgst_sgst' | 'igst';
}

export interface Quotation {
  id: string;
  number: string;
  date: string;
  validUntil: string; // Equivalent to dueDate
  status: QuotationStatus;
  clientId: string;
  clientDetails?: Client; // Embedded snapshot
  items: LineItem[];
  notes?: string;
  terms?: string;
  placeOfSupply: string;
  bankDetails?: BankAccount;
  customFields?: CustomField[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  additionalCharges?: AdditionalCharge[];
  roundOff?: number;
  showBankDetails?: boolean;
  taxType?: 'auto' | 'cgst_sgst' | 'igst';
}

export enum DeliveryChallanStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  DELIVERED = 'Delivered',
  RETURNED = 'Returned'
}

export interface DeliveryChallan {
  id: string;
  number: string;
  date: string;
  status: DeliveryChallanStatus;
  clientId: string;
  clientDetails?: Client; // Embedded snapshot
  items: LineItem[];
  notes?: string;
  terms?: string;
  placeOfSupply: string;
  customFields?: CustomField[];
  additionalCharges?: AdditionalCharge[];
  taxType?: 'auto' | 'cgst_sgst' | 'igst';
}

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  PROPOSAL = 'Proposal',
  WON = 'Won',
  LOST = 'Lost'
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: LeadStatus;
  createdAt: string;
}