







export interface Owner {
  id: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
}

export interface Car {
  id: string;
  licensePlate: string;
}

export interface CounterAgentCompany {
  companyName: string;
  ownerName: string;
  managerSocialContact?: string; 
  accountantSocialContact?: string; 

  // Fields for invoicing
  customerName?: string; // Заказчик
  inn?: string; // ИНН
  kpp?: string; // КПП
  ogrnNumber?: string; // ОГРН №
  ogrnDate?: string; // ОГРН от даты
  legalAddress?: string; // Адрес
  bankName?: string; // имя банка
  settlementAccount?: string; // р/с
  correspondentAccount?: string; // к/с
  bik?: string; // БИК
  phone?: string; // Тел.:
  email?: string; // e-mail:
}

export interface MyCompanyDetails extends Omit<CounterAgentCompany, 'managerSocialContact' | 'accountantSocialContact' | 'customerName'> {
    ogrnip?: string;
}

export interface EmployeeConsumption {
  employeeId: string;
  amount: number; // in grams
}

export interface PriceListItem {
  serviceName: string;
  price: number;
  isCustom?: boolean;
  chemicalConsumption?: number; // Norma per service, in grams
  employeeConsumptions?: EmployeeConsumption[]; // Actual consumption per employee
}

export interface RetailPriceConfig {
  mainPriceList: PriceListItem[];
  additionalPriceList: PriceListItem[];
  allowCustomRetailServices?: boolean;
  cardAcquiringPercentage?: number;
  dismissedCustomServices?: string[];
}

export interface CounterAgent {
  id:string;
  name: string;
  balance?: number;
  companies: CounterAgentCompany[];
  cars: Car[];
  priceList?: PriceListItem[];
  additionalPriceList?: PriceListItem[];
  allowCustomServices?: boolean;
}

export interface NamedPriceList {
  name: string;
  services: PriceListItem[];
}

export interface Aggregator {
  id: string;
  name: string;
  balance?: number;
  companies?: CounterAgentCompany[];
  cars: Car[];
  priceLists: NamedPriceList[];
  activePriceListName?: string;
}

export type PaymentType = 'cash' | 'card' | 'transfer';

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  paymentType: PaymentType;
  clientName: string;
  notes?: string;
}

// For AI Report
export interface DailyRevenue {
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface AggregatorPerformance {
  aggregatorName: string;
  totalRevenue: number;
  numberOfWashes: number;
}

export interface CashPayment {
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  paymentDetails: string;
  hasCar: boolean;
  username?: string;
  password?: string;
  salarySchemeId?: string;
}

export interface SalaryRate {
  serviceName: string;
  rate: number;
  deduction?: number;
}

export interface RateSource {
  type: 'retail' | 'aggregator' | 'counterAgent';
  id: string; // 'retail' for retail, or aggregator/agent ID
  priceListName?: string; // Optional: For aggregators with multiple price lists.
}

export interface SalaryScheme {
  id: string;
  name: string;
  type: 'percentage' | 'rate';
  percentage?: number;
  fixedDeduction?: number;
  rateSource?: RateSource;
  rates?: SalaryRate[];
}

export interface WashEventEditHistory {
    editedAt: string; // ISO timestamp of the edit
    editedBy: string; // ID of the employee who edited
    previousState: Partial<WashEvent>; // The state of the WashEvent before this edit
    reason?: string; // Optional reason for the edit
}

export interface WashComment {
  text: string;
  authorId: string;
  date: string; // ISO timestamp
}

export interface WashEvent {
  id: string;
  timestamp: string; // ISO string
  vehicleNumber: string;
  employeeIds: string[];
  paymentMethod: 'cash' | 'card' | 'transfer' | 'aggregator' | 'counterAgentContract';
  sourceId?: string; // aggregatorId or counterAgentId
  sourceName?: string; // aggregatorName or counterAgentName
  priceListName?: string; // For aggregators, to specify which price list was used
  totalAmount: number;
  netAmount?: number; // After acquiring fee
  acquiringFee?: number;
  services: {
    main: PriceListItem & { id?: string };
    additional: (PriceListItem & { id?: string })[];
  };
  driverComments?: WashComment[];
  editHistory?: WashEventEditHistory[];
}

export type EmployeeTransactionType = 'payment' | 'loan' | 'bonus' | 'purchase';

export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  date: string; // ISO string
  type: EmployeeTransactionType;
  amount: number; // always positive, type determines if it's a credit or debit.
  description: string;
}

export interface ClientTransaction {
  id: string;
  clientId: string;
  date: string; // ISO string
  type: 'payment';
  amount: number;
  description: string;
}


// --- Structures for Salary Report ---

export interface SalaryBreakdownItem {
  washEventId: string;
  timestamp: string;
  vehicleNumber: string;
  earnings: number;
  unpaidServices: string[];
}

export interface SalaryReportData {
  employeeId: string;
  employeeName: string;
  totalEarnings: number;
  breakdown: SalaryBreakdownItem[];
}


// --- Structures for Expenses ---

export interface Expense {
  id: string;
  date: string; // ISO string
  category: string;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  pricePerUnit?: number;
}

// --- Structures for Chemical Analytics ---
export interface ChemicalConsumptionReport {
  [employeeId: string]: {
    employeeName: string;
    totalConsumption: number; // in grams
    washCount: number;
  }
}
