package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Port     string
	DataPath string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dataPath := os.Getenv("DATA_PATH")
	if dataPath == "" {
		// Default to ../data relative to the backend-go directory
		execPath, _ := os.Getwd()
		dataPath = filepath.Join(execPath, "..", "data")
	}

	return &Config{
		Port:     port,
		DataPath: dataPath,
	}
}
