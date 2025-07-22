package models

import (
	"time"
)

// NotificationType defines types of notifications
type NotificationType string

const (
	// NotificationLike represents a notification for a like
	NotificationLike NotificationType = "like"
	// NotificationComment represents a notification for a comment
	NotificationComment NotificationType = "comment"
	// NotificationFollow represents a notification for a follow
	NotificationFollow NotificationType = "follow"
	// NotificationMention represents a notification for a mention
	NotificationMention NotificationType = "mention"
	// NotificationEvent represents a notification for an event
	NotificationEvent NotificationType = "event"
	// NotificationMessage represents a notification for a message
	NotificationMessage NotificationType = "message"
	// NotificationSystem represents a notification from the system
	NotificationSystem NotificationType = "system"
)

// Notification represents a user notification
type Notification struct {
	ID           uint            `gorm:"primaryKey" json:"id"`
	UserID       uint            `gorm:"not null" json:"user_id"`
	SenderID     *uint           `json:"sender_id"`
	Title        string          `gorm:"size:100;not null" json:"title"`
	Message      string          `gorm:"size:500;not null" json:"message"`
	Type         NotificationType `gorm:"size:20;not null" json:"type"`
	ResourceType string          `gorm:"size:50" json:"resource_type"` // post, comment, user, event, message, etc.
	ResourceID   uint            `json:"resource_id"`                 // ID of the related resource
	IsRead       bool            `gorm:"default:false" json:"is_read"`
	CreatedAt    time.Time       `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time       `gorm:"not null" json:"updated_at"`

	// Relationships
	User   User  `gorm:"foreignKey:UserID" json:"user"`
	Sender *User `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}

// NotificationResponse is the public notification data
type NotificationResponse struct {
	ID           uint             `json:"id"`
	Title        string           `json:"title"`
	Message      string           `json:"message"`
	Type         NotificationType `json:"type"`
	ResourceType string           `json:"resource_type"`
	ResourceID   uint             `json:"resource_id"`
	IsRead       bool             `json:"is_read"`
	CreatedAt    time.Time        `json:"created_at"`
	Sender       *UserResponse    `json:"sender,omitempty"`
}

// ToResponse converts a notification to a response
func (n *Notification) ToResponse() NotificationResponse {
	response := NotificationResponse{
		ID:           n.ID,
		Title:        n.Title,
		Message:      n.Message,
		Type:         n.Type,
		ResourceType: n.ResourceType,
		ResourceID:   n.ResourceID,
		IsRead:       n.IsRead,
		CreatedAt:    n.CreatedAt,
	}

	if n.Sender != nil {
		senderResponse := n.Sender.ToResponse()
		response.Sender = &senderResponse
	}

	return response
}

// CreateNotification creates a new notification
func CreateNotification(db interface {
	Create(value interface{}) interface {
		Error() error
	}
}, userID uint, senderID *uint, title, message string, notificationType NotificationType, resourceType string, resourceID uint) error {
	notification := Notification{
		UserID:       userID,
		SenderID:     senderID,
		Title:        title,
		Message:      message,
		Type:         notificationType,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		IsRead:       false,
	}

	return db.Create(&notification).Error()
} 
