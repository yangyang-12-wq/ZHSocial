package models

import (
	"time"
)

// Marketplace represents a marketplace listing
type Marketplace struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"size:200;not null" json:"title"`
	Description string    `gorm:"size:5000;not null" json:"description"`
	Price       float64   `gorm:"not null" json:"price"`
	ImageURLs   string    `gorm:"size:1000" json:"image_urls"` // Comma-separated list of image URLs
	Category    string    `gorm:"size:100;not null" json:"category"`
	Condition   string    `gorm:"size:50;not null" json:"condition"` // new, like_new, good, fair, poor
	SellerID    uint      `gorm:"not null" json:"seller_id"`
	Status      string    `gorm:"size:20;default:'active'" json:"status"` // active, sold, reserved, deleted
	Location    string    `gorm:"size:200" json:"location"`
	Views       int       `gorm:"default:0" json:"views"`
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	Seller User `gorm:"foreignKey:SellerID" json:"seller"`
}

// CreateListingRequest represents the request body for creating a listing
type CreateListingRequest struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description" binding:"required"`
	Price       float64 `json:"price" binding:"required"`
	ImageURLs   string  `json:"image_urls"`
	Category    string  `json:"category" binding:"required"`
	Condition   string  `json:"condition" binding:"required"`
	Location    string  `json:"location"`
}

// UpdateListingRequest represents the request body for updating a listing
type UpdateListingRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Price       *float64 `json:"price"`
	ImageURLs   string   `json:"image_urls"`
	Category    string   `json:"category"`
	Condition   string   `json:"condition"`
	Status      string   `json:"status"`
	Location    string   `json:"location"`
}

// MarketplaceResponse is the public marketplace listing data with seller info
type MarketplaceResponse struct {
	ID          uint         `json:"id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Price       float64      `json:"price"`
	ImageURLs   string       `json:"image_urls"`
	Category    string       `json:"category"`
	Condition   string       `json:"condition"`
	Status      string       `json:"status"`
	Location    string       `json:"location"`
	Views       int          `json:"views"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	Seller      UserResponse `json:"seller"`
}

// MarketplaceCategory represents a category for marketplace listings
type MarketplaceCategory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:100;not null;unique" json:"name"`
	IconURL   string    `gorm:"size:255" json:"icon_url"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null" json:"updated_at"`
}

// ToResponse converts a marketplace listing to a response
func (m *Marketplace) ToResponse() MarketplaceResponse {
	return MarketplaceResponse{
		ID:          m.ID,
		Title:       m.Title,
		Description: m.Description,
		Price:       m.Price,
		ImageURLs:   m.ImageURLs,
		Category:    m.Category,
		Condition:   m.Condition,
		Status:      m.Status,
		Location:    m.Location,
		Views:       m.Views,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
		Seller:      m.Seller.ToResponse(),
	}
}

// IncrementViews increments the view count for a marketplace listing
func (m *Marketplace) IncrementViews(db interface {
	Model(interface{}) interface {
		UpdateColumn(string, interface{}) interface {
			Error() error
		}
	}
}) error {
	return db.Model(m).UpdateColumn("views", m.Views+1).Error()
}
