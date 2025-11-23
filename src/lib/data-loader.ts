
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { WashEvent, Aggregator, CounterAgent, Employee, SalaryScheme, EmployeeTransaction, RetailPriceConfig, Expense, ClientTransaction } from '@/types';

// In-memory cache variables
let washEventsCache: WashEvent[] | null = null;
let aggregatorsCache: Aggregator[] | null = null;
let counterAgentsCache: CounterAgent[] | null = null;
let employeesCache: Employee[] | null = null;
let salarySchemesCache: SalaryScheme[] | null = null;
let retailPriceConfigCache: RetailPriceConfig | null = null;
let expensesCache: Expense[] | null = null;
let inventoryCache: { chemicalStockGrams: number } | null = null;
const employeeTransactionsCache = new Map<string, EmployeeTransaction[]>();
let allEmployeeTransactionsCache: EmployeeTransaction[] | null = null;
const clientTransactionsCache = new Map<string, ClientTransaction[]>();

// --- Cache Invalidation Functions ---
export async function invalidateWashEventsCache() { washEventsCache = null; }
export async function invalidateAggregatorsCache() { aggregatorsCache = null; }
export async function invalidateCounterAgentsCache() { counterAgentsCache = null; }
export async function invalidateEmployeesCache() { employeesCache = null; }
export async function invalidateSalarySchemesCache() { salarySchemesCache = null; }
export async function invalidateRetailPriceConfigCache() { retailPriceConfigCache = null; }
export async function invalidateExpensesCache() { expensesCache = null; }
export async function invalidateInventoryCache() { inventoryCache = null; }
export async function invalidateEmployeeTransactionsCache(employeeId: string) {
    employeeTransactionsCache.delete(employeeId);
    allEmployeeTransactionsCache = null;
}
export async function invalidateAllEmployeeTransactionsCache() {
    allEmployeeTransactionsCache = null;
    employeeTransactionsCache.clear();
}
export async function invalidateClientTransactionsCache(clientId: string) { clientTransactionsCache.delete(clientId); }


// Generic function to read data from a directory of JSON files
async function readDataFromDirectory<T>(dirName: string): Promise<T[]> {
  const dataDir = path.join(process.cwd(), 'data', dirName);
  try {
    await fs.access(dataDir);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (mkdirError) {
        console.error(`Failed to create directory ${dataDir}:`, mkdirError);
        throw mkdirError;
      }
      return []; // Directory didn't exist, so no data.
    }
    throw error;
  }

  const files = await fs.readdir(dataDir);
  const dataList: T[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(dataDir, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      try {
        const jsonData = JSON.parse(fileContent);
        // Correctly handle both single objects and arrays of objects in files.
        if (Array.isArray(jsonData)) {
          dataList.push(...jsonData);
        } else {
          dataList.push(jsonData);
        }
      } catch (parseError) {
        console.error(`Error parsing JSON from file ${file}:`, parseError);
      }
    }
  }
  return dataList;
}

// Specific data loader functions using the cache
export async function getWashEventsData(): Promise<WashEvent[]> {
  if (washEventsCache) return washEventsCache;
  const events = await readDataFromDirectory<WashEvent>('wash-events');
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  washEventsCache = events;
  return events;
}

export async function getAggregatorsData(): Promise<Aggregator[]> {
  if (aggregatorsCache) return aggregatorsCache;
  aggregatorsCache = await readDataFromDirectory<Aggregator>('aggregators');
  return aggregatorsCache;
}

export async function getCounterAgentsData(): Promise<CounterAgent[]> {
  if (counterAgentsCache) return counterAgentsCache;
  counterAgentsCache = await readDataFromDirectory<CounterAgent>('counter-agents');
  return counterAgentsCache;
}

export async function getEmployeesData(): Promise<Employee[]> {
  if (employeesCache) return employeesCache;
  employeesCache = await readDataFromDirectory<Employee>('employees');
  return employeesCache;
}

export async function getSalarySchemesData(): Promise<SalaryScheme[]> {
  if (salarySchemesCache) return salarySchemesCache;
  salarySchemesCache = await readDataFromDirectory<SalaryScheme>('salary-schemes');
  return salarySchemesCache;
}

export async function getExpensesData(): Promise<Expense[]> {
    if (expensesCache) return expensesCache;
    const expenses = await readDataFromDirectory<Expense>('expenses');
    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    expensesCache = expenses;
    return expenses;
}

export async function getAllEmployeeTransactions(): Promise<EmployeeTransaction[]> {
    if (allEmployeeTransactionsCache) return allEmployeeTransactionsCache;
    const transactions = await readDataFromDirectory<EmployeeTransaction>('employee-transactions');
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    allEmployeeTransactionsCache = transactions;
    return transactions;
}

