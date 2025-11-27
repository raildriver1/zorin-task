package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type TransactionHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewTransactionHandler(store *storage.JSONStore, cache *storage.Cache) *TransactionHandler {
	return &TransactionHandler{
		store: store,
		cache: cache,
	}
}

// AddClientTransaction handles POST /api/client-transactions/:clientId
func (h *TransactionHandler) AddClientTransaction(c *fiber.Ctx) error {
	clientID := c.Params("clientId")

	var trans models.ClientTransaction
	if err := c.BodyParser(&trans); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate ID if not provided
	if trans.ID == "" {
		trans.ID = fmt.Sprintf("ctrans_%d_%s", time.Now().UnixMilli(), generateRandomString(7))
	}
	trans.ClientID = clientID
	trans.Type = "payment" // Always payment for client transactions

	// Get existing transactions
	transactions, err := h.store.GetClientTransactions(clientID)
	if err != nil {
		transactions = []models.ClientTransaction{}
	}

	// Add new transaction
	transactions = append(transactions, trans)

	if err := h.store.SaveClientTransactions(clientID, transactions); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save transaction",
		})
	}

	// Update client balance (aggregator or counter agent)
	h.updateClientBalance(clientID, trans.Amount)

	h.cache.InvalidateClientTransactions(clientID)

	return c.Status(fiber.StatusCreated).JSON(trans)
}

// DeleteClientTransaction handles DELETE /api/client-transactions/:clientId?transactionId=xxx
func (h *TransactionHandler) DeleteClientTransaction(c *fiber.Ctx) error {
	clientID := c.Params("clientId")
	transactionID := c.Query("transactionId")

	if transactionID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "transactionId query parameter is required",
		})
	}

	// Get existing transactions
	transactions, err := h.store.GetClientTransactions(clientID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No transactions found",
		})
	}

	// Find and remove transaction
	var found bool
	var deletedAmount float64
	var newTransactions []models.ClientTransaction
	for _, t := range transactions {
		if t.ID == transactionID {
			found = true
			deletedAmount = t.Amount
		} else {
			newTransactions = append(newTransactions, t)
		}
	}

	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Transaction not found",
		})
	}

	if err := h.store.SaveClientTransactions(clientID, newTransactions); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete transaction",
		})
	}

	// Update client balance (reverse the payment)
	h.updateClientBalance(clientID, -deletedAmount)

	h.cache.InvalidateClientTransactions(clientID)

	return c.JSON(fiber.Map{
		"message": "Transaction deleted successfully",
	})
}

// updateClientBalance updates the balance of an aggregator or counter agent
func (h *TransactionHandler) updateClientBalance(clientID string, amount float64) {
	// Try to update aggregator first
	if strings.HasPrefix(clientID, "agg_") {
		agg, err := h.store.GetAggregatorByID(clientID)
		if err == nil {
			agg.Balance += amount
			h.store.SaveAggregator(agg)
			h.cache.InvalidateAggregators()
			return
		}
	}

	// Try to update counter agent
	if strings.HasPrefix(clientID, "agent_") {
		agent, err := h.store.GetCounterAgentByID(clientID)
		if err == nil {
			agent.Balance += amount
			h.store.SaveCounterAgent(agent)
			h.cache.InvalidateCounterAgents()
			return
		}
	}

	// If not found by prefix, try both
	agg, err := h.store.GetAggregatorByID(clientID)
	if err == nil {
		agg.Balance += amount
		h.store.SaveAggregator(agg)
		h.cache.InvalidateAggregators()
		return
	}

	agent, err := h.store.GetCounterAgentByID(clientID)
	if err == nil {
		agent.Balance += amount
		h.store.SaveCounterAgent(agent)
		h.cache.InvalidateCounterAgents()
	}
}
