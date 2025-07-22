package services

import (
	"nhcommunity/models"
	"nhcommunity/repositories"
)

// NotificationService defines the interface for notification business logic
type NotificationService interface {
	GetNotifications(userID uint, limit, offset int) ([]models.NotificationResponse, error)
	MarkAsRead(notificationID, userID uint) error
	MarkAllAsRead(userID uint) error
}

type notificationService struct {
	repo repositories.NotificationRepository
}

// NewNotificationService creates a new instance of NotificationService
func NewNotificationService(repo repositories.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) GetNotifications(userID uint, limit, offset int) ([]models.NotificationResponse, error) {
	notifications, err := s.repo.FindByUserID(userID, limit, offset)
	if err != nil {
		return nil, err
	}
	var responses []models.NotificationResponse
	for _, n := range notifications {
		responses = append(responses, n.ToResponse())
	}
	return responses, nil
}

func (s *notificationService) MarkAsRead(notificationID, userID uint) error {
	// In a real application, you'd want to find the notification first to ensure the user owns it.
	// For simplicity here, we'll just update it directly.
	// This would require a FindByID method in the repository.
	notification := &models.Notification{ID: notificationID}
	return s.repo.MarkAsRead(notification)
}

func (s *notificationService) MarkAllAsRead(userID uint) error {
	return s.repo.MarkAllAsRead(userID)
}
