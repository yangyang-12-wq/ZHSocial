package repositories

import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

// EventRepository defines the interface for event data operations
type EventRepository interface {
	FindAll(limit, offset int) ([]models.Event, error)
	FindByID(id uint) (*models.Event, error)
	Create(event *models.Event) (*models.Event, error)
	Update(event *models.Event) (*models.Event, error)
	Delete(event *models.Event) error

	FindAttendee(userID, eventID uint) (*models.EventAttendee, error)
	CreateAttendee(attendee *models.EventAttendee) error
	DeleteAttendee(userID, eventID uint) error
}

type eventRepository struct {
	db *gorm.DB
}

// NewEventRepository creates a new instance of EventRepository
func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) FindAll(limit, offset int) ([]models.Event, error) {
	var events []models.Event
	err := r.db.Preload("Creator").Limit(limit).Offset(offset).Order("start_date desc").Find(&events).Error
	return events, err
}

func (r *eventRepository) FindByID(id uint) (*models.Event, error) {
	var event models.Event
	err := r.db.Preload("Creator").Preload("Attendees.User").First(&event, id).Error
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *eventRepository) Create(event *models.Event) (*models.Event, error) {
	err := r.db.Create(event).Error
	return event, err
}

func (r *eventRepository) Update(event *models.Event) (*models.Event, error) {
	err := r.db.Save(event).Error
	return event, err
}

func (r *eventRepository) Delete(event *models.Event) error {
	return r.db.Delete(event).Error
}

func (r *eventRepository) FindAttendee(userID, eventID uint) (*models.EventAttendee, error) {
	var attendee models.EventAttendee
	err := r.db.Where("user_id = ? AND event_id = ?", userID, eventID).First(&attendee).Error
	return &attendee, err
}

func (r *eventRepository) CreateAttendee(attendee *models.EventAttendee) error {
	return r.db.Create(attendee).Error
}

func (r *eventRepository) DeleteAttendee(userID, eventID uint) error {
	return r.db.Where("user_id = ? AND event_id = ?", userID, eventID).Delete(&models.EventAttendee{}).Error
} 
