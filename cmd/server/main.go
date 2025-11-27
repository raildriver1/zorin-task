package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	"backend-go/internal/config"
	"backend-go/internal/handlers"
	"backend-go/internal/storage"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Get the absolute path to data directory
	execPath, err := os.Getwd()
	if err != nil {
		log.Fatal("Failed to get working directory:", err)
	}

	// If running from backend-go directory, go up one level to find data
	dataPath := cfg.DataPath
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		dataPath = filepath.Join(execPath, "..", "data")
	}
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		dataPath = filepath.Join(execPath, "data")
	}

	log.Printf("Using data path: %s", dataPath)

	// Initialize storage
	store := storage.NewJSONStore(dataPath)
	cache := storage.NewCache()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(store, cache)
	employeeHandler := handlers.NewEmployeeHandler(store, cache)
	counterAgentHandler := handlers.NewCounterAgentHandler(store, cache)
	aggregatorHandler := handlers.NewAggregatorHandler(store, cache)
	expenseHandler := handlers.NewExpenseHandler(store, cache)
	washEventHandler := handlers.NewWashEventHandler(store, cache)
	salarySchemeHandler := handlers.NewSalarySchemeHandler(store, cache)
	transactionHandler := handlers.NewTransactionHandler(store, cache)
	priceListHandler := handlers.NewPriceListHandler(store, cache)
	inventoryHandler := handlers.NewInventoryHandler(store, cache)
	salaryReportHandler := handlers.NewSalaryReportHandler(store, cache)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://localhost:9002,http://127.0.0.1:3000,http://127.0.0.1:9002",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// API routes
	api := app.Group("/api")

	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", authHandler.Me)

	// Employees routes
	employees := api.Group("/employees")
	employees.Get("/", employeeHandler.GetAll)
	employees.Post("/", employeeHandler.Create)
	employees.Get("/:id", employeeHandler.GetByID)
	employees.Put("/:id", employeeHandler.Update)
	employees.Delete("/:id", employeeHandler.Delete)
	employees.Post("/:id/transactions", employeeHandler.AddTransaction)
	employees.Delete("/:id/transactions", employeeHandler.DeleteTransaction)

	// Counter Agents routes
	counterAgents := api.Group("/counter-agents")
	counterAgents.Get("/", counterAgentHandler.GetAll)
	counterAgents.Post("/", counterAgentHandler.Create)
	counterAgents.Get("/:id", counterAgentHandler.GetByID)
	counterAgents.Put("/:id", counterAgentHandler.Update)
	counterAgents.Delete("/:id", counterAgentHandler.Delete)

	// Aggregators routes
	aggregators := api.Group("/aggregators")
	aggregators.Get("/", aggregatorHandler.GetAll)
	aggregators.Post("/", aggregatorHandler.Create)
	aggregators.Get("/:id", aggregatorHandler.GetByID)
	aggregators.Put("/:id", aggregatorHandler.Update)
	aggregators.Delete("/:id", aggregatorHandler.Delete)

	// Expenses routes
	expenses := api.Group("/expenses")
	expenses.Get("/", expenseHandler.GetAll)
	expenses.Post("/", expenseHandler.Create)
	expenses.Get("/:id", expenseHandler.GetByID)
	expenses.Put("/:id", expenseHandler.Update)
	expenses.Delete("/:id", expenseHandler.Delete)

	// Wash Events routes
	washEvents := api.Group("/wash-events")
	washEvents.Get("/", washEventHandler.GetAll)
	washEvents.Post("/", washEventHandler.Create)
	washEvents.Get("/:id", washEventHandler.GetByID)
	washEvents.Put("/:id", washEventHandler.Update)
	washEvents.Delete("/:id", washEventHandler.Delete)

	// Salary Schemes routes
	salarySchemes := api.Group("/salary-schemes")
	salarySchemes.Get("/", salarySchemeHandler.GetAll)
	salarySchemes.Post("/", salarySchemeHandler.Create)
	salarySchemes.Get("/:id", salarySchemeHandler.GetByID)
	salarySchemes.Put("/:id", salarySchemeHandler.Update)
	salarySchemes.Delete("/:id", salarySchemeHandler.Delete)

	// Client Transactions routes
	clientTransactions := api.Group("/client-transactions")
	clientTransactions.Post("/:clientId", transactionHandler.AddClientTransaction)
	clientTransactions.Delete("/:clientId", transactionHandler.DeleteClientTransaction)

	// Retail Price List routes
	api.Get("/retail-price-list", priceListHandler.Get)
	api.Post("/retail-price-list", priceListHandler.Update)

	// Inventory route (bonus - useful for frontend)
	api.Get("/inventory", inventoryHandler.Get)

	// Salary Report route
	api.Get("/salary-report", salaryReportHandler.GenerateReport)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"data_path": dataPath,
		})
	})

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Starting server on %s", addr)
	log.Fatal(app.Listen(addr))
}
