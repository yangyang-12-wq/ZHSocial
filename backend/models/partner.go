package models

import (
	"time"

	"gorm.io/gorm"
)

// Partner represents a user looking for others for an activity.
type Partner struct {
	ID                  string         `gorm:"type:char(36);primaryKey" json:"id"`
	Title               string         `gorm:"type:varchar(255);not null" json:"title"`
	Description         string         `gorm:"type:text" json:"description"`
	Category            string         `gorm:"type:varchar(100);index" json:"category"`
	Type                string         `gorm:"type:varchar(100);index" json:"type"`
	Status              string         `gorm:"type:varchar(50);default:'open'" json:"status"` // e.g., open, closed, completed
	Location            string         `gorm:"type:varchar(255)" json:"location,omitempty"`
	TimePreference      string         `gorm:"type:varchar(255)" json:"timePreference,omitempty"`
	MaxParticipants     int            `gorm:"default:2" json:"maxParticipants"`
	CurrentParticipants int            `gorm:"default:1" json:"currentParticipants"`
	AuthorID            string         `gorm:"type:char(36);not null" json:"authorId"`
	ExpiresAt           *time.Time     `json:"expiresAt,omitempty"`
	CreatedAt           time.Time      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt           time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`

	Author       User         `gorm:"foreignKey:AuthorID" json:"author"`
	Participants []User       `gorm:"many2many:partner_participants;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"participants"`
	Tags         []PartnerTag `gorm:"foreignKey:PartnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"tags"`
}

// PartnerTag represents a tag associated with a partner post.
type PartnerTag struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	PartnerID string `gorm:"type:char(36);not null;index" json:"partnerId"`
	Tag       string `gorm:"type:varchar(50);not null;index" json:"tag"`
}

// CreatePartnerRequest defines the request body for creating a partner.
type CreatePartnerRequest struct {
	Title           string     `json:"title" binding:"required"`
	Description     string     `json:"description"`
	Category        string     `json:"category" binding:"required"`
	Type            string     `json:"type" binding:"required"`
	Location        string     `json:"location"`
	TimePreference  string     `json:"timePreference"`
	MaxParticipants int        `json:"maxParticipants" binding:"gte=2"`
	ExpiresAt       *time.Time `json:"expiresAt"`
	Tags            []string   `json:"tags"`
}

// UpdatePartnerRequest defines the request body for updating a partner.
type UpdatePartnerRequest struct {
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Category        string     `json:"category"`
	Type            string     `json:"type"`
	Status          string     `json:"status"`
	Location        string     `json:"location"`
	TimePreference  string     `json:"timePreference"`
	MaxParticipants int        `json:"maxParticipants"`
	ExpiresAt       *time.Time `json:"expiresAt"`
	Tags            []string   `json:"tags"`
}

// PartnerResponse defines a simplified partner structure for API responses.
type PartnerResponse struct {
	ID                  string       `json:"id"`
	Title               string       `json:"title"`
	Description         string       `json:"description"`
	Category            string       `json:"category"`
	Type                string       `json:"type"`
	Status              string       `json:"status"`
	Location            string       `json:"location,omitempty"`
	TimePreference      string       `json:"timePreference,omitempty"`
	MaxParticipants     int          `json:"maxParticipants"`
	CurrentParticipants int          `json:"currentParticipants"`
	Author              UserResponse `json:"author"`
	ExpiresAt           *time.Time   `json:"expiresAt,omitempty"`
	CreatedAt           time.Time    `json:"createdAt"`
	Tags                []string     `json:"tags"`
	MatchScore          float64      `json:"matchScore,omitempty"` // For recommendation
}

// ToResponse converts a Partner model to a PartnerResponse.
func (p *Partner) ToResponse() PartnerResponse {
	tags := make([]string, len(p.Tags))
	for i, t := range p.Tags {
		tags[i] = t.Tag
	}

	return PartnerResponse{
		ID:                  p.ID,
		Title:               p.Title,
		Description:         p.Description,
		Category:            p.Category,
		Type:                p.Type,
		Status:              p.Status,
		Location:            p.Location,
		TimePreference:      p.TimePreference,
		MaxParticipants:     p.MaxParticipants,
		CurrentParticipants: p.CurrentParticipants,
		Author:              p.Author.ToResponse(),
		ExpiresAt:           p.ExpiresAt,
		CreatedAt:           p.CreatedAt,
		Tags:                tags,
	}
}

// TableName returns the table name for the Partner model.
func (Partner) TableName() string {
	return "partners"
}

// TableName returns the table name for the PartnerTag model.
func (PartnerTag) TableName() string {
	return "partner_tags"
}
