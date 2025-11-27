package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"backend-go/internal/models"
)

type JSONStore struct {
	dataPath string
	mu       sync.RWMutex
}

func NewJSONStore(dataPath string) *JSONStore {
	return &JSONStore{
		dataPath: dataPath,
	}
}

// Helper functions for file operations
func (s *JSONStore) readJSONFile(filePath string, v interface{}) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

func (s *JSONStore) writeJSONFile(filePath string, v interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}

	// Ensure directory exists
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(filePath, data, 0644)
}

func (s *JSONStore) deleteFile(filePath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return os.Remove(filePath)
}

func (s *JSONStore) readFromDirectory(dir string, pattern string) ([]string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	fullPath := filepath.Join(s.dataPath, dir)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".json") {
			if pattern == "" || strings.HasPrefix(entry.Name(), pattern) {
				files = append(files, filepath.Join(fullPath, entry.Name()))
			}
		}
	}
	return files, nil
}

// ==================== EMPLOYEES ====================

func (s *JSONStore) GetAllEmployees() ([]models.Employee, error) {
	files, err := s.readFromDirectory("employees", "emp_")
	if err != nil {
		return nil, err
	}

	var employees []models.Employee
	for _, file := range files {
		var emp models.Employee
		if err := s.readJSONFile(file, &emp); err != nil {
			continue
		}
		employees = append(employees, emp)
	}
	return employees, nil
}

func (s *JSONStore) GetEmployeeByID(id string) (*models.Employee, error) {
	files, err := s.readFromDirectory("employees", "")
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		var emp models.Employee
		if err := s.readJSONFile(file, &emp); err != nil {
			continue
		}
		if emp.ID == id {
			return &emp, nil
		}
	}
	return nil, fmt.Errorf("employee not found: %s", id)
}

func (s *JSONStore) GetEmployeeByUsername(username string) (*models.Employee, error) {
	employees, err := s.GetAllEmployees()
	if err != nil {
		return nil, err
	}

	for _, emp := range employees {
		if emp.Username == username {
			return &emp, nil
		}
	}
	return nil, fmt.Errorf("employee not found with username: %s", username)
}

func (s *JSONStore) SaveEmployee(emp *models.Employee) error {
	filename := fmt.Sprintf("emp_%s.json", strings.ReplaceAll(emp.ID, "emp_", ""))
	if !strings.HasPrefix(emp.ID, "emp_") {
		filename = fmt.Sprintf("%s.json", emp.ID)
	}
	filePath := filepath.Join(s.dataPath, "employees", filename)
	return s.writeJSONFile(filePath, emp)
}

func (s *JSONStore) DeleteEmployee(id string) error {
	files, err := s.readFromDirectory("employees", "")
	if err != nil {
		return err
	}

	for _, file := range files {
		var emp models.Employee
		if err := s.readJSONFile(file, &emp); err != nil {
			continue
		}
		if emp.ID == id {
			return s.deleteFile(file)
		}
	}
	return fmt.Errorf("employee not found: %s", id)
}

// ==================== COUNTER AGENTS ====================

func (s *JSONStore) GetAllCounterAgents() ([]models.CounterAgent, error) {
	files, err := s.readFromDirectory("counter-agents", "agent_")
	if err != nil {
		return nil, err
	}

	var agents []models.CounterAgent
	for _, file := range files {
		var agent models.CounterAgent
		if err := s.readJSONFile(file, &agent); err != nil {
			continue
		}
		agents = append(agents, agent)
	}
	return agents, nil
}

func (s *JSONStore) GetCounterAgentByID(id string) (*models.CounterAgent, error) {
	files, err := s.readFromDirectory("counter-agents", "")
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		var agent models.CounterAgent
		if err := s.readJSONFile(file, &agent); err != nil {
			continue
		}
		if agent.ID == id {
			return &agent, nil
		}
	}
	return nil, fmt.Errorf("counter agent not found: %s", id)
}

func (s *JSONStore) SaveCounterAgent(agent *models.CounterAgent) error {
	filename := fmt.Sprintf("%s.json", agent.ID)
	filePath := filepath.Join(s.dataPath, "counter-agents", filename)
	return s.writeJSONFile(filePath, agent)
}

func (s *JSONStore) DeleteCounterAgent(id string) error {
	files, err := s.readFromDirectory("counter-agents", "")
	if err != nil {
		return err
	}

	for _, file := range files {
		var agent models.CounterAgent
		if err := s.readJSONFile(file, &agent); err != nil {
			continue
		}
		if agent.ID == id {
			return s.deleteFile(file)
		}
	}
	return fmt.Errorf("counter agent not found: %s", id)
}

// ==================== AGGREGATORS ====================

