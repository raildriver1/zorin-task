
'use server';

import type { WashEvent, Employee, SalaryScheme, SalaryRate, SalaryReportData, SalaryBreakdownItem } from '@/types';

// Helper to determine the source type from a wash event
function getWashSourceType(washEvent: WashEvent): 'retail' | 'aggregator' | 'counterAgent' | null {
  switch (washEvent.paymentMethod) {
    case 'cash':
    case 'card':
    case 'transfer':
      return 'retail';
    case 'aggregator':
      return 'aggregator';
    case 'counterAgentContract':
      return 'counterAgent';
    default:
      return null;
  }
}


/**
 * Calculates the salary for a single employee for a specific wash event.
 * It determines the employee's share of the work and applies their specific salary scheme to that share.
 * @returns The calculated salary for this employee for this wash and a list of any services for which no rate was found.
 */
function calculateIndividualShare(
  employeeScheme: SalaryScheme,
  washEvent: WashEvent,
  numEmployeesOnWash: number
): { earnings: number; unpaidServices: string[] } {
  const result: { earnings: number; unpaidServices: string[] } = { earnings: 0, unpaidServices: [] };

  if (numEmployeesOnWash <= 0) return result;

  if (employeeScheme.type === 'percentage') {
    // For percentage-based schemes:
    const totalBaseAmount = washEvent.netAmount !== undefined ? washEvent.netAmount : washEvent.totalAmount;
    const totalAmountAfterDeduction = totalBaseAmount - (employeeScheme.fixedDeduction ?? 0);
    const totalSalaryPool = totalAmountAfterDeduction * ((employeeScheme.percentage ?? 0) / 100);
    const earning = totalSalaryPool / numEmployeesOnWash;

    result.earnings = earning > 0 ? parseFloat(earning.toFixed(2)) : 0;
    return result;
  }

  if (employeeScheme.type === 'rate') {
    // For rate-based schemes:
    const schemeSource = employeeScheme.rateSource;

    // 1. If a source is defined, check if the scheme is applicable to this specific wash.
    if (schemeSource) {
      const washSourceType = getWashSourceType(washEvent);
      
      if (schemeSource.type !== washSourceType) return result;
      
      const washSourceId = washSourceType === 'retail' ? 'retail' : washEvent.sourceId;
      if (schemeSource.id !== washSourceId) return result;
      
      // Additional check for aggregator price list name
      if (washSourceType === 'aggregator' && schemeSource.priceListName && washEvent.priceListName !== schemeSource.priceListName) {
        return result;
      }
    }
    // If no source is defined (schemeSource is undefined), the scheme is universal and applies to any wash.


    // 2. Calculate the total rate for all services performed, applying per-service deductions.
    const allServices = [washEvent.services.main, ...washEvent.services.additional];
    let totalRateForWash = 0;
    const rateMap = new Map<string, SalaryRate>(employeeScheme.rates?.map(r => [r.serviceName, r]) || []);

    for (const service of allServices) {
      if (!service?.serviceName) continue;
      const rateItem = rateMap.get(service.serviceName);
      if (rateItem && rateItem.rate > 0) {
        const earningForService = (rateItem.rate ?? 0) - (rateItem.deduction ?? 0);
        totalRateForWash += earningForService > 0 ? earningForService : 0;
      } else if (!rateItem || rateItem.rate <= 0) {
        // Avoid duplicates in unpaidServices array
        if (!result.unpaidServices.includes(service.serviceName)) {
          result.unpaidServices.push(service.serviceName);
        }
      }
    }

    // 3. The employee's earning is their share of the total calculated rate.
    const earning = totalRateForWash / numEmployeesOnWash;
    result.earnings = earning > 0 ? parseFloat(earning.toFixed(2)) : 0;
    return result;
  }

  return result;
}


export async function generateSalaryReport(
  washEvents: WashEvent[],
  employees: Employee[],
  salarySchemes: SalaryScheme[]
): Promise<SalaryReportData[]> {
  const schemeMap = new Map(salarySchemes.map(s => [s.id, s]));
  const salaryData: Record<string, SalaryReportData> = {};

  // Initialize data for all employees
  for (const emp of employees) {
    salaryData[emp.id] = {
      employeeId: emp.id,
      employeeName: emp.fullName,
      totalEarnings: 0,
      breakdown: [],
    };
  }

  for (const event of washEvents) {
    if (!event.employeeIds || event.employeeIds.length === 0) continue;
    
    const employeesOnWash = event.employeeIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];
    if (employeesOnWash.length === 0) continue;
    
    for (const employee of employeesOnWash) {
        if (!employee.salarySchemeId) continue;
        const scheme = schemeMap.get(employee.salarySchemeId);
        if (!scheme) continue;
        
        const { earnings, unpaidServices } = calculateIndividualShare(scheme, event, employeesOnWash.length);
        
        // Add to breakdown if there are earnings OR if there are unpaid services to report
        if (earnings > 0 || unpaidServices.length > 0) {
            salaryData[employee.id].totalEarnings += earnings;
            salaryData[employee.id].breakdown.push({
                washEventId: event.id,
                timestamp: event.timestamp,
                vehicleNumber: event.vehicleNumber,
                earnings: earnings,
                unpaidServices: unpaidServices,
            });
        }
    }
  }
  
  // Return sorted by total earnings descending
  return Object.values(salaryData).sort((a, b) => b.totalEarnings - a.totalEarnings);
}
