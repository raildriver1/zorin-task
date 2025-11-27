package handlers

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type EmployeeHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewEmployeeHandler(store *storage.JSONStore, cache *storage.Cache) *EmployeeHandler {
	return &EmployeeHandler{
		store: store,
		cache: cache,
	}
}

// GetAll handles GET /api/employees
func (h *EmployeeHandler) GetAll(c *fiber.Ctx) error {
	employees, err := h.getEmployees()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get employees",
		})
	}

	// Return employees without passwords
	result := make([]models.EmployeeWithoutPassword, len(employees))
	for i, emp := range employees {
		result[i] = models.EmployeeWithoutPassword{
			ID:             emp.ID,
			FullName:       emp.FullName,
			Phone:          emp.Phone,
			PaymentDetails: emp.PaymentDetails,
			HasCar:         emp.HasCar,
			Username:       emp.Username,
			SalarySchemeID: emp.SalarySchemeID,
		}
	}

	return c.JSON(result)
}

// Create handles POST /api/employees
func (h *EmployeeHandler) Create(c *fiber.Ctx) error {
	var emp models.Employee
	if err := c.BodyParser(&emp); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate ID if not provided
	if emp.ID == "" {
		emp.ID = fmt.Sprintf("emp_%d_%s", time.Now().UnixMilli(), generateRandomString(7))
	}

	if err := h.store.SaveEmployee(&emp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save employee",
		})
	}

	h.cache.InvalidateEmployees()

	// Return without password
	return c.Status(fiber.StatusCreated).JSON(models.EmployeeWithoutPassword{
		ID:             emp.ID,
		FullName:       emp.FullName,
		Phone:          emp.Phone,
		PaymentDetails: emp.PaymentDetails,
		HasCar:         emp.HasCar,
		Username:       emp.Username,
		SalarySchemeID: emp.SalarySchemeID,
	})
}

// GetByID handles GET /api/employees/:id
func (h *EmployeeHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	emp, err := h.store.GetEmployeeByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Employee not found",
		})
	}

	return c.JSON(models.EmployeeWithoutPassword{
		ID:             emp.ID,
		FullName:       emp.FullName,
		Phone:          emp.Phone,
		PaymentDetails: emp.PaymentDetails,
		HasCar:         emp.HasCar,
		Username:       emp.Username,
		SalarySchemeID: emp.SalarySchemeID,
	})
}

// Update handles PUT /api/employees/:id
func (h *EmployeeHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	// Get existing employee
	existing, err := h.store.GetEmployeeByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Employee not found",
		})
	}

	var updates models.Employee
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Update fields
	existing.FullName = updates.FullName
	existing.Phone = updates.Phone
	existing.PaymentDetails = updates.PaymentDetails
	existing.HasCar = updates.HasCar
	existing.SalarySchemeID = updates.SalarySchemeID

	if updates.Username != "" {
		existing.Username = updates.Username
	}
	if updates.Password != "" {
		existing.Password = updates.Password
	}

	if err := h.store.SaveEmployee(existing); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update employee",
		})
	}

	h.cache.InvalidateEmployees()

	return c.JSON(models.EmployeeWithoutPassword{
		ID:             existing.ID,
		FullName:       existing.FullName,
		Phone:          existing.Phone,
		PaymentDetails: existing.PaymentDetails,
		HasCar:         existing.HasCar,
		Username:       existing.Username,
		SalarySchemeID: existing.SalarySchemeID,
	})
}

// Delete handles DELETE /api/employees/:id
func (h *EmployeeHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.store.DeleteEmployee(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Employee not found",
		})
	}

	h.cache.InvalidateEmployees()

	return c.JSON(fiber.Map{
		"message": "Employee deleted successfully",
	})
}

// AddTransaction handles POST /api/employees/:id/transactions
func (h *EmployeeHandler) AddTransaction(c *fiber.Ctx) error {
	employeeID := c.Params("id")

	var trans models.EmployeeTransaction
	if err := c.BodyParser(&trans); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate ID if not provided
	if trans.ID == "" {
		trans.ID = fmt.Sprintf("trans_%d_%s", time.Now().UnixMilli(), generateRandomString(7))
	}
	trans.EmployeeID = employeeID

	// Get existing transactions
	transactions, err := h.store.GetEmployeeTransactions(employeeID)
	if err != nil {
		transactions = []models.EmployeeTransaction{}
	}

	// Add new transaction
	transactions = append(transactions, trans)

	if err := h.store.SaveEmployeeTransactions(employeeID, transactions); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save transaction",
		})
	}

	h.cache.InvalidateEmployeeTransactions(employeeID)

	return c.Status(fiber.StatusCreated).JSON(trans)
}

// DeleteTransaction handles DELETE /api/employees/:id/transactions?transactionId=xxx
func (h *EmployeeHandler) DeleteTransaction(c *fiber.Ctx) error {
	employeeID := c.Params("id")
	transactionID := c.Query("transactionId")

	if transactionID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "transactionId query parameter is required",
		})
	}

	// Get existing transactions
	transactions, err := h.store.GetEmployeeTransactions(employeeID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No transactions found",
		})
	}

	// Find and remove transaction
	var found bool
	var newTransactions []models.EmployeeTransaction
	for _, t := range transactions {
		if t.ID == transactionID {
			found = true
		} else {
			newTransactions = append(newTransactions, t)
		}
	}

	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Transaction not found",
		})
	}

	if err := h.store.SaveEmployeeTransactions(employeeID, newTransactions); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete transaction",
		})
	}

	h.cache.InvalidateEmployeeTransactions(employeeID)

	return c.JSON(fiber.Map{
		"message": "Transaction deleted successfully",
	})
}

func (h *EmployeeHandler) getEmployees() ([]models.Employee, error) {
	if cached, ok := h.cache.GetEmployees(); ok {
		return cached, nil
	}

	employees, err := h.store.GetAllEmployees()
	if err != nil {
		return nil, err
	}

	h.cache.SetEmployees(employees)
	return employees, nil
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
