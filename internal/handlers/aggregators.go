package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type AggregatorHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewAggregatorHandler(store *storage.JSONStore, cache *storage.Cache) *AggregatorHandler {
	return &AggregatorHandler{
		store: store,
		cache: cache,
	}
}

// GetAll handles GET /api/aggregators
func (h *AggregatorHandler) GetAll(c *fiber.Ctx) error {
	aggregators, err := h.getAggregators()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get aggregators",
		})
	}

	return c.JSON(aggregators)
}

// GetByID handles GET /api/aggregators/:id
func (h *AggregatorHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	agg, err := h.store.GetAggregatorByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Aggregator not found",
		})
	}

	return c.JSON(agg)
}

// Create handles POST /api/aggregators
func (h *AggregatorHandler) Create(c *fiber.Ctx) error {
	var agg models.Aggregator
	if err := c.BodyParser(&agg); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate ID if not provided
	if agg.ID == "" {
		agg.ID = fmt.Sprintf("agg_%d_%s", time.Now().UnixMilli(), generateRandomString(7))
	}

	// Initialize empty slices if nil
	if agg.Cars == nil {
		agg.Cars = []models.Car{}
	}
	if agg.PriceLists == nil {
		agg.PriceLists = []models.NamedPriceList{}
	}

	if err := h.store.SaveAggregator(&agg); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save aggregator",
		})
	}

	h.cache.InvalidateAggregators()

	return c.Status(fiber.StatusCreated).JSON(agg)
}

// Update handles PUT /api/aggregators/:id
func (h *AggregatorHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	// Get existing aggregator
	_, err := h.store.GetAggregatorByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Aggregator not found",
		})
	}

	var updates models.Aggregator
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Ensure ID is preserved
	updates.ID = id

	if err := h.store.SaveAggregator(&updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update aggregator",
		})
	}

	h.cache.InvalidateAggregators()

	return c.JSON(updates)
}

// Delete handles DELETE /api/aggregators/:id
func (h *AggregatorHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.store.DeleteAggregator(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Aggregator not found",
		})
	}

	h.cache.InvalidateAggregators()

	return c.JSON(fiber.Map{
		"message": "Aggregator deleted successfully",
	})
}

func (h *AggregatorHandler) getAggregators() ([]models.Aggregator, error) {
	if cached, ok := h.cache.GetAggregators(); ok {
		return cached, nil
	}

	aggregators, err := h.store.GetAllAggregators()
	if err != nil {
		return nil, err
	}

	h.cache.SetAggregators(aggregators)
	return aggregators, nil
}
