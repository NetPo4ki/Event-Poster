package controllers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/netpo4ki/event-poster/internal/models"
	"github.com/netpo4ki/event-poster/internal/services"
)

var registrationService = services.NewRegistrationService()

// userService is already declared in user_controller.go

// GetRegistrations returns all registrations
func GetRegistrations(c *gin.Context) {
	// Check if filtering by event ID
	var eventID *int64
	eventIDParam := c.Query("event_id")
	if eventIDParam != "" {
		id, err := strconv.ParseInt(eventIDParam, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
			return
		}
		eventID = &id
	}

	registrations, err := registrationService.GetAllRegistrations(eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get registrations"})
		return
	}

	c.JSON(http.StatusOK, registrations)
}

// GetMyRegistrations returns registrations for the current user
func GetMyRegistrations(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	registrations, err := registrationService.GetUserRegistrations(userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get registrations"})
		return
	}

	c.JSON(http.StatusOK, registrations)
}

// GetRegistration returns a specific registration by ID
func GetRegistration(c *gin.Context) {
	id := c.Param("id")
	registrationID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid registration ID"})
		return
	}

	// Get the registration with event details for a more complete response
	registration, err := registrationService.GetRegistrationWithEventDetails(registrationID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get registration"})
		}
		return
	}

	c.JSON(http.StatusOK, registration)
}

// CreateRegistration creates a new registration
func CreateRegistration(c *gin.Context) {
	// Get user ID from context (set by authentication middleware)
	var userID *int64
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	idValue := userIDValue.(int64)
	userID = &idValue

	// Get user information for registration
	user, err := userService.GetUserByID(idValue)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user information"})
		return
	}

	var req models.RegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Use the authenticated user's name
	nameParts := strings.Split(user.Username, " ")
	req.FirstName = nameParts[0]
	if len(nameParts) > 1 {
		req.LastName = strings.Join(nameParts[1:], " ")
	} else {
		req.LastName = user.Username // Use username as last name if no space in username
	}

	id, err := registrationService.CreateRegistration(&req, userID)
	if err != nil {
		// More specific error handling based on business logic
		if err.Error() == "event is fully booked" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else if err.Error() == "cannot register for a past event" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else if err.Error() == "you have already registered for this event" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// UpdateRegistration updates an existing registration
func UpdateRegistration(c *gin.Context) {
	// Get user ID from context (set by authentication middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	id := c.Param("id")
	registrationID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid registration ID"})
		return
	}

	var req models.RegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = registrationService.UpdateRegistration(registrationID, &req, userID.(int64))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registration updated successfully"})
}

// DeleteRegistration deletes a registration
func DeleteRegistration(c *gin.Context) {
	// Get user ID from context (set by authentication middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	id := c.Param("id")
	registrationID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid registration ID"})
		return
	}

	err = registrationService.DeleteRegistration(registrationID, userID.(int64))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registration deleted successfully"})
}