export async function getEmployeeTransactions(employeeId: string): Promise<EmployeeTransaction[]> {
  if (employeeTransactionsCache.has(employeeId)) {
      return employeeTransactionsCache.get(employeeId)!;
  }

  const dataDir = path.join(process.cwd(), 'data', 'employee-transactions');
  const filePath = path.join(dataDir, `${employeeId}.json`);
  
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const transactions = JSON.parse(fileContent) as EmployeeTransaction[];
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    employeeTransactionsCache.set(employeeId, transactions);
    return transactions;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (mkdirError) {
        console.error(`Failed to create directory ${dataDir}:`, mkdirError);
      }
      return [];
    }
    console.error(`Error reading transactions for employee ${employeeId}:`, error);
    throw error;
  }
}

export async function getClientTransactions(clientId: string): Promise<ClientTransaction[]> {
  if (clientTransactionsCache.has(clientId)) {
      return clientTransactionsCache.get(clientId)!;
  }

  const dataDir = path.join(process.cwd(), 'data', 'client-transactions');
  const filePath = path.join(dataDir, `${clientId}.json`);
  
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const transactions = JSON.parse(fileContent) as ClientTransaction[];
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    clientTransactionsCache.set(clientId, transactions);
    return transactions;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (mkdirError) {
        console.error(`Failed to create directory ${dataDir}:`, mkdirError);
      }
      return [];
    }
    console.error(`Error reading transactions for client ${clientId}:`, error);
    throw error;
  }
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
    const employees = await getEmployeesData(); // This will use the cache
    return employees.find(e => e.id === id) || null;
}

export async function getCounterAgentById(id: string): Promise<CounterAgent | null> {
    const agents = await getCounterAgentsData();
    return agents.find(a => a.id === id) || null;
}

export async function getAggregatorById(id: string): Promise<Aggregator | null> {
    const aggregators = await getAggregatorsData();
    return aggregators.find(a => a.id === id) || null;
}

export async function getExpenseById(id: string): Promise<Expense | null> {
    const expenses = await getExpensesData();
    return expenses.find(e => e.id === id) || null;
}

export async function getWashEventById(id: string): Promise<WashEvent | null> {
    const events = await getWashEventsData();
    return events.find(e => e.id === id) || null;
}

export async function getSalarySchemeById(id: string): Promise<SalaryScheme | null> {
    const schemes = await getSalarySchemesData();
    return schemes.find(s => s.id === id) || null;
}

// Special function for retail price list since it's a single file
export async function getRetailPriceConfig(): Promise<RetailPriceConfig> {
    if (retailPriceConfigCache) return retailPriceConfigCache;
    
    const dataFile = path.join(process.cwd(), 'data', 'retail-price-list.json');
    try {
        const fileContent = await fs.readFile(dataFile, 'utf-8');
        const data: RetailPriceConfig = JSON.parse(fileContent);

        if (data.allowCustomRetailServices === undefined) data.allowCustomRetailServices = true;
        if (data.cardAcquiringPercentage === undefined) data.cardAcquiringPercentage = 1.2;
        
        retailPriceConfigCache = data;
        return data;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.error('Retail price list file not found, creating a new one:', dataFile);
            const emptyConfig: RetailPriceConfig = { mainPriceList: [], additionalPriceList: [], allowCustomRetailServices: true, cardAcquiringPercentage: 1.2 };
            await fs.writeFile(dataFile, JSON.stringify(emptyConfig, null, 2), 'utf-8');
            retailPriceConfigCache = emptyConfig;
            return emptyConfig;
        }
        console.error('Error reading retail price list:', error);
        throw error;
    }
}

export async function getInventory(): Promise<{ chemicalStockGrams: number }> {
    if (inventoryCache) return inventoryCache;

    const dataFile = path.join(process.cwd(), 'data', 'inventory.json');
    try {
        const fileContent = await fs.readFile(dataFile, 'utf-8');
        const data = JSON.parse(fileContent);
        inventoryCache = data;
        return data;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            const emptyInventory = { chemicalStockGrams: 0 };
            try {
                await fs.writeFile(dataFile, JSON.stringify(emptyInventory, null, 2), 'utf-8');
            } catch (writeError) {
                console.error('Failed to create inventory file:', writeError);
            }
            inventoryCache = emptyInventory;
            return emptyInventory;
        }
        console.error('Error reading inventory file:', error);
        throw error;
    }
}

export async function getAllFinanceDataForEmployee(employeeId: string) {
    const [allWashEvents, allSchemes, initialTransactions, allEmployees] = await Promise.all([
        getWashEventsData(),
        getSalarySchemesData(),
        getEmployeeTransactions(employeeId),
        getEmployeesData()
    ]);
    return { allWashEvents, allSchemes, initialTransactions, allEmployees };
}
