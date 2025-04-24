package controllers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/netpo4ki/event-poster/internal/models"
	"github.com/netpo4ki/event-poster/internal/services"
)

var eventService = services.NewEventService()

// GetEvents returns all events
func GetEvents(c *gin.Context) {
	events, err := eventService.GetAllEvents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get events"})
		return
	}

	// Prepare response with available seats for each event
	var response []gin.H
	for _, event := range events {
		// Get registration count for the event
		registrationsCount, err := eventService.GetRegistrationsCountForEvent(event.ID)
		if err != nil {
			log.Printf("Failed to get registrations count for event ID %d: %v", event.ID, err)
			// Continue with other events if one fails
			continue
		}

		// Calculate available seats
		availableSeats := event.Seats - registrationsCount

		// Add event with available seats to response
		response = append(response, gin.H{
			"id":              event.ID,
			"title":           event.Title,
			"description":     event.Description,
			"location":        event.Location,
			"event_type":      event.EventType,
			"event_date":      event.EventDate,
			"seats":           event.Seats,
			"created_at":      event.CreatedAt,
			"creator_id":      event.CreatorID,
			"available_seats": availableSeats,
			"registrations":   registrationsCount,
		})
	}

	c.JSON(http.StatusOK, response)
}

// GetMyEvents returns events created by the current user
func GetMyEvents(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	events, err := eventService.GetEventsByUser(userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get events"})
		return
	}

	// Prepare response with available seats for each event
	var response []gin.H
	for _, event := range events {
		// Get registration count for the event
		registrationsCount, err := eventService.GetRegistrationsCountForEvent(event.ID)
		if err != nil {
			log.Printf("Failed to get registrations count for event ID %d: %v", event.ID, err)
			// Continue with other events if one fails
			continue
		}

		// Calculate available seats
		availableSeats := event.Seats - registrationsCount

		// Add event with available seats to response
		response = append(response, gin.H{
			"id":              event.ID,
			"title":           event.Title,
			"description":     event.Description,
			"location":        event.Location,
			"event_type":      event.EventType,
			"event_date":      event.EventDate,
			"seats":           event.Seats,
			"created_at":      event.CreatedAt,
			"creator_id":      event.CreatorID,
			"available_seats": availableSeats,
			"registrations":   registrationsCount,
		})
	}

	c.JSON(http.StatusOK, response)
}

// GetEvent returns a specific event by ID
func GetEvent(c *gin.Context) {
	id := c.Param("id")
	eventID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	event, err := eventService.GetEventByID(eventID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get event"})
		}
		return
	}

	// Get registration count for the event
	registrationsCount, err := eventService.GetRegistrationsCountForEvent(eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get registrations count"})
		return
	}

	// Calculate available seats
	availableSeats := event.Seats - registrationsCount

	// Return event with available seats
	c.JSON(http.StatusOK, gin.H{
		"id":              event.ID,
		"title":           event.Title,
		"description":     event.Description,
		"location":        event.Location,
		"event_type":      event.EventType,
		"event_date":      event.EventDate,
		"seats":           event.Seats,
		"created_at":      event.CreatedAt,
		"creator_id":      event.CreatorID,
		"available_seats": availableSeats,
		"registrations":   registrationsCount,
	})
}

// CreateEvent creates a new event
func CreateEvent(c *gin.Context) {
	// Get user ID from context (set by authentication middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.EventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := eventService.CreateEvent(&req, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// UpdateEvent updates an existing event
func UpdateEvent(c *gin.Context) {
	// Get user ID from context (set by authentication middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	id := c.Param("id")
	eventID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	var req models.EventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = eventService.UpdateEvent(eventID, &req, userID.(int64))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event updated successfully"})
}

// DeleteEvent deletes an event
func DeleteEvent(c *gin.Context) {
	// Get user ID from context (set by authentication middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	id := c.Param("id")
	eventID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	err = eventService.DeleteEvent(eventID, userID.(int64))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}
