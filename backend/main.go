package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sarwanazhar/boardsar/backend/database"
	"github.com/sarwanazhar/boardsar/backend/routes"
)

func init() {
	// Load .env only if running locally (PORT not set)
	if os.Getenv("PORT") == "" {
		err := godotenv.Load()
		if err != nil {
			log.Println("⚠️  No .env file found, continuing...")
		} else {
			log.Println("✅ .env loaded")
		}
	}
}

func main() {
	port := os.Getenv("PORT")
	backendUri := os.Getenv("MONGODB_URI")

	if port == "" {
		port = "8080"
	}
	if backendUri == "" {
		log.Fatal("❌ MONGODB_URI is empty")
	}

	// Connect to MongoDB
	database.ConnectMongo(backendUri)

	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://boardsar.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	// Register routes
	routes.InitRoutes(r)

	address := fmt.Sprintf(":%s", port)
	fmt.Printf("✅ Starting server on %s\n", address)

	if err := r.Run(address); err != nil {
		log.Fatalf("❌ Server failed to run: %v", err)
	}
}
