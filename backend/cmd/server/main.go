package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/netpo4ki/event-poster/internal/controllers"
	"github.com/netpo4ki/event-poster/internal/database"
	"github.com/netpo4ki/event-poster/internal/middleware"
	"github.com/netpo4ki/event-poster/internal/services"
)

func main() {
	// Initialize database
	database.InitDB()
	defer database.CloseDB()

	// Create router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// Add health check endpoint - this should be at the root level
	router.GET("/healthz", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// Set up API routes
	api := router.Group("/api")

	// Public routes
	api.POST("/register", controllers.Register)
	api.POST("/login", controllers.Login)
	api.GET("/events", controllers.GetEvents)
	api.GET("/events/:id", controllers.GetEvent)

	// Routes that require authentication
	authRoutes := api.Group("/")
	authRoutes.Use(middleware.JWTAuthMiddleware())
	{
		// User routes
		authRoutes.GET("/me", controllers.GetCurrentUser)
		authRoutes.GET("/my-events", controllers.GetMyEvents)
		authRoutes.GET("/my-registrations", controllers.GetMyRegistrations)

		// Event routes
		authRoutes.POST("/events", controllers.CreateEvent)
		authRoutes.PUT("/events/:id", controllers.UpdateEvent)
		authRoutes.DELETE("/events/:id", controllers.DeleteEvent)

		// Registration routes
		authRoutes.GET("/registrations", controllers.GetRegistrations)
		authRoutes.GET("/registrations/:id", controllers.GetRegistration)
		authRoutes.POST("/registrations", controllers.CreateRegistration)
		authRoutes.PUT("/registrations/:id", controllers.UpdateRegistration)
		authRoutes.DELETE("/registrations/:id", controllers.DeleteRegistration)
	}

	// Set up periodic task to clean up expired events
	go func() {
		for {
			eventService := services.NewEventService()
			err := eventService.DeleteExpiredEvents()
			if err != nil {
				log.Printf("Error deleting expired events: %v", err)
			}

			// Wait for 1 hour before next check
			time.Sleep(1 * time.Hour)
		}
	}()

	// Determine port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server in a goroutine so we can handle graceful shutdown
	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	go func() {
		log.Printf("Server starting on port %s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	database.CloseDB()
	log.Println("Server stopped")
}
