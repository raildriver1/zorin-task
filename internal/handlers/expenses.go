package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"backend-go/internal/models"
	"backend-go/internal/storage"
)

type ExpenseHandler struct {
	store *storage.JSONStore
	cache *storage.Cache
}

func NewExpenseHandler(store *storage.JSONStore, cache *storage.Cache) *ExpenseHandler {
	return &ExpenseHandler{
		store: store,
		cache: cache,
	}
}

// GetAll handles GET /api/expenses
func (h *ExpenseHandler) GetAll(c *fiber.Ctx) error {
	expenses, err := h.getExpenses()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get expenses",
		})
	}

	return c.JSON(expenses)
}

// Create handles POST /api/expenses
func (h *ExpenseHandler) Create(c *fiber.Ctx) error {
	var expense models.Expense
	if err := c.BodyParser(&expense); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Generate ID if not provided
	if expense.ID == "" {
		expense.ID = fmt.Sprintf("exp_%d_%s", time.Now().UnixMilli(), generateRandomString(7))
	}

	// Save expense first
	if err := h.store.SaveExpense(&expense); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save expense",
		})
	}

	// Update inventory if this is a chemical purchase
	if expense.Category == "Закупка химии" && expense.Quantity > 0 && strings.HasPrefix(strings.ToLower(expense.Unit), "кг") {
		inv, err := h.store.GetInventory()
		if err != nil {
			inv = &models.Inventory{ChemicalStockGrams: 0}
		}
		inv.ChemicalStockGrams += expense.Quantity * 1000 // Convert kg to grams
		h.store.SaveInventory(inv)
		h.cache.InvalidateInventory()
	}

	h.cache.InvalidateExpenses()

	return c.Status(fiber.StatusCreated).JSON(expense)
}

// GetByID handles GET /api/expenses/:id
func (h *ExpenseHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	expense, err := h.store.GetExpenseByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Expense not found",
		})
	}

	return c.JSON(expense)
}

// Update handles PUT /api/expenses/:id
func (h *ExpenseHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	// Get existing expense
	existing, err := h.store.GetExpenseByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Expense not found",
		})
	}

	var updates models.Expense
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Calculate inventory difference if chemical purchase
	oldChemicalQty := float64(0)
	newChemicalQty := float64(0)

	if existing.Category == "Закупка химии" && existing.Quantity > 0 && strings.HasPrefix(strings.ToLower(existing.Unit), "кг") {
		oldChemicalQty = existing.Quantity * 1000
	}
	if updates.Category == "Закупка химии" && updates.Quantity > 0 && strings.HasPrefix(strings.ToLower(updates.Unit), "кг") {
		newChemicalQty = updates.Quantity * 1000
	}

	// Ensure ID is preserved
	updates.ID = id

	if err := h.store.SaveExpense(&updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update expense",
		})
	}

	// Update inventory if quantities changed
	if oldChemicalQty != newChemicalQty {
		inv, err := h.store.GetInventory()
		if err != nil {
			inv = &models.Inventory{ChemicalStockGrams: 0}
		}
		inv.ChemicalStockGrams = inv.ChemicalStockGrams - oldChemicalQty + newChemicalQty
		h.store.SaveInventory(inv)
		h.cache.InvalidateInventory()
	}

	h.cache.InvalidateExpenses()

	return c.JSON(updates)
}

// Delete handles DELETE /api/expenses/:id
func (h *ExpenseHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	// Get existing expense to check if it's a chemical purchase
	existing, err := h.store.GetExpenseByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Expense not found",
		})
	}

	// Delete expense
	if err := h.store.DeleteExpense(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete expense",
		})
	}

	// Return chemical to inventory if this was a chemical purchase
	if existing.Category == "Закупка химии" && existing.Quantity > 0 && strings.HasPrefix(strings.ToLower(existing.Unit), "кг") {
		inv, err := h.store.GetInventory()
		if err != nil {
			inv = &models.Inventory{ChemicalStockGrams: 0}
		}
		inv.ChemicalStockGrams -= existing.Quantity * 1000 // Convert kg to grams
		if inv.ChemicalStockGrams < 0 {
			inv.ChemicalStockGrams = 0
		}
		h.store.SaveInventory(inv)
		h.cache.InvalidateInventory()
	}

	h.cache.InvalidateExpenses()

	return c.JSON(fiber.Map{
		"message": "Expense deleted successfully",
	})
}

func (h *ExpenseHandler) getExpenses() ([]models.Expense, error) {
	if cached, ok := h.cache.GetExpenses(); ok {
		return cached, nil
	}

	expenses, err := h.store.GetAllExpenses()
	if err != nil {
		return nil, err
	}

	h.cache.SetExpenses(expenses)
	return expenses, nil
}
