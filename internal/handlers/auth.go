package handlers

import (
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type AuthHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewAuthHandler(store *storage.JSONStore, cache *storage.Cache) *AuthHandler {
	return &AuthHandler{
		store: store,
		cache: cache,
	}
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username and password are required",
		})
	}

	// Get all employees
	employees, err := h.getEmployees()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get employees",
		})
	}

	// Find employee by username and password
	var foundEmployee *models.Employee
	for _, emp := range employees {
		if emp.Username == req.Username && emp.Password == req.Password {
			foundEmployee = &emp
			break
		}
	}

	if foundEmployee == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	// Create employee without password for cookie
	empWithoutPassword := models.EmployeeWithoutPassword{
		ID:             foundEmployee.ID,
		FullName:       foundEmployee.FullName,
		Phone:          foundEmployee.Phone,
		PaymentDetails: foundEmployee.PaymentDetails,
		HasCar:         foundEmployee.HasCar,
		Username:       foundEmployee.Username,
		SalarySchemeID: foundEmployee.SalarySchemeID,
	}

	// Serialize to JSON for cookie
	cookieData, err := json.Marshal(empWithoutPassword)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create session",
		})
	}

	// Set cookie
	c.Cookie(&fiber.Cookie{
		Name:     "employee_auth_sim",
		Value:    string(cookieData),
		Path:     "/",
		MaxAge:   60 * 60 * 24 * 7, // 7 days
		Secure:   false,
		HTTPOnly: true,
		SameSite: "Lax",
	})

	return c.JSON(empWithoutPassword)
}

// Logout handles POST /api/auth/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Clear cookie by setting it to expire
	c.Cookie(&fiber.Cookie{
		Name:    "employee_auth_sim",
		Value:   "",
		Path:    "/",
		Expires: time.Now().Add(-time.Hour),
	})

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

// Me handles GET /api/auth/me
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	cookieValue := c.Cookies("employee_auth_sim")
	if cookieValue == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Not authenticated",
		})
	}

	var employee models.EmployeeWithoutPassword
	if err := json.Unmarshal([]byte(cookieValue), &employee); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid session",
		})
	}

	return c.JSON(employee)
}

func (h *AuthHandler) getEmployees() ([]models.Employee, error) {
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