func (s *JSONStore) GetAllAggregators() ([]models.Aggregator, error) {
	files, err := s.readFromDirectory("aggregators", "agg_")
	if err != nil {
		return nil, err
	}

	var aggregators []models.Aggregator
	for _, file := range files {
		var agg models.Aggregator
		if err := s.readJSONFile(file, &agg); err != nil {
			continue
		}
		aggregators = append(aggregators, agg)
	}
	return aggregators, nil
}

func (s *JSONStore) GetAggregatorByID(id string) (*models.Aggregator, error) {
	files, err := s.readFromDirectory("aggregators", "")
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		var agg models.Aggregator
		if err := s.readJSONFile(file, &agg); err != nil {
			continue
		}
		if agg.ID == id {
			return &agg, nil
		}
	}
	return nil, fmt.Errorf("aggregator not found: %s", id)
}

func (s *JSONStore) SaveAggregator(agg *models.Aggregator) error {
	filename := fmt.Sprintf("%s.json", agg.ID)
	filePath := filepath.Join(s.dataPath, "aggregators", filename)
	return s.writeJSONFile(filePath, agg)
}

func (s *JSONStore) DeleteAggregator(id string) error {
	files, err := s.readFromDirectory("aggregators", "")
	if err != nil {
		return err
	}

	for _, file := range files {
		var agg models.Aggregator
		if err := s.readJSONFile(file, &agg); err != nil {
			continue
		}
		if agg.ID == id {
			return s.deleteFile(file)
		}
	}
	return fmt.Errorf("aggregator not found: %s", id)
}

// ==================== WASH EVENTS ====================

func (s *JSONStore) GetAllWashEvents() ([]models.WashEvent, error) {
	files, err := s.readFromDirectory("wash-events", "we_")
	if err != nil {
		return nil, err
	}

	var events []models.WashEvent
	for _, file := range files {
		var event models.WashEvent
		if err := s.readJSONFile(file, &event); err != nil {
			continue
		}
		events = append(events, event)
	}

	// Sort by timestamp descending
	sort.Slice(events, func(i, j int) bool {
		return events[i].Timestamp > events[j].Timestamp
	})

	return events, nil
}

func (s *JSONStore) GetWashEventByID(id string) (*models.WashEvent, error) {
	files, err := s.readFromDirectory("wash-events", "")
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		var event models.WashEvent
		if err := s.readJSONFile(file, &event); err != nil {
			continue
		}
		if event.ID == id {
			return &event, nil
		}
	}
	return nil, fmt.Errorf("wash event not found: %s", id)
}

func (s *JSONStore) SaveWashEvent(event *models.WashEvent) error {
	filename := fmt.Sprintf("%s.json", event.ID)
	filePath := filepath.Join(s.dataPath, "wash-events", filename)
	return s.writeJSONFile(filePath, event)
}

func (s *JSONStore) DeleteWashEvent(id string) error {
	files, err := s.readFromDirectory("wash-events", "")
	if err != nil {
		return err
	}

	for _, file := range files {
		var event models.WashEvent
		if err := s.readJSONFile(file, &event); err != nil {
			continue
		}
		if event.ID == id {
			return s.deleteFile(file)
		}
	}
	return fmt.Errorf("wash event not found: %s", id)
}

// ==================== EXPENSES ====================

func (s *JSONStore) GetAllExpenses() ([]models.Expense, error) {
	files, err := s.readFromDirectory("expenses", "exp_")
	if err != nil {
		return nil, err
	}

	var expenses []models.Expense
	for _, file := range files {
		var exp models.Expense
		if err := s.readJSONFile(file, &exp); err != nil {
			continue
		}
		expenses = append(expenses, exp)
	}

	// Sort by date descending
	sort.Slice(expenses, func(i, j int) bool {
		return expenses[i].Date > expenses[j].Date
	})

	return expenses, nil
}

func (s *JSONStore) GetExpenseByID(id string) (*models.Expense, error) {
	files, err := s.readFromDirectory("expenses", "")
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		var exp models.Expense
		if err := s.readJSONFile(file, &exp); err != nil {
			continue
		}
		if exp.ID == id {
			return &exp, nil
		}
	}
	return nil, fmt.Errorf("expense not found: %s", id)
}

func (s *JSONStore) SaveExpense(exp *models.Expense) error {
	filename := fmt.Sprintf("%s.json", exp.ID)
	filePath := filepath.Join(s.dataPath, "expenses", filename)
	return s.writeJSONFile(filePath, exp)
}

func (s *JSONStore) DeleteExpense(id string) error {
	files, err := s.readFromDirectory("expenses", "")
	if err != nil {
		return err
	}

	for _, file := range files {
		var exp models.Expense
		if err := s.readJSONFile(file, &exp); err != nil {
			continue
		}
		if exp.ID == id {
			return s.deleteFile(file)
		}
	}
	return fmt.Errorf("expense not found: %s", id)
}

// ==================== SALARY SCHEMES ====================

