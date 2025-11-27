package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type WashEventHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewWashEventHandler(store *storage.JSONStore, cache *storage.Cache) *WashEventHandler {
	return &WashEventHandler{
		store: store,
		cache: cache,
	}
}

// GetAll handles GET /api/wash-events
func (h *WashEventHandler) GetAll(c *fiber.Ctx) error {
	events, err := h.getWashEvents()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get wash events",
		})
	}

	return c.JSON(events)
}

// Create handles POST /api/wash-events
func (h *WashEventHandler) Create(c *fiber.Ctx) error {
	var event models.WashEvent
	if err := c.BodyParser(&event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate ID if not provided
	if event.ID == "" {
		event.ID = fmt.Sprintf("we_%d_%s", time.Now().UnixMilli(), generateRandomString(7))
	}

	// Initialize slices if nil
	if event.EmployeeIDs == nil {
		event.EmployeeIDs = []string{}
	}
	if event.Services.Additional == nil {
		event.Services.Additional = []models.PriceListItem{}
	}

	// Calculate total chemical consumption
	totalConsumption := calculateChemicalConsumption(&event)

	// Save wash event
	if err := h.store.SaveWashEvent(&event); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save wash event",
		})
	}

	// Update inventory
	if totalConsumption > 0 {
		inv, err := h.store.GetInventory()
		if err != nil {
			inv = &models.Inventory{ChemicalStockGrams: 0}
		}
		inv.ChemicalStockGrams -= totalConsumption
		if inv.ChemicalStockGrams < 0 {
			inv.ChemicalStockGrams = 0
		}
		h.store.SaveInventory(inv)
		h.cache.InvalidateInventory()
	}

	h.cache.InvalidateWashEvents()

	return c.Status(fiber.StatusCreated).JSON(event)
}

// GetByID handles GET /api/wash-events/:id
func (h *WashEventHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	event, err := h.store.GetWashEventByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Wash event not found",
		})
	}

	return c.JSON(event)
}

// Update handles PUT /api/wash-events/:id
func (h *WashEventHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	// Get existing event
	existing, err := h.store.GetWashEventByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Wash event not found",
		})
	}

	var updates models.WashEvent
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Calculate old and new chemical consumption
	oldConsumption := calculateChemicalConsumption(existing)
	newConsumption := calculateChemicalConsumption(&updates)

	// Ensure ID is preserved
	updates.ID = id

	// Save updated event
	if err := h.store.SaveWashEvent(&updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update wash event",
		})
	}

	// Update inventory if consumption changed
	if oldConsumption != newConsumption {
		inv, err := h.store.GetInventory()
		if err != nil {
			inv = &models.Inventory{ChemicalStockGrams: 0}
		}
		// Return old consumption, subtract new consumption
		inv.ChemicalStockGrams = inv.ChemicalStockGrams + oldConsumption - newConsumption
		if inv.ChemicalStockGrams < 0 {
			inv.ChemicalStockGrams = 0
		}
		h.store.SaveInventory(inv)
		h.cache.InvalidateInventory()
	}

	h.cache.InvalidateWashEvents()

	return c.JSON(updates)
}

// Delete handles DELETE /api/wash-events/:id
func (h *WashEventHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	// Get existing event to calculate chemical consumption
	existing, err := h.store.GetWashEventByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Wash event not found",
		})
	}

	// Calculate consumption to return to inventory
	consumption := calculateChemicalConsumption(existing)

	// Delete event
	if err := h.store.DeleteWashEvent(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete wash event",
		})
	}

	// Return chemical to inventory
	if consumption > 0 {
		inv, err := h.store.GetInventory()
		if err != nil {
			inv = &models.Inventory{ChemicalStockGrams: 0}
		}
		inv.ChemicalStockGrams += consumption
		h.store.SaveInventory(inv)
		h.cache.InvalidateInventory()
	}

	h.cache.InvalidateWashEvents()

	return c.JSON(fiber.Map{
		"message": "Wash event deleted successfully",
	})
}

func (h *WashEventHandler) getWashEvents() ([]models.WashEvent, error) {
	if cached, ok := h.cache.GetWashEvents(); ok {
		return cached, nil
	}

	events, err := h.store.GetAllWashEvents()
	if err != nil {
		return nil, err
	}

	h.cache.SetWashEvents(events)
	return events, nil
}

// calculateChemicalConsumption calculates total chemical consumption for a wash event
func calculateChemicalConsumption(event *models.WashEvent) float64 {
	total := float64(0)

	// Main service consumption
	if event.Services.Main.ChemicalConsumption > 0 {
		total += event.Services.Main.ChemicalConsumption
	}

	// Employee-specific consumption for main service
	for _, ec := range event.Services.Main.EmployeeConsumptions {
		total += ec.Amount
	}

	// Additional services consumption
	for _, service := range event.Services.Additional {
		if service.ChemicalConsumption > 0 {
			total += service.ChemicalConsumption
		}
		for _, ec := range service.EmployeeConsumptions {
			total += ec.Amount
		}
	}

	return total
}
