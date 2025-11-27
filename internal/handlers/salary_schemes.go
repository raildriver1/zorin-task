package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type SalarySchemeHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewSalarySchemeHandler(store *storage.JSONStore, cache *storage.Cache) *SalarySchemeHandler {
	return &SalarySchemeHandler{
		store: store,
		cache: cache,
	}
}

// GetAll handles GET /api/salary-schemes
func (h *SalarySchemeHandler) GetAll(c *fiber.Ctx) error {
	schemes, err := h.getSalarySchemes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get salary schemes",
		})
	}

	return c.JSON(schemes)
}

// Create handles POST /api/salary-schemes
func (h *SalarySchemeHandler) Create(c *fiber.Ctx) error {
	var scheme models.SalaryScheme
	if err := c.BodyParser(&scheme); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate ID if not provided
	if scheme.ID == "" {
		scheme.ID = fmt.Sprintf("scheme_%d", time.Now().UnixMilli())
	}

	// Initialize rates if nil
	if scheme.Rates == nil {
		scheme.Rates = []models.SalaryRate{}
	}

	if err := h.store.SaveSalaryScheme(&scheme); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save salary scheme",
		})
	}

	h.cache.InvalidateSalarySchemes()

	return c.Status(fiber.StatusCreated).JSON(scheme)
}

// GetByID handles GET /api/salary-schemes/:id
func (h *SalarySchemeHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	scheme, err := h.store.GetSalarySchemeByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Salary scheme not found",
		})
	}

	return c.JSON(scheme)
}

// Update handles PUT /api/salary-schemes/:id
func (h *SalarySchemeHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	// Get existing scheme
	_, err := h.store.GetSalarySchemeByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Salary scheme not found",
		})
	}

	var updates models.SalaryScheme
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Ensure ID is preserved
	updates.ID = id

	if err := h.store.SaveSalaryScheme(&updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update salary scheme",
		})
	}

	h.cache.InvalidateSalarySchemes()

	return c.JSON(updates)
}

// Delete handles DELETE /api/salary-schemes/:id
func (h *SalarySchemeHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.store.DeleteSalaryScheme(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Salary scheme not found",
		})
	}

	h.cache.InvalidateSalarySchemes()

	return c.JSON(fiber.Map{
		"message": "Salary scheme deleted successfully",
	})
}

func (h *SalarySchemeHandler) getSalarySchemes() ([]models.SalaryScheme, error) {
	if cached, ok := h.cache.GetSalarySchemes(); ok {
		return cached, nil
	}

	schemes, err := h.store.GetAllSalarySchemes()
	if err != nil {
		return nil, err
	}

	h.cache.SetSalarySchemes(schemes)
	return schemes, nil
}
