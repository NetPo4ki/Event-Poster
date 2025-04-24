package models

import (
	"errors"
	"time"
)

// Registration represents a registration for an event
type Registration struct {
	ID        int64     `json:"id"`
	EventID   int64     `json:"event_id"`
	UserID    int64     `json:"user_id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	CreatedAt time.Time `json:"created_at"`
}

// RegistrationRequest represents the request body for creating or updating a registration
type RegistrationRequest struct {
	EventID   int64  `json:"event_id" binding:"required"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Notes     string `json:"notes"`
}

// RegistrationResponse represents the response for a registration with event details
type RegistrationResponse struct {
	Registration
	EventTitle       string    `json:"event_title"`
	EventDescription string    `json:"event_description"`
	EventLocation    string    `json:"event_location"`
	EventDate        time.Time `json:"event_date"`
	EventType        string    `json:"event_type"`
}

// Validate performs validation on the registration request
func (r *RegistrationRequest) Validate() error {
	if r.EventID <= 0 {
		return errors.New("event ID is required")
	}
	return nil
}

// ToRegistration converts a RegistrationRequest to a Registration
func (r *RegistrationRequest) ToRegistration() *Registration {
	return &Registration{
		EventID:   r.EventID,
		FirstName: r.FirstName,
		LastName:  r.LastName,
	}
}
