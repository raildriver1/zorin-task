package models

// Owner represents an owner entity
type Owner struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// Company represents a company entity
type Company struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	OwnerID string `json:"ownerId"`
}

// Car represents a car entity
type Car struct {
	ID           string `json:"id"`
	LicensePlate string `json:"licensePlate"`
}

// CounterAgentCompany represents company details for counter agents
type CounterAgentCompany struct {
	CompanyName             string `json:"companyName"`
	OwnerName               string `json:"ownerName"`
	ManagerSocialContact    string `json:"managerSocialContact,omitempty"`
	AccountantSocialContact string `json:"accountantSocialContact,omitempty"`
	// Fields for invoicing
	CustomerName         string `json:"customerName,omitempty"`
	INN                  string `json:"inn,omitempty"`
	KPP                  string `json:"kpp,omitempty"`
	OGRNNumber           string `json:"ogrnNumber,omitempty"`
	OGRNDate             string `json:"ogrnDate,omitempty"`
	LegalAddress         string `json:"legalAddress,omitempty"`
	BankName             string `json:"bankName,omitempty"`
	SettlementAccount    string `json:"settlementAccount,omitempty"`
	CorrespondentAccount string `json:"correspondentAccount,omitempty"`
	BIK                  string `json:"bik,omitempty"`
	Phone                string `json:"phone,omitempty"`
	Email                string `json:"email,omitempty"`
}

// EmployeeConsumption represents chemical consumption per employee
type EmployeeConsumption struct {
	EmployeeID string  `json:"employeeId"`
	Amount     float64 `json:"amount"` // in grams
}

// PriceListItem represents a service in price list
type PriceListItem struct {
	ServiceName          string                `json:"serviceName"`
	Price                float64               `json:"price"`
	IsCustom             bool                  `json:"isCustom,omitempty"`
	ChemicalConsumption  float64               `json:"chemicalConsumption,omitempty"`
	EmployeeConsumptions []EmployeeConsumption `json:"employeeConsumptions,omitempty"`
	ID                   string                `json:"id,omitempty"`
}

// RetailPriceConfig represents retail price configuration
type RetailPriceConfig struct {
	MainPriceList             []PriceListItem `json:"mainPriceList"`
	AdditionalPriceList       []PriceListItem `json:"additionalPriceList"`
	AllowCustomRetailServices bool            `json:"allowCustomRetailServices,omitempty"`
	CardAcquiringPercentage   float64         `json:"cardAcquiringPercentage,omitempty"`
	DismissedCustomServices   []string        `json:"dismissedCustomServices,omitempty"`
}

// CounterAgent represents a counter agent
type CounterAgent struct {
	ID                  string                `json:"id"`
	Name                string                `json:"name"`
	Balance             float64               `json:"balance,omitempty"`
	Companies           []CounterAgentCompany `json:"companies"`
	Cars                []Car                 `json:"cars"`
	PriceList           []PriceListItem       `json:"priceList,omitempty"`
	AdditionalPriceList []PriceListItem       `json:"additionalPriceList,omitempty"`
	AllowCustomServices bool                  `json:"allowCustomServices,omitempty"`
}

// NamedPriceList represents a named price list for aggregators
type NamedPriceList struct {
	Name     string          `json:"name"`
	Services []PriceListItem `json:"services"`
}

// Aggregator represents an aggregator
type Aggregator struct {
	ID                  string                `json:"id"`
	Name                string                `json:"name"`
	Balance             float64               `json:"balance,omitempty"`
	Companies           []CounterAgentCompany `json:"companies,omitempty"`
	Cars                []Car                 `json:"cars"`
	PriceLists          []NamedPriceList      `json:"priceLists"`
	ActivePriceListName string                `json:"activePriceListName,omitempty"`
}

// PaymentType represents payment types
type PaymentType string

const (
	PaymentCash     PaymentType = "cash"
	PaymentCard     PaymentType = "card"
	PaymentTransfer PaymentType = "transfer"
)

// Transaction represents a general transaction
type Transaction struct {
	ID          string      `json:"id"`
	Date        string      `json:"date"`
	Amount      float64     `json:"amount"`
	PaymentType PaymentType `json:"paymentType"`
	ClientName  string      `json:"clientName"`
	Notes       string      `json:"notes,omitempty"`
}

// Employee represents an employee
type Employee struct {
	ID             string `json:"id"`
	FullName       string `json:"fullName"`
	Phone          string `json:"phone"`
	PaymentDetails string `json:"paymentDetails"`
	HasCar         bool   `json:"hasCar"`
	Username       string `json:"username,omitempty"`
	Password       string `json:"password,omitempty"`
	SalarySchemeID string `json:"salarySchemeId,omitempty"`
}

// EmployeeWithoutPassword is Employee without password field for API responses
type EmployeeWithoutPassword struct {
	ID             string `json:"id"`
	FullName       string `json:"fullName"`
	Phone          string `json:"phone"`
	PaymentDetails string `json:"paymentDetails"`
	HasCar         bool   `json:"hasCar"`
	Username       string `json:"username,omitempty"`
	SalarySchemeID string `json:"salarySchemeId,omitempty"`
}

// SalaryRate represents a rate for a service
type SalaryRate struct {
	ServiceName string  `json:"serviceName"`
	Rate        float64 `json:"rate"`
	Deduction   float64 `json:"deduction,omitempty"`
}

// RateSourceType represents rate source types
type RateSourceType string

const (
	RateSourceRetail       RateSourceType = "retail"
	RateSourceAggregator   RateSourceType = "aggregator"
	RateSourceCounterAgent RateSourceType = "counterAgent"
)

