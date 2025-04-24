package services

import (
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/netpo4ki/event-poster/internal/database"
	"github.com/netpo4ki/event-poster/internal/models"
)

// EventService handles the business logic for events
type EventService struct{}

// NewEventService creates a new EventService
func NewEventService() *EventService {
	return &EventService{}
}

// GetAllEvents retrieves all events from the database
func (s *EventService) GetAllEvents() ([]models.Event, error) {
	log.Println("GetAllEvents: Retrieving all events")

	// Delete expired events first
	s.DeleteExpiredEvents()

	rows, err := database.DB.Query(`
		SELECT id, title, description, location, event_type, event_date, seats, creator_id, created_at
		FROM events
		ORDER BY event_date
	`)
	if err != nil {
		log.Printf("GetAllEvents error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var event models.Event
		var eventDateStr string
		var createdAtStr string
		var creatorID sql.NullInt64
		var description, location sql.NullString

		if err := rows.Scan(
			&event.ID,
			&event.Title,
			&description,
			&location,
			&event.EventType,
			&eventDateStr,
			&event.Seats,
			&creatorID,
			&createdAtStr); err != nil {
			log.Printf("GetAllEvents scan error: %v", err)
			return nil, err
		}

		event.EventDate, _ = time.Parse(time.RFC3339, eventDateStr)
		event.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
		if creatorID.Valid {
			event.CreatorID = creatorID.Int64
		}
		if description.Valid {
			event.Description = description.String
		}
		if location.Valid {
			event.Location = location.String
		}
		events = append(events, event)
	}

	log.Printf("GetAllEvents: Found %d events", len(events))
	return events, nil
}

// GetEventByID retrieves a single event by ID
func (s *EventService) GetEventByID(id int64) (*models.Event, error) {
	var event models.Event
	var eventDateStr string
	var createdAtStr string
	var creatorID sql.NullInt64
	var description, location sql.NullString

	err := database.DB.QueryRow(`
		SELECT id, title, description, location, event_type, event_date, seats, creator_id, created_at
		FROM events
		WHERE id = ?
	`, id).Scan(
		&event.ID,
		&event.Title,
		&description,
		&location,
		&event.EventType,
		&eventDateStr,
		&event.Seats,
		&creatorID,
		&createdAtStr)

	if err != nil {
		return nil, err
	}

	event.EventDate, _ = time.Parse(time.RFC3339, eventDateStr)
	event.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	if creatorID.Valid {
		event.CreatorID = creatorID.Int64
	}
	if description.Valid {
		event.Description = description.String
	}
	if location.Valid {
		event.Location = location.String
	}

	return &event, nil
}

// CreateEvent creates a new event
func (s *EventService) CreateEvent(req *models.EventRequest, userID int64) (int64, error) {
	if err := req.Validate(); err != nil {
		log.Printf("CreateEvent validation error: %v", err)
		return 0, err
	}

	log.Printf("CreateEvent: Creating event %s", req.Title)

	result, err := database.DB.Exec(`
		INSERT INTO events (title, description, location, event_type, event_date, seats, creator_id)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, req.Title, req.Description, req.Location, req.EventType, req.EventDate.Format(time.RFC3339), req.Seats, userID)

	if err != nil {
		log.Printf("CreateEvent database error: %v", err)
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Printf("CreateEvent LastInsertId error: %v", err)
		return 0, err
	}

	log.Printf("CreateEvent: Successfully created event with ID %d", id)
	return id, nil
}

// UpdateEvent updates an existing event
func (s *EventService) UpdateEvent(id int64, req *models.EventRequest, userID int64) error {
	if err := req.Validate(); err != nil {
		return err
	}

	// Check if the event exists
	event, err := s.GetEventByID(id)
	if err != nil {
		return err
	}

	// Check if the user has permission to update this event
	if event.CreatorID != userID {
		return errors.New("you don't have permission to update this event")
	}

	// Check if there are existing registrations
	var registrationsCount int
	err = database.DB.QueryRow("SELECT COUNT(*) FROM registrations WHERE event_id = ?", id).Scan(&registrationsCount)
	if err != nil {
		return err
	}

	// If updating seats, ensure there are enough for existing registrations
	if req.Seats < registrationsCount {
		return errors.New("cannot reduce seats below the number of existing registrations")
	}

	// Update the event
	result, err := database.DB.Exec(`
		UPDATE events
		SET title = ?, description = ?, location = ?, event_type = ?, event_date = ?, seats = ?
		WHERE id = ?
	`, req.Title, req.Description, req.Location, req.EventType, req.EventDate.Format(time.RFC3339), req.Seats, id)

	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("event not found")
	}

	return nil
}

// DeleteEvent deletes an event by ID
func (s *EventService) DeleteEvent(id int64, userID int64) error {
	// Check if the event exists
	event, err := s.GetEventByID(id)
	if err != nil {
		return err
	}

	// Check if the user has permission to delete this event
	if event.CreatorID != userID {
		return errors.New("you don't have permission to delete this event")
	}

	// Delete the event (this will also delete associated registrations due to ON DELETE CASCADE)
	result, err := database.DB.Exec("DELETE FROM events WHERE id = ?", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("event not found")
	}

	return nil
}

// DeleteExpiredEvents deletes events that have already passed
func (s *EventService) DeleteExpiredEvents() error {
	log.Println("DeleteExpiredEvents: Deleting events that have passed")

	// Use current time for comparison
	now := time.Now()

	// Query events that have passed
	rows, err := database.DB.Query(`
		SELECT id, title, event_date
		FROM events
		WHERE event_date < ?
	`, now.Format(time.RFC3339))

	if err != nil {
		log.Printf("DeleteExpiredEvents query error: %v", err)
		return err
	}
	defer rows.Close()

	// Collect events to be deleted
	var expiredEvents []int64
	for rows.Next() {
		var id int64
		var title string
		var eventDateStr string

		if err := rows.Scan(&id, &title, &eventDateStr); err != nil {
			log.Printf("DeleteExpiredEvents scan error: %v", err)
			continue
		}

		eventDate, err := time.Parse(time.RFC3339, eventDateStr)
		if err != nil {
			log.Printf("DeleteExpiredEvents time parsing error: %v", err)
			continue
		}

		// Double check the date is actually in the past
		if eventDate.Before(now) {
			expiredEvents = append(expiredEvents, id)
			log.Printf("DeleteExpiredEvents: Will delete expired event ID %d: %s (date: %s)",
				id, title, eventDate.Format(time.RFC3339))
		}
	}

	// If no expired events, return early
	if len(expiredEvents) == 0 {
		return nil
	}

	// Delete the confirmed expired events
	for _, id := range expiredEvents {
		_, err := database.DB.Exec("DELETE FROM events WHERE id = ?", id)
		if err != nil {
			log.Printf("DeleteExpiredEvents delete error for event %d: %v", id, err)
		}
	}

	log.Printf("DeleteExpiredEvents: Deleted %d expired events", len(expiredEvents))
	return nil
}

// GetRegistrationsCountForEvent gets the number of registrations for an event
func (s *EventService) GetRegistrationsCountForEvent(eventID int64) (int, error) {
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM registrations WHERE event_id = ?", eventID).Scan(&count)
	return count, err
}

// HasAvailableSeats checks if an event has available seats
func (s *EventService) HasAvailableSeats(eventID int64) (bool, error) {
	event, err := s.GetEventByID(eventID)
	if err != nil {
		return false, err
	}

	registrationsCount, err := s.GetRegistrationsCountForEvent(eventID)
	if err != nil {
		return false, err
	}

	return event.Seats > registrationsCount, nil
}

// GetEventsByUser retrieves events created by a specific user
func (s *EventService) GetEventsByUser(userID int64) ([]models.Event, error) {
	// Delete expired events first
	s.DeleteExpiredEvents()

	rows, err := database.DB.Query(`
		SELECT id, title, description, location, event_type, event_date, seats, creator_id, created_at
		FROM events
		WHERE creator_id = ?
		ORDER BY event_date
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var event models.Event
		var eventDateStr string
		var createdAtStr string
		var creatorID sql.NullInt64
		var description, location sql.NullString

		if err := rows.Scan(
			&event.ID,
			&event.Title,
			&description,
			&location,
			&event.EventType,
			&eventDateStr,
			&event.Seats,
			&creatorID,
			&createdAtStr); err != nil {
			return nil, err
		}

		event.EventDate, _ = time.Parse(time.RFC3339, eventDateStr)
		event.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
		if creatorID.Valid {
			event.CreatorID = creatorID.Int64
		}
		if description.Valid {
			event.Description = description.String
		}
		if location.Valid {
			event.Location = location.String
		}
		events = append(events, event)
	}

	return events, nil
}
