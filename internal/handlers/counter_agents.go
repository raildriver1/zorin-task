package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type CounterAgentHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewCounterAgentHandler(store *storage.JSONStore, cache *storage.Cache) *CounterAgentHandler {
	return &CounterAgentHandler{
		store: store,
		cache: cache,
	}
}

// GetAll handles GET /api/counter-agents
func (h *CounterAgentHandler) GetAll(c *fiber.Ctx) error {
	agents, err := h.getCounterAgents()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get counter agents",
		})
	}

	return c.JSON(agents)
}

// GetByID handles GET /api/counter-agents/:id
func (h *CounterAgentHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	agent, err := h.store.GetCounterAgentByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Counter agent not found",
		})
	}

	return c.JSON(agent)
}

// Create handles POST /api/counter-agents
func (h *CounterAgentHandler) Create(c *fiber.Ctx) error {
	var agent models.CounterAgent
	if err := c.BodyParser(&agent); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate ID if not provided
	if agent.ID == "" {
		agent.ID = fmt.Sprintf("agent_%d_%s", time.Now().UnixMilli(), generateRandomString(7))
	}

	// Initialize empty slices if nil
	if agent.Companies == nil {
		agent.Companies = []models.CounterAgentCompany{}
	}
	if agent.Cars == nil {
		agent.Cars = []models.Car{}
	}
	if agent.PriceList == nil {
		agent.PriceList = []models.PriceListItem{}
	}

	if err := h.store.SaveCounterAgent(&agent); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save counter agent",
		})
	}

	h.cache.InvalidateCounterAgents()

	return c.Status(fiber.StatusCreated).JSON(agent)
}

// Update handles PUT /api/counter-agents/:id
func (h *CounterAgentHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	// Get existing agent
	_, err := h.store.GetCounterAgentByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Counter agent not found",
		})
	}

	var updates models.CounterAgent
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Ensure ID is preserved
	updates.ID = id

	if err := h.store.SaveCounterAgent(&updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update counter agent",
		})
	}

	h.cache.InvalidateCounterAgents()

	return c.JSON(updates)
}

// Delete handles DELETE /api/counter-agents/:id
func (h *CounterAgentHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.store.DeleteCounterAgent(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Counter agent not found",
		})
	}

	h.cache.InvalidateCounterAgents()

	return c.JSON(fiber.Map{
		"message": "Counter agent deleted successfully",
	})
}

func (h *CounterAgentHandler) getCounterAgents() ([]models.CounterAgent, error) {
	if cached, ok := h.cache.GetCounterAgents(); ok {
		return cached, nil
	}

	agents, err := h.store.GetAllCounterAgents()
	if err != nil {
		return nil, err
	}

	h.cache.SetCounterAgents(agents)
	return agents, nil
}
