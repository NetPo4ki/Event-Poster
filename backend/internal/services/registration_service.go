package services

import (
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/netpo4ki/event-poster/internal/database"
	"github.com/netpo4ki/event-poster/internal/models"
)

// RegistrationService handles the business logic for registrations
type RegistrationService struct {
	eventService *EventService
}

// NewRegistrationService creates a new RegistrationService
func NewRegistrationService() *RegistrationService {
	return &RegistrationService{
		eventService: NewEventService(),
	}
}

// GetAllRegistrations retrieves all registrations from the database
func (s *RegistrationService) GetAllRegistrations(eventID *int64) ([]models.Registration, error) {
	var query string
	var args []interface{}

	if eventID != nil {
		query = `
			SELECT id, event_id, user_id, first_name, last_name, created_at
			FROM registrations
			WHERE event_id = ?
			ORDER BY created_at
		`
		args = append(args, *eventID)
	} else {
		query = `
			SELECT id, event_id, user_id, first_name, last_name, created_at
			FROM registrations
			ORDER BY created_at
		`
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var registrations []models.Registration
	for rows.Next() {
		var registration models.Registration
		var createdAtStr string
		var userID sql.NullInt64

		if err := rows.Scan(
			&registration.ID,
			&registration.EventID,
			&userID,
			&registration.FirstName,
			&registration.LastName,
			&createdAtStr,
		); err != nil {
			return nil, err
		}

		registration.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
		if userID.Valid {
			registration.UserID = userID.Int64
		}
		registrations = append(registrations, registration)
	}

	return registrations, nil
}

// GetRegistrationByID retrieves a single registration by ID
func (s *RegistrationService) GetRegistrationByID(id int64) (*models.Registration, error) {
	var registration models.Registration
	var createdAtStr string
	var userID sql.NullInt64

	err := database.DB.QueryRow(`
		SELECT id, event_id, user_id, first_name, last_name, created_at
		FROM registrations
		WHERE id = ?
	`, id).Scan(
		&registration.ID,
		&registration.EventID,
		&userID,
		&registration.FirstName,
		&registration.LastName,
		&createdAtStr,
	)

	if err != nil {
		return nil, err
	}

	registration.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	if userID.Valid {
		registration.UserID = userID.Int64
	}

	return &registration, nil
}

// GetRegistrationWithEventDetails retrieves a registration with event details
func (s *RegistrationService) GetRegistrationWithEventDetails(id int64) (*models.RegistrationResponse, error) {
	registration, err := s.GetRegistrationByID(id)
	if err != nil {
		return nil, err
	}

	event, err := s.eventService.GetEventByID(registration.EventID)
	if err != nil {
		return nil, err
	}

	response := &models.RegistrationResponse{
		Registration: *registration,
		EventTitle:   event.Title,
		EventDate:    event.EventDate,
		EventType:    event.EventType,
	}

	return response, nil
}

// GetUserRegistrations retrieves all registrations for a user
func (s *RegistrationService) GetUserRegistrations(userID int64) ([]models.RegistrationResponse, error) {
	rows, err := database.DB.Query(`
		SELECT r.id, r.event_id, r.user_id, r.first_name, r.last_name, r.created_at,
		       e.title, e.event_type, e.event_date, e.description, e.location
		FROM registrations r
		JOIN events e ON r.event_id = e.id
		WHERE r.user_id = ?
		ORDER BY r.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var registrations []models.RegistrationResponse
	for rows.Next() {
		var registration models.Registration
		var response models.RegistrationResponse
		var createdAtStr string
		var eventDateStr string
		var dbUserID sql.NullInt64
		var description, location sql.NullString

		if err := rows.Scan(
			&registration.ID,
			&registration.EventID,
			&dbUserID,
			&registration.FirstName,
			&registration.LastName,
			&createdAtStr,
			&response.EventTitle,
			&response.EventType,
			&eventDateStr,
			&description,
			&location,
		); err != nil {
			return nil, err
		}

		// Parse the created_at timestamp with error handling
		parsedCreatedAt, err := time.Parse(time.RFC3339, createdAtStr)
		if err != nil {
			// If error parsing, use current time as fallback
			parsedCreatedAt = time.Now()
		}
		registration.CreatedAt = parsedCreatedAt

		// Parse the event date timestamp
		response.EventDate, _ = time.Parse(time.RFC3339, eventDateStr)

		if dbUserID.Valid {
			registration.UserID = dbUserID.Int64
		}

		if description.Valid {
			response.EventDescription = description.String
		}

		if location.Valid {
			response.EventLocation = location.String
		}

		response.Registration = registration
		registrations = append(registrations, response)
	}

	return registrations, nil
}

// CheckExistingRegistration checks if a user has already registered for an event
func (s *RegistrationService) CheckExistingRegistration(eventID, userID int64) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM registrations 
		WHERE event_id = ? AND user_id = ?
	`, eventID, userID).Scan(&count)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// CreateRegistration creates a new registration
func (s *RegistrationService) CreateRegistration(req *models.RegistrationRequest, userID *int64) (int64, error) {
	if err := req.Validate(); err != nil {
		log.Printf("CreateRegistration validation error: %v", err)
		return 0, err
	}

	log.Printf("CreateRegistration: Validating event ID %d", req.EventID)

	// Check if the event exists
	event, err := s.eventService.GetEventByID(req.EventID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("CreateRegistration: Event not found with ID %d", req.EventID)
			return 0, errors.New("event not found")
		}
		log.Printf("CreateRegistration: Error checking event: %v", err)
		return 0, err
	}

	// Check if there are available seats
	hasSeats, err := s.eventService.HasAvailableSeats(req.EventID)
	if err != nil {
		log.Printf("CreateRegistration: Error checking available seats: %v", err)
		return 0, err
	}

	if !hasSeats {
		log.Printf("CreateRegistration: Event %d is fully booked", req.EventID)
		return 0, errors.New("event is fully booked")
	}

	// Check if the event date has passed
	if event.EventDate.Before(time.Now()) {
		log.Printf("CreateRegistration: Event %d date has passed", req.EventID)
		return 0, errors.New("cannot register for a past event")
	}

	// Check if the user has already registered for this event
	if userID != nil {
		alreadyRegistered, err := s.CheckExistingRegistration(req.EventID, *userID)
		if err != nil {
			log.Printf("CreateRegistration: Error checking existing registration: %v", err)
			return 0, err
		}

		if alreadyRegistered {
			log.Printf("CreateRegistration: User %d already registered for event %d", *userID, req.EventID)
			return 0, errors.New("you have already registered for this event")
		}
	}

	log.Printf("CreateRegistration: Creating registration for %s %s for event %d",
		req.FirstName, req.LastName, req.EventID)

	// Create the registration
	var result sql.Result
	currentTime := time.Now().Format(time.RFC3339)

	if userID != nil {
		result, err = database.DB.Exec(`
			INSERT INTO registrations (event_id, user_id, first_name, last_name, created_at)
			VALUES (?, ?, ?, ?, ?)
		`, req.EventID, userID, req.FirstName, req.LastName, currentTime)
	} else {
		result, err = database.DB.Exec(`
			INSERT INTO registrations (event_id, first_name, last_name, created_at)
			VALUES (?, ?, ?, ?)
		`, req.EventID, req.FirstName, req.LastName, currentTime)
	}

	if err != nil {
		log.Printf("CreateRegistration database error: %v", err)
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Printf("CreateRegistration LastInsertId error: %v", err)
		return 0, err
	}

	log.Printf("CreateRegistration: Successfully created registration with ID %d", id)
	return id, nil
}

// UpdateRegistration updates an existing registration
func (s *RegistrationService) UpdateRegistration(id int64, req *models.RegistrationRequest, userID int64) error {
	if err := req.Validate(); err != nil {
		return err
	}

	// Check if the registration exists
	registration, err := s.GetRegistrationByID(id)
	if err != nil {
		return err
	}

	// Check if the user has permission to update this registration
	if registration.UserID != userID {
		return errors.New("you don't have permission to update this registration")
	}

	// Check if the event exists
	_, err = s.eventService.GetEventByID(req.EventID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("event not found")
		}
		return err
	}

	// Update the registration
	result, err := database.DB.Exec(`
		UPDATE registrations
		SET event_id = ?, first_name = ?, last_name = ?
		WHERE id = ?
	`, req.EventID, req.FirstName, req.LastName, id)

	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("registration not found")
	}

	return nil
}

// DeleteRegistration deletes a registration by ID
func (s *RegistrationService) DeleteRegistration(id int64, userID int64) error {
	// Check if the registration exists
	registration, err := s.GetRegistrationByID(id)
	if err != nil {
		return err
	}

	// Check if the user has permission to delete this registration
	if registration.UserID != userID {
		return errors.New("you don't have permission to delete this registration")
	}

	// Delete the registration
	result, err := database.DB.Exec("DELETE FROM registrations WHERE id = ?", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("registration not found")
	}

	return nil
}
