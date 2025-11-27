package handlers

import (
	"github.com/gofiber/fiber/v2"

	"backend-go/internal/services"
	"backend-go/internal/storage"
)

type SalaryReportHandler struct {
	store      *storage.JSONStore
	cache      *storage.Cache
	calculator *services.SalaryCalculator
}

func NewSalaryReportHandler(store *storage.JSONStore, cache *storage.Cache) *SalaryReportHandler {
	return &SalaryReportHandler{
		store:      store,
		cache:      cache,
		calculator: services.NewSalaryCalculator(),
	}
}

// GenerateReport handles GET /api/salary-report
func (h *SalaryReportHandler) GenerateReport(c *fiber.Ctx) error {
	// Get all required data
	washEvents, err := h.store.GetAllWashEvents()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get wash events",
		})
	}

	employees, err := h.store.GetAllEmployees()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get employees",
		})
	}

	salarySchemes, err := h.store.GetAllSalarySchemes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get salary schemes",
		})
	}

	// Generate report
	report := h.calculator.GenerateSalaryReport(washEvents, employees, salarySchemes)

	return c.JSON(report)
}
