package main

import (
	"flag"
	"log"
	"nhcommunity/config"
	"nhcommunity/routes"
	"nhcommunity/services"

	"github.com/gin-gonic/gin"
)

func main() {
	// Parse command-line flags
	resetDB := flag.Bool("reset-db", false, "Reset database (drop all tables and recreate them)")
	flag.Parse()

	// Load configuration
	config.LoadConfig()

	// Initialize Database
	db := config.SetupDB()

	// Check if database reset was requested
	if *resetDB {
		log.Println("Database reset requested via command line flag")
		config.ResetDatabase(db)
		log.Println("Database reset completed")
		return
	}

	// Create a new Hub for WebSocket connections
	hub := services.NewHub()
	go hub.Run()

	// Initialize Gin Engine
	router := gin.Default()

	// Setup Routes
	routes.SetupRoutes(router, db, hub)

	// Start Server
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}