// RateSource represents the source of salary rates
type RateSource struct {
	Type          RateSourceType `json:"type"`
	ID            string         `json:"id"`
	PriceListName string         `json:"priceListName,omitempty"`
}

// SalarySchemeType represents salary scheme types
type SalarySchemeType string

const (
	SalarySchemePercentage SalarySchemeType = "percentage"
	SalarySchemeRate       SalarySchemeType = "rate"
)

// SalaryScheme represents a salary scheme
type SalaryScheme struct {
	ID             string           `json:"id"`
	Name           string           `json:"name"`
	Type           SalarySchemeType `json:"type"`
	Percentage     float64          `json:"percentage,omitempty"`
	FixedDeduction float64          `json:"fixedDeduction,omitempty"`
	RateSource     *RateSource      `json:"rateSource,omitempty"`
	Rates          []SalaryRate     `json:"rates,omitempty"`
}

// WashComment represents a comment on a wash event
type WashComment struct {
	Text     string `json:"text"`
	AuthorID string `json:"authorId"`
	Date     string `json:"date"`
}

// WashEventEditHistory represents edit history for wash events
type WashEventEditHistory struct {
	EditedAt      string                 `json:"editedAt"`
	EditedBy      string                 `json:"editedBy"`
	PreviousState map[string]interface{} `json:"previousState"`
	Reason        string                 `json:"reason,omitempty"`
}

// WashPaymentMethod represents wash payment methods
type WashPaymentMethod string

const (
	WashPaymentCash                WashPaymentMethod = "cash"
	WashPaymentCard                WashPaymentMethod = "card"
	WashPaymentTransfer            WashPaymentMethod = "transfer"
	WashPaymentAggregator          WashPaymentMethod = "aggregator"
	WashPaymentCounterAgentContract WashPaymentMethod = "counterAgentContract"
)

// WashServices represents services in a wash event
type WashServices struct {
	Main       PriceListItem   `json:"main"`
	Additional []PriceListItem `json:"additional"`
}

// WashEvent represents a wash event
type WashEvent struct {
	ID             string                 `json:"id"`
	Timestamp      string                 `json:"timestamp"`
	VehicleNumber  string                 `json:"vehicleNumber"`
	EmployeeIDs    []string               `json:"employeeIds"`
	PaymentMethod  WashPaymentMethod      `json:"paymentMethod"`
	SourceID       string                 `json:"sourceId,omitempty"`
	SourceName     string                 `json:"sourceName,omitempty"`
	PriceListName  string                 `json:"priceListName,omitempty"`
	TotalAmount    float64                `json:"totalAmount"`
	NetAmount      float64                `json:"netAmount,omitempty"`
	AcquiringFee   float64                `json:"acquiringFee,omitempty"`
	Services       WashServices           `json:"services"`
	DriverComments []WashComment          `json:"driverComments,omitempty"`
	EditHistory    []WashEventEditHistory `json:"editHistory,omitempty"`
}

// EmployeeTransactionType represents employee transaction types
type EmployeeTransactionType string

const (
	EmpTransPayment  EmployeeTransactionType = "payment"
	EmpTransLoan     EmployeeTransactionType = "loan"
	EmpTransBonus    EmployeeTransactionType = "bonus"
	EmpTransPurchase EmployeeTransactionType = "purchase"
)

// EmployeeTransaction represents an employee transaction
type EmployeeTransaction struct {
	ID          string                  `json:"id"`
	EmployeeID  string                  `json:"employeeId"`
	Date        string                  `json:"date"`
	Type        EmployeeTransactionType `json:"type"`
	Amount      float64                 `json:"amount"`
	Description string                  `json:"description"`
}

// EmployeeTransactionsFile represents the structure of employee transactions file
type EmployeeTransactionsFile struct {
	Transactions []EmployeeTransaction `json:"transactions"`
}

// ClientTransaction represents a client transaction
type ClientTransaction struct {
	ID          string  `json:"id"`
	ClientID    string  `json:"clientId"`
	Date        string  `json:"date"`
	Type        string  `json:"type"` // always "payment"
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
}

// ClientTransactionsFile represents the structure of client transactions file
type ClientTransactionsFile struct {
	Transactions []ClientTransaction `json:"transactions"`
}

// Expense represents an expense
type Expense struct {
	ID           string  `json:"id"`
	Date         string  `json:"date"`
	Category     string  `json:"category"`
	Description  string  `json:"description"`
	Amount       float64 `json:"amount"`
	Quantity     float64 `json:"quantity,omitempty"`
	Unit         string  `json:"unit,omitempty"`
	PricePerUnit float64 `json:"pricePerUnit,omitempty"`
}

// Inventory represents chemical inventory
type Inventory struct {
	ChemicalStockGrams float64 `json:"chemicalStockGrams"`
}

// SalaryBreakdownItem represents a breakdown item in salary report
type SalaryBreakdownItem struct {
	WashEventID    string   `json:"washEventId"`
	Timestamp      string   `json:"timestamp"`
	VehicleNumber  string   `json:"vehicleNumber"`
	Earnings       float64  `json:"earnings"`
	UnpaidServices []string `json:"unpaidServices"`
}

// SalaryReportData represents salary report data
type SalaryReportData struct {
	EmployeeID    string                `json:"employeeId"`
	EmployeeName  string                `json:"employeeName"`
	TotalEarnings float64               `json:"totalEarnings"`
	Breakdown     []SalaryBreakdownItem `json:"breakdown"`
}
