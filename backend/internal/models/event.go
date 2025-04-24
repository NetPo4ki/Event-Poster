package models

import (
	"errors"
	"time"
)

// Event represents an event in the system
type Event struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	EventType   string    `json:"event_type"`
	EventDate   time.Time `json:"event_date"`
	Seats       int       `json:"seats"`
	CreatorID   int64     `json:"creator_id"`
	CreatedAt   time.Time `json:"created_at"`
}

// EventRequest represents the request body for creating or updating an event
type EventRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	EventType   string    `json:"event_type" binding:"required"`
	EventDate   time.Time `json:"event_date" binding:"required"`
	Seats       int       `json:"seats" binding:"required"`
}

// Validate performs validation on the event request
func (r *EventRequest) Validate() error {
	if r.Title == "" {
		return errors.New("title is required")
	}
	if r.EventType == "" {
		return errors.New("event type is required")
	}

	// Allow dates that are a full day in the past to handle time zone differences and ensure
	// events being created for "tomorrow" don't get marked as expired
	oneDayAgo := time.Now().Add(-24 * time.Hour)
	if r.EventDate.Before(oneDayAgo) {
		return errors.New("event date must be no more than one day in the past")
	}

	if r.Seats <= 0 {
		return errors.New("number of seats must be greater than zero")
	}
	return nil
}

// ToEvent converts an EventRequest to an Event
func (r *EventRequest) ToEvent() *Event {
	return &Event{
		Title:       r.Title,
		Description: r.Description,
		Location:    r.Location,
		EventType:   r.EventType,
		EventDate:   r.EventDate,
		Seats:       r.Seats,
	}
}

// AvailableSeats returns the number of available seats for the event
func (e *Event) AvailableSeats(registrationsCount int) int {
	return e.Seats - registrationsCount
}
