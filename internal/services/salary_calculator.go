package services

import (
	"backend-go/internal/models"
	"sort"
)

// SalaryCalculator handles salary calculations
type SalaryCalculator struct{}

func NewSalaryCalculator() *SalaryCalculator {
	return &SalaryCalculator{}
}

// getWashSourceType determines the source type from a wash event
func getWashSourceType(event *models.WashEvent) string {
	switch event.PaymentMethod {
	case models.WashPaymentCash, models.WashPaymentCard, models.WashPaymentTransfer:
		return "retail"
	case models.WashPaymentAggregator:
		return "aggregator"
	case models.WashPaymentCounterAgentContract:
		return "counterAgent"
	default:
		return ""
	}
}

// calculateIndividualShare calculates the salary for a single employee for a specific wash event
func (s *SalaryCalculator) calculateIndividualShare(
	scheme *models.SalaryScheme,
	event *models.WashEvent,
	numEmployeesOnWash int,
) (earnings float64, unpaidServices []string) {
	if numEmployeesOnWash <= 0 {
		return 0, nil
	}

	// Percentage-based schemes
	if scheme.Type == models.SalarySchemePercentage {
		totalBaseAmount := event.TotalAmount
		if event.NetAmount > 0 {
			totalBaseAmount = event.NetAmount
		}

		totalAmountAfterDeduction := totalBaseAmount - scheme.FixedDeduction
		totalSalaryPool := totalAmountAfterDeduction * (scheme.Percentage / 100)
		earning := totalSalaryPool / float64(numEmployeesOnWash)

		if earning > 0 {
			return float64(int(earning*100)) / 100, nil // Round to 2 decimal places
		}
		return 0, nil
	}

	// Rate-based schemes
	if scheme.Type == models.SalarySchemeRate {
		schemeSource := scheme.RateSource

		// Check if the scheme is applicable to this specific wash
		if schemeSource != nil {
			washSourceType := getWashSourceType(event)

			if string(schemeSource.Type) != washSourceType {
				return 0, nil
			}

			washSourceId := "retail"
			if washSourceType != "retail" {
				washSourceId = event.SourceID
			}

			if schemeSource.ID != washSourceId {
				return 0, nil
			}

			// Additional check for aggregator price list name
			if washSourceType == "aggregator" && schemeSource.PriceListName != "" && event.PriceListName != schemeSource.PriceListName {
				return 0, nil
			}
		}

		// Build rate map
		rateMap := make(map[string]models.SalaryRate)
		for _, r := range scheme.Rates {
			rateMap[r.ServiceName] = r
		}

		// Calculate total rate for all services
		allServices := []models.PriceListItem{event.Services.Main}
		allServices = append(allServices, event.Services.Additional...)

		var totalRateForWash float64
		var unpaid []string

		for _, service := range allServices {
			if service.ServiceName == "" {
				continue
			}

			rateItem, found := rateMap[service.ServiceName]
			if found && rateItem.Rate > 0 {
				earningForService := rateItem.Rate - rateItem.Deduction
				if earningForService > 0 {
					totalRateForWash += earningForService
				}
			} else {
				// Check for duplicates
				isDuplicate := false
				for _, s := range unpaid {
					if s == service.ServiceName {
						isDuplicate = true
						break
					}
				}
				if !isDuplicate {
					unpaid = append(unpaid, service.ServiceName)
				}
			}
		}

		earning := totalRateForWash / float64(numEmployeesOnWash)
		if earning > 0 {
			return float64(int(earning*100)) / 100, unpaid
		}
		return 0, unpaid
	}

	return 0, nil
}

// GenerateSalaryReport generates salary report for all employees
func (s *SalaryCalculator) GenerateSalaryReport(
	washEvents []models.WashEvent,
	employees []models.Employee,
	salarySchemes []models.SalaryScheme,
) []models.SalaryReportData {
	// Build scheme map
	schemeMap := make(map[string]models.SalaryScheme)
	for _, scheme := range salarySchemes {
		schemeMap[scheme.ID] = scheme
	}

	// Build employee map
	employeeMap := make(map[string]models.Employee)
	for _, emp := range employees {
		employeeMap[emp.ID] = emp
	}

	// Initialize salary data for all employees
	salaryData := make(map[string]*models.SalaryReportData)
	for _, emp := range employees {
		salaryData[emp.ID] = &models.SalaryReportData{
			EmployeeID:    emp.ID,
			EmployeeName:  emp.FullName,
			TotalEarnings: 0,
			Breakdown:     []models.SalaryBreakdownItem{},
		}
	}

	// Process each wash event
	for _, event := range washEvents {
		if len(event.EmployeeIDs) == 0 {
			continue
		}

		// Get employees on this wash
		var employeesOnWash []models.Employee
		for _, empID := range event.EmployeeIDs {
			if emp, found := employeeMap[empID]; found {
				employeesOnWash = append(employeesOnWash, emp)
			}
		}

		if len(employeesOnWash) == 0 {
			continue
		}

		// Calculate for each employee
		for _, emp := range employeesOnWash {
			if emp.SalarySchemeID == "" {
				continue
			}

			scheme, found := schemeMap[emp.SalarySchemeID]
			if !found {
				continue
			}

			earnings, unpaidServices := s.calculateIndividualShare(&scheme, &event, len(employeesOnWash))

			// Add to breakdown if there are earnings OR unpaid services
			if earnings > 0 || len(unpaidServices) > 0 {
				salaryData[emp.ID].TotalEarnings += earnings
				salaryData[emp.ID].Breakdown = append(salaryData[emp.ID].Breakdown, models.SalaryBreakdownItem{
					WashEventID:    event.ID,
					Timestamp:      event.Timestamp,
					VehicleNumber:  event.VehicleNumber,
					Earnings:       earnings,
					UnpaidServices: unpaidServices,
				})
			}
		}
	}

	// Convert to slice and sort by total earnings descending
	var result []models.SalaryReportData
	for _, data := range salaryData {
		result = append(result, *data)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].TotalEarnings > result[j].TotalEarnings
	})

	return result
}
