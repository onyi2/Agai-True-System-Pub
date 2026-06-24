export interface InventoryItem {
  id: string;
  sku?: string; // e.g. BR001, WH001
  name: string; // Dynamic combination of Brand + Pack Size (e.g. "Gilbey's Gin - 750ml")
  category: 'Gin' | 'Whisky' | 'Brandy / Cognac' | 'Vodka' | 'Rum' | 'Tequila' | 'Liqueurs' | 'Bottled Beer' | 'Canned Beer / RTD' | 'Mixers / Soft Drinks' | 'Water' | 'Wine' | 'Food' | 'Others';
  brand: string;
  packSize: string; // e.g. "250ml", "350ml", "500ml", "750ml", "1L", "Can"
  openingStock: number; // S01
  received: number; // S02 (S02 stock arrivals)
  sold: number; // Sold count in POS
  quantity: number; // Current stock level (Closing Stock)
  variance: number; // Total units lost (breakage, theft, etc.)
  unit: string; // e.g. "Bottle", "Pint", "Can"
  minThreshold: number; // For low stock alert (Reorder Level)
  costPrice: number; // Buying Price from supplier
  sellPrice: number; // Selling Price to customers
  supplier: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Manager' | 'Bartender' | 'Waiter' | 'Security';
  contact: string;
  hourlyRate: number;
}

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  role: 'Manager' | 'Bartender' | 'Waiter' | 'Security';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  totalHours: number;
  payAmount: number;
  status: 'Scheduled' | 'Completed' | 'Canceled';
}

export interface SaleItem {
  itemId: string;
  sku?: string;
  name: string;
  quantity: number;
  sellPrice: number;
  costPrice: number;
}

export interface Sale {
  id: string;
  timestamp: string; // ISO string
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile (M-Pesa)' | 'Tab';
  loggedBy: string; // Name of bartender/manager
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Suppliers' | 'Marketing' | 'Others';
  amount: number;
  description: string;
  status: 'Paid' | 'Pending';
  receiptUrl?: string; // Optional simulated receipt image
}

export interface Loss {
  id: string;
  date: string; // YYYY-MM-DD
  itemId: string;
  itemName: string;
  type: 'Breakage' | 'Spillage' | 'Theft' | 'Complimentary' | 'Expired';
  quantity: number;
  costValue: number; // Total cost lost
  notes: string;
  loggedBy: string;
}

export interface SalesDataPoint {
  day: string;
  sales: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  rating: number; // 1-5
  paymentTerms: string;
  categories: string[];
}

export interface DeliveryItem {
  itemId: string;
  itemName: string;
  quantity: number;
  costPrice: number; // Historical cost price recorded for this specific delivery
}

export interface DeliveryRecord {
  id: string;
  date: string; // YYYY-MM-DD
  supplier: string;
  items: DeliveryItem[];
  totalAmount: number;
}
