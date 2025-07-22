package repositories

import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

// NotificationRepository defines the interface for notification data operations
type NotificationRepository interface {
	FindByUserID(userID uint, limit, offset int) ([]models.Notification, error)
	Create(notification *models.Notification) (*models.Notification, error)
	MarkAsRead(notification *models.Notification) error
	MarkAllAsRead(userID uint) error
}

type notificationRepository struct {
	db *gorm.DB
}

// NewNotificationRepository creates a new instance of NotificationRepository
func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) FindByUserID(userID uint, limit, offset int) ([]models.Notification, error) {
	var notifications []models.Notification
	err := r.db.Where("user_id = ?", userID).Preload("Sender").Limit(limit).Offset(offset).Order("created_at desc").Find(&notifications).Error
	return notifications, err
}

func (r *notificationRepository) Create(notification *models.Notification) (*models.Notification, error) {
	err := r.db.Create(notification).Error
	return notification, err
}

func (r *notificationRepository) MarkAsRead(notification *models.Notification) error {
	notification.IsRead = true
	return r.db.Save(notification).Error
}

func (r *notificationRepository) MarkAllAsRead(userID uint) error {
	return r.db.Model(&models.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Update("is_read", true).Error
}