func (s *JSONStore) GetAllSalarySchemes() ([]models.SalaryScheme, error) {
	files, err := s.readFromDirectory("salary-schemes", "scheme_")
	if err != nil {
		return nil, err
	}

	var schemes []models.SalaryScheme
	for _, file := range files {
		var scheme models.SalaryScheme
		if err := s.readJSONFile(file, &scheme); err != nil {
			continue
		}
		schemes = append(schemes, scheme)
	}
	return schemes, nil
}

func (s *JSONStore) GetSalarySchemeByID(id string) (*models.SalaryScheme, error) {
	files, err := s.readFromDirectory("salary-schemes", "")
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		var scheme models.SalaryScheme
		if err := s.readJSONFile(file, &scheme); err != nil {
			continue
		}
		if scheme.ID == id {
			return &scheme, nil
		}
	}
	return nil, fmt.Errorf("salary scheme not found: %s", id)
}

func (s *JSONStore) SaveSalaryScheme(scheme *models.SalaryScheme) error {
	filename := fmt.Sprintf("%s.json", scheme.ID)
	filePath := filepath.Join(s.dataPath, "salary-schemes", filename)
	return s.writeJSONFile(filePath, scheme)
}

func (s *JSONStore) DeleteSalaryScheme(id string) error {
	files, err := s.readFromDirectory("salary-schemes", "")
	if err != nil {
		return err
	}

	for _, file := range files {
		var scheme models.SalaryScheme
		if err := s.readJSONFile(file, &scheme); err != nil {
			continue
		}
		if scheme.ID == id {
			return s.deleteFile(file)
		}
	}
	return fmt.Errorf("salary scheme not found: %s", id)
}

// ==================== EMPLOYEE TRANSACTIONS ====================

func (s *JSONStore) GetEmployeeTransactions(employeeID string) ([]models.EmployeeTransaction, error) {
	filePath := filepath.Join(s.dataPath, "employee-transactions", fmt.Sprintf("%s.json", employeeID))

	var file models.EmployeeTransactionsFile
	if err := s.readJSONFile(filePath, &file); err != nil {
		if os.IsNotExist(err) {
			return []models.EmployeeTransaction{}, nil
		}
		return nil, err
	}
	return file.Transactions, nil
}

func (s *JSONStore) SaveEmployeeTransactions(employeeID string, transactions []models.EmployeeTransaction) error {
	filePath := filepath.Join(s.dataPath, "employee-transactions", fmt.Sprintf("%s.json", employeeID))
	file := models.EmployeeTransactionsFile{Transactions: transactions}
	return s.writeJSONFile(filePath, file)
}

// ==================== CLIENT TRANSACTIONS ====================

func (s *JSONStore) GetClientTransactions(clientID string) ([]models.ClientTransaction, error) {
	filePath := filepath.Join(s.dataPath, "client-transactions", fmt.Sprintf("%s.json", clientID))

	var file models.ClientTransactionsFile
	if err := s.readJSONFile(filePath, &file); err != nil {
		if os.IsNotExist(err) {
			return []models.ClientTransaction{}, nil
		}
		return nil, err
	}
	return file.Transactions, nil
}

func (s *JSONStore) SaveClientTransactions(clientID string, transactions []models.ClientTransaction) error {
	filePath := filepath.Join(s.dataPath, "client-transactions", fmt.Sprintf("%s.json", clientID))
	file := models.ClientTransactionsFile{Transactions: transactions}
	return s.writeJSONFile(filePath, file)
}

// ==================== RETAIL PRICE CONFIG ====================

func (s *JSONStore) GetRetailPriceConfig() (*models.RetailPriceConfig, error) {
	filePath := filepath.Join(s.dataPath, "retail-price-list.json")

	var config models.RetailPriceConfig
	if err := s.readJSONFile(filePath, &config); err != nil {
		if os.IsNotExist(err) {
			return &models.RetailPriceConfig{
				MainPriceList:       []models.PriceListItem{},
				AdditionalPriceList: []models.PriceListItem{},
			}, nil
		}
		return nil, err
	}
	return &config, nil
}

func (s *JSONStore) SaveRetailPriceConfig(config *models.RetailPriceConfig) error {
	filePath := filepath.Join(s.dataPath, "retail-price-list.json")
	return s.writeJSONFile(filePath, config)
}

// ==================== INVENTORY ====================

func (s *JSONStore) GetInventory() (*models.Inventory, error) {
	filePath := filepath.Join(s.dataPath, "inventory.json")

	var inv models.Inventory
	if err := s.readJSONFile(filePath, &inv); err != nil {
		if os.IsNotExist(err) {
			return &models.Inventory{ChemicalStockGrams: 0}, nil
		}
		return nil, err
	}
	return &inv, nil
}

func (s *JSONStore) SaveInventory(inv *models.Inventory) error {
	filePath := filepath.Join(s.dataPath, "inventory.json")
	return s.writeJSONFile(filePath, inv)
}
