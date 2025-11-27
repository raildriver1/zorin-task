package handlers

import (
	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type PriceListHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewPriceListHandler(store *storage.JSONStore, cache *storage.Cache) *PriceListHandler {
	return &PriceListHandler{
		store: store,
		cache: cache,
	}
}

// Get handles GET /api/retail-price-list
func (h *PriceListHandler) Get(c *fiber.Ctx) error {
	config, err := h.getRetailPriceConfig()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get retail price list",
		})
	}

	return c.JSON(config)
}

// Update handles POST /api/retail-price-list
func (h *PriceListHandler) Update(c *fiber.Ctx) error {
	var config models.RetailPriceConfig
	if err := c.BodyParser(&config); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Initialize slices if nil
	if config.MainPriceList == nil {
		config.MainPriceList = []models.PriceListItem{}
	}
	if config.AdditionalPriceList == nil {
		config.AdditionalPriceList = []models.PriceListItem{}
	}

	if err := h.store.SaveRetailPriceConfig(&config); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save retail price list",
		})
	}

	h.cache.InvalidateRetailPriceConfig()

	return c.JSON(config)
}

func (h *PriceListHandler) getRetailPriceConfig() (*models.RetailPriceConfig, error) {
	if cached, ok := h.cache.GetRetailPriceConfig(); ok {
		return cached, nil
	}

	config, err := h.store.GetRetailPriceConfig()
	if err != nil {
		return nil, err
	}

	h.cache.SetRetailPriceConfig(config)
	return config, nil
}

// InventoryHandler handles inventory operations
type InventoryHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewInventoryHandler(store *storage.JSONStore, cache *storage.Cache) *InventoryHandler {
	return &InventoryHandler{
		store: store,
		cache: cache,
	}
}

// Get handles GET /api/inventory
func (h *InventoryHandler) Get(c *fiber.Ctx) error {
	inv, err := h.getInventory()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get inventory",
		})
	}

	return c.JSON(inv)
}

func (h *InventoryHandler) getInventory() (*models.Inventory, error) {
	if cached, ok := h.cache.GetInventory(); ok {
		return cached, nil
	}

	inv, err := h.store.GetInventory()
	if err != nil {
		return nil, err
	}

	h.cache.SetInventory(inv)
	return inv, nil
}
