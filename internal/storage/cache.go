package storage

import (
	"sync"

	"backend-go/internal/models"
)

type Cache struct {
	mu sync.RWMutex

	employees         []models.Employee
	employeesLoaded   bool

	counterAgents       []models.CounterAgent
	counterAgentsLoaded bool

	aggregators       []models.Aggregator
	aggregatorsLoaded bool

	washEvents       []models.WashEvent
	washEventsLoaded bool

	expenses       []models.Expense
	expensesLoaded bool

	salarySchemes       []models.SalaryScheme
	salarySchemesLoaded bool

	retailPriceConfig       *models.RetailPriceConfig
	retailPriceConfigLoaded bool

	inventory       *models.Inventory
	inventoryLoaded bool

	employeeTransactions     map[string][]models.EmployeeTransaction
	employeeTransactionsLock sync.RWMutex

	clientTransactions     map[string][]models.ClientTransaction
	clientTransactionsLock sync.RWMutex
}

func NewCache() *Cache {
	return &Cache{
		employeeTransactions: make(map[string][]models.EmployeeTransaction),
		clientTransactions:   make(map[string][]models.ClientTransaction),
	}
}

// Employees cache
func (c *Cache) GetEmployees() ([]models.Employee, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.employees, c.employeesLoaded
}

func (c *Cache) SetEmployees(employees []models.Employee) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.employees = employees
	c.employeesLoaded = true
}

func (c *Cache) InvalidateEmployees() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.employeesLoaded = false
	c.employees = nil
}

// Counter Agents cache
func (c *Cache) GetCounterAgents() ([]models.CounterAgent, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.counterAgents, c.counterAgentsLoaded
}

func (c *Cache) SetCounterAgents(agents []models.CounterAgent) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.counterAgents = agents
	c.counterAgentsLoaded = true
}

func (c *Cache) InvalidateCounterAgents() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.counterAgentsLoaded = false
	c.counterAgents = nil
}

// Aggregators cache
func (c *Cache) GetAggregators() ([]models.Aggregator, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.aggregators, c.aggregatorsLoaded
}

func (c *Cache) SetAggregators(aggregators []models.Aggregator) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.aggregators = aggregators
	c.aggregatorsLoaded = true
}

func (c *Cache) InvalidateAggregators() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.aggregatorsLoaded = false
	c.aggregators = nil
}

// Wash Events cache
func (c *Cache) GetWashEvents() ([]models.WashEvent, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.washEvents, c.washEventsLoaded
}

func (c *Cache) SetWashEvents(events []models.WashEvent) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.washEvents = events
	c.washEventsLoaded = true
}

func (c *Cache) InvalidateWashEvents() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.washEventsLoaded = false
	c.washEvents = nil
}

// Expenses cache
func (c *Cache) GetExpenses() ([]models.Expense, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.expenses, c.expensesLoaded
}

func (c *Cache) SetExpenses(expenses []models.Expense) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.expenses = expenses
	c.expensesLoaded = true
}

func (c *Cache) InvalidateExpenses() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.expensesLoaded = false
	c.expenses = nil
}

// Salary Schemes cache
func (c *Cache) GetSalarySchemes() ([]models.SalaryScheme, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.salarySchemes, c.salarySchemesLoaded
}

func (c *Cache) SetSalarySchemes(schemes []models.SalaryScheme) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.salarySchemes = schemes
	c.salarySchemesLoaded = true
}

func (c *Cache) InvalidateSalarySchemes() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.salarySchemesLoaded = false
	c.salarySchemes = nil
}

// Retail Price Config cache
func (c *Cache) GetRetailPriceConfig() (*models.RetailPriceConfig, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.retailPriceConfig, c.retailPriceConfigLoaded
}

func (c *Cache) SetRetailPriceConfig(config *models.RetailPriceConfig) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.retailPriceConfig = config
	c.retailPriceConfigLoaded = true
}

func (c *Cache) InvalidateRetailPriceConfig() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.retailPriceConfigLoaded = false
	c.retailPriceConfig = nil
}

// Inventory cache
func (c *Cache) GetInventory() (*models.Inventory, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.inventory, c.inventoryLoaded
}

func (c *Cache) SetInventory(inv *models.Inventory) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.inventory = inv
	c.inventoryLoaded = true
}

func (c *Cache) InvalidateInventory() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.inventoryLoaded = false
	c.inventory = nil
}

// Employee Transactions cache
func (c *Cache) GetEmployeeTransactions(employeeID string) ([]models.EmployeeTransaction, bool) {
	c.employeeTransactionsLock.RLock()
	defer c.employeeTransactionsLock.RUnlock()
	trans, ok := c.employeeTransactions[employeeID]
	return trans, ok
}

func (c *Cache) SetEmployeeTransactions(employeeID string, transactions []models.EmployeeTransaction) {
	c.employeeTransactionsLock.Lock()
	defer c.employeeTransactionsLock.Unlock()
	c.employeeTransactions[employeeID] = transactions
}

func (c *Cache) InvalidateEmployeeTransactions(employeeID string) {
	c.employeeTransactionsLock.Lock()
	defer c.employeeTransactionsLock.Unlock()
	delete(c.employeeTransactions, employeeID)
}

// Client Transactions cache
func (c *Cache) GetClientTransactions(clientID string) ([]models.ClientTransaction, bool) {
	c.clientTransactionsLock.RLock()
	defer c.clientTransactionsLock.RUnlock()
	trans, ok := c.clientTransactions[clientID]
	return trans, ok
}

func (c *Cache) SetClientTransactions(clientID string, transactions []models.ClientTransaction) {
	c.clientTransactionsLock.Lock()
	defer c.clientTransactionsLock.Unlock()
	c.clientTransactions[clientID] = transactions
}

func (c *Cache) InvalidateClientTransactions(clientID string) {
	c.clientTransactionsLock.Lock()
	defer c.clientTransactionsLock.Unlock()
	delete(c.clientTransactions, clientID)
}
