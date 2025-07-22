package services

import (
	"errors"
	"nhcommunity/models"
	"nhcommunity/repositories"
)

// EventService defines the interface for event business logic
type EventService interface {
	GetEvents(limit, offset int) ([]models.EventResponse, error)
	GetEventByID(id, currentUserID uint) (*models.EventResponse, error)
	CreateEvent(event *models.Event, userID uint) (*models.EventResponse, error)
	UpdateEvent(id, userID uint, req *models.UpdateEventRequest, userRole string) (*models.EventResponse, error)
	DeleteEvent(id, userID uint, userRole string) error
	GetCategories() ([]string, error)

	JoinEvent(eventID, userID uint) error
	LeaveEvent(eventID, userID uint) error
}

type eventService struct {
	repo repositories.EventRepository
}

// NewEventService creates a new instance of EventService
func NewEventService(repo repositories.EventRepository) EventService {
	return &eventService{repo: repo}
}

func (s *eventService) GetEvents(limit, offset int) ([]models.EventResponse, error) {
	events, err := s.repo.FindAll(limit, offset)
	if err != nil {
		return nil, err
	}
	var responses []models.EventResponse
	for _, e := range events {
		responses = append(responses, e.ToResponse(0)) // User not logged in
	}
	return responses, nil
}

func (s *eventService) GetEventByID(id, currentUserID uint) (*models.EventResponse, error) {
	event, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	response := event.ToResponse(currentUserID)
	return &response, nil
}

func (s *eventService) CreateEvent(event *models.Event, userID uint) (*models.EventResponse, error) {
	event.CreatorID = userID
	newEvent, err := s.repo.Create(event)
	if err != nil {
		return nil, err
	}
	response := newEvent.ToResponse(userID)
	return &response, nil
}

func (s *eventService) UpdateEvent(id, userID uint, req *models.UpdateEventRequest, userRole string) (*models.EventResponse, error) {
	event, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if event.CreatorID != userID && userRole != "admin" {
		return nil, errors.New("permission denied")
	}

	if req.Title != "" {
		event.Title = req.Title
	}
	if req.Description != "" {
		event.Description = req.Description
	}
	if req.Location != "" {
		event.Location = req.Location
	}
	if !req.StartDate.IsZero() {
		event.StartDate = req.StartDate
	}
	if !req.EndDate.IsZero() {
		event.EndDate = req.EndDate
	}
	if req.ImageURL != "" {
		event.ImageURL = req.ImageURL
	}
	if req.MaxAttendees != nil {
		event.MaxAttendees = *req.MaxAttendees
	}

	updatedEvent, err := s.repo.Update(event)
	if err != nil {
		return nil, err
	}
	response := updatedEvent.ToResponse(userID)
	return &response, nil
}

func (s *eventService) DeleteEvent(id, userID uint, userRole string) error {
	event, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if event.CreatorID != userID && userRole != "admin" {
		return errors.New("permission denied")
	}
	return s.repo.Delete(event)
}

func (s *eventService) GetCategories() ([]string, error) {
	// For now, we'll return a hardcoded list of categories.
	// Later, this could be fetched from the database.
	return []string{"academic", "cultural", "sports", "social", "career"}, nil
}

func (s *eventService) JoinEvent(eventID, userID uint) error {
	_, err := s.repo.FindAttendee(userID, eventID)
	if err == nil {
		return errors.New("already joined")
	}
	attendee := &models.EventAttendee{
		UserID:  userID,
		EventID: eventID,
	}
	return s.repo.CreateAttendee(attendee)
}

func (s *eventService) LeaveEvent(eventID, userID uint) error {
	return s.repo.DeleteAttendee(userID, eventID)
}
