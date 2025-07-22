package models

import (
	"time"
)

// Event represents a community event
type Event struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Title        string    `gorm:"size:200;not null" json:"title"`
	Description  string    `gorm:"size:5000;not null" json:"description"`
	Location     string    `gorm:"size:500;not null" json:"location"`
	StartDate    time.Time `gorm:"not null" json:"start_date"`
	EndDate      time.Time `gorm:"not null" json:"end_date"`
	ImageURL     string    `gorm:"size:500" json:"image_url"`
	MaxAttendees int       `gorm:"default:0" json:"max_attendees"` // 0 means unlimited
	CreatorID    uint      `gorm:"not null" json:"creator_id"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	Creator   User            `gorm:"foreignKey:CreatorID" json:"creator"`
	Attendees []EventAttendee `gorm:"foreignKey:EventID" json:"attendees,omitempty"`
}

// EventAttendee represents a user attending an event
type EventAttendee struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	EventID   uint      `gorm:"not null" json:"event_id"`
	Status    string    `gorm:"size:20;default:'going'" json:"status"` // going, interested, not_going
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	User  User  `gorm:"foreignKey:UserID" json:"user"`
	Event Event `gorm:"foreignKey:EventID" json:"-"`
}

// EventResponse is the public event data with creator info
type EventResponse struct {
	ID             uint           `json:"id"`
	Title          string         `json:"title"`
	Description    string         `json:"description"`
	Location       string         `json:"location"`
	StartDate      time.Time      `json:"start_date"`
	EndDate        time.Time      `json:"end_date"`
	ImageURL       string         `json:"image_url"`
	MaxAttendees   int            `json:"max_attendees"`
	IsActive       bool           `json:"is_active"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	Creator        UserResponse   `json:"creator"`
	AttendeesCount int            `json:"attendees_count"`
	UserAttendance *EventAttendee `json:"user_attendance,omitempty"`
}

// CreateEventRequest represents the request body for creating an event
type CreateEventRequest struct {
	Title        string    `json:"title" binding:"required"`
	Description  string    `json:"description" binding:"required"`
	Location     string    `json:"location" binding:"required"`
	StartDate    time.Time `json:"start_date" binding:"required"`
	EndDate      time.Time `json:"end_date" binding:"required"`
	ImageURL     string    `json:"image_url"`
	MaxAttendees int       `json:"max_attendees"`
}

// UpdateEventRequest represents the request body for updating an event
type UpdateEventRequest struct {
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Location     string    `json:"location"`
	StartDate    time.Time `json:"start_date"`
	EndDate      time.Time `json:"end_date"`
	ImageURL     string    `json:"image_url"`
	MaxAttendees *int      `json:"max_attendees"`
}

// ToResponse converts an event to an event response
func (e *Event) ToResponse(currentUserID uint) EventResponse {
	var userAttendance *EventAttendee
	attendeesCount := len(e.Attendees)

	// Check if the current user is attending this event
	for _, attendee := range e.Attendees {
		if attendee.UserID == currentUserID {
			userAttendance = &attendee
			break
		}
	}

	return EventResponse{
		ID:             e.ID,
		Title:          e.Title,
		Description:    e.Description,
		Location:       e.Location,
		StartDate:      e.StartDate,
		EndDate:        e.EndDate,
		ImageURL:       e.ImageURL,
		MaxAttendees:   e.MaxAttendees,
		IsActive:       e.IsActive,
		CreatedAt:      e.CreatedAt,
		UpdatedAt:      e.UpdatedAt,
		Creator:        e.Creator.ToResponse(),
		AttendeesCount: attendeesCount,
		UserAttendance: userAttendance,
	}
}
