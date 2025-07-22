package models

import (
	"time"
)

// LostFound represents a lost or found item
type LostFound struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"size:200;not null" json:"title"`
	Description string    `gorm:"size:5000;not null" json:"description"`
	Type        string    `gorm:"size:20;not null" json:"type"` // lost, found
	Category    string    `gorm:"size:100;not null" json:"category"`
	ImageURLs   string    `gorm:"size:1000" json:"image_urls"` // Comma-separated list of image URLs
	Location    string    `gorm:"size:500" json:"location"`
	Date        time.Time `gorm:"not null" json:"date"`                   // Date when the item was lost or found
	Status      string    `gorm:"size:20;default:'active'" json:"status"` // active, resolved, expired
	UserID      uint      `gorm:"not null" json:"user_id"`
	Contact     string    `gorm:"size:200" json:"contact"` // Contact information
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"user"`
}

// LostFoundResponse is the public lost & found item data with user info
type LostFoundResponse struct {
	ID          uint         `json:"id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Type        string       `json:"type"`
	Category    string       `json:"category"`
	ImageURLs   string       `json:"image_urls"`
	Location    string       `json:"location"`
	Date        time.Time    `json:"date"`
	Status      string       `json:"status"`
	Contact     string       `json:"contact"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	User        UserResponse `json:"user"`
}

// LostFoundCategory represents a category for lost & found items
type LostFoundCategory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:100;not null;unique" json:"name"`
	IconURL   string    `gorm:"size:255" json:"icon_url"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null" json:"updated_at"`
}

// CreateItemRequest represents the request body for creating a lost and found item
type CreateItemRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description" binding:"required"`
	Type        string    `json:"type" binding:"required"`
	Category    string    `json:"category" binding:"required"`
	ImageURLs   string    `json:"image_urls"`
	Location    string    `json:"location"`
	Date        time.Time `json:"date" binding:"required"`
	Contact     string    `json:"contact"`
}

// UpdateItemRequest represents the request body for updating a lost and found item
type UpdateLostFoundRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	Category    string    `json:"category"`
	ImageURLs   string    `json:"image_urls"`
	Location    string    `json:"location"`
	Date        time.Time `json:"date"`
	Status      string    `json:"status"`
	Contact     string    `json:"contact"`
}

// ToResponse converts a lost & found item to a response
func (lf *LostFound) ToResponse() LostFoundResponse {
	return LostFoundResponse{
		ID:          lf.ID,
		Title:       lf.Title,
		Description: lf.Description,
		Type:        lf.Type,
		Category:    lf.Category,
		ImageURLs:   lf.ImageURLs,
		Location:    lf.Location,
		Date:        lf.Date,
		Status:      lf.Status,
		Contact:     lf.Contact,
		CreatedAt:   lf.CreatedAt,
		UpdatedAt:   lf.UpdatedAt,
		User:        lf.User.ToResponse(),
	}
}
