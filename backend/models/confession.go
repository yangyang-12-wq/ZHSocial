package models

import (
	"time"

	"gorm.io/gorm"
)

// Confession represents an anonymous confession
type Confession struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"not null" json:"user_id"` // Creator ID, but not shown publicly if anonymous
	Content       string    `gorm:"size:5000;not null" json:"content"`
	ImageURL      string    `gorm:"size:500" json:"image_url"`
	IsAnonymous   bool      `gorm:"default:true" json:"is_anonymous"`
	IsApproved    bool      `gorm:"default:false" json:"is_approved"`        // Requires moderation
	Status        string    `gorm:"size:20;default:'pending'" json:"status"` // pending, approved, rejected
	LikesCount    int       `gorm:"default:0" json:"likes_count"`
	CommentsCount int       `gorm:"default:0" json:"comments_count"`
	CreatedAt     time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt     time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	User     User                `gorm:"foreignKey:UserID" json:"user"`
	Comments []ConfessionComment `gorm:"foreignKey:ConfessionID" json:"comments,omitempty"`
	Likes    []ConfessionLike    `gorm:"foreignKey:ConfessionID" json:"likes,omitempty"`
}

// ConfessionComment represents a comment on a confession
type ConfessionComment struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"not null" json:"user_id"`
	ConfessionID uint      `gorm:"not null" json:"confession_id"`
	Content      string    `gorm:"size:1000;not null" json:"content"`
	IsAnonymous  bool      `gorm:"default:true" json:"is_anonymous"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	User       User       `gorm:"foreignKey:UserID" json:"user"`
	Confession Confession `gorm:"foreignKey:ConfessionID" json:"-"`
}

// ConfessionLike represents a like on a confession
type ConfessionLike struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"not null" json:"user_id"`
	ConfessionID uint      `gorm:"not null" json:"confession_id"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`

	// Relationships
	User       User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Confession Confession `gorm:"foreignKey:ConfessionID" json:"-"`
}

// ConfessionResponse is the public confession data
type ConfessionResponse struct {
	ID            uint          `json:"id"`
	Content       string        `json:"content"`
	ImageURL      string        `json:"image_url"`
	IsAnonymous   bool          `json:"is_anonymous"`
	LikesCount    int           `json:"likes_count"`
	CommentsCount int           `json:"comments_count"`
	CreatedAt     time.Time     `json:"created_at"`
	User          *UserResponse `json:"user,omitempty"` // Only included if not anonymous
	IsLiked       bool          `json:"is_liked,omitempty"`
}

// ConfessionCommentResponse is the public comment data
type ConfessionCommentResponse struct {
	ID          uint          `json:"id"`
	Content     string        `json:"content"`
	IsAnonymous bool          `json:"is_anonymous"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	User        *UserResponse `json:"user,omitempty"` // Only included if not anonymous
}

// CreateConfessionRequest represents the request body for creating a confession
type CreateConfessionRequest struct {
	Content     string `json:"content" binding:"required,max=5000"`
	ImageURL    string `json:"image_url" binding:"omitempty,url"`
	IsAnonymous bool   `json:"is_anonymous"`
}

// UpdateConfessionRequest represents the request body for updating a confession status
type UpdateConfessionRequest struct {
	Status     string `json:"status" binding:"omitempty,oneof=approved rejected"`
	IsApproved *bool  `json:"is_approved" binding:"omitempty"`
}

// ConfessionCommentRequest represents the request body for creating a comment
type ConfessionCommentRequest struct {
	Content     string `json:"content" binding:"required,max=1000"`
	IsAnonymous bool   `json:"is_anonymous"`
}

// ToResponse converts a confession to a response
func (c *Confession) ToResponse(currentUserID uint) ConfessionResponse {
	isLiked := false

	// Check if the current user liked this confession
	for _, like := range c.Likes {
		if like.UserID == currentUserID {
			isLiked = true
			break
		}
	}

	response := ConfessionResponse{
		ID:            c.ID,
		Content:       c.Content,
		ImageURL:      c.ImageURL,
		IsAnonymous:   c.IsAnonymous,
		LikesCount:    c.LikesCount,
		CommentsCount: c.CommentsCount,
		CreatedAt:     c.CreatedAt,
		IsLiked:       isLiked,
	}

	// Only include user info if not anonymous
	if !c.IsAnonymous {
		userResponse := c.User.ToResponse()
		response.User = &userResponse
	}

	return response
}

// ToResponse converts a confession comment to a response
func (c *ConfessionComment) ToResponse() ConfessionCommentResponse {
	response := ConfessionCommentResponse{
		ID:          c.ID,
		Content:     c.Content,
		IsAnonymous: c.IsAnonymous,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}

	// Only include user info if not anonymous
	if !c.IsAnonymous {
		userResponse := c.User.ToResponse()
		response.User = &userResponse
	}

	return response
}

// AfterCreate is a GORM hook that runs after creating a comment
func (c *ConfessionComment) AfterCreate(tx *gorm.DB) error {
	// Increment comment count on the confession
	return tx.Model(&Confession{}).Where("id = ?", c.ConfessionID).
		UpdateColumn("comments_count", gorm.Expr("comments_count + ?", 1)).Error
}

// AfterDelete is a GORM hook that runs after deleting a comment
func (c *ConfessionComment) AfterDelete(tx *gorm.DB) error {
	// Decrement comment count on the confession
	return tx.Model(&Confession{}).Where("id = ?", c.ConfessionID).
		UpdateColumn("comments_count", gorm.Expr("comments_count - ?", 1)).Error
}

// AfterCreate is a GORM hook that runs after creating a like
func (l *ConfessionLike) AfterCreate(tx *gorm.DB) error {
	// Increment like count on the confession
	return tx.Model(&Confession{}).Where("id = ?", l.ConfessionID).
		UpdateColumn("likes_count", gorm.Expr("likes_count + ?", 1)).Error
}

// AfterDelete is a GORM hook that runs after deleting a like
func (l *ConfessionLike) AfterDelete(tx *gorm.DB) error {
	// Decrement like count on the confession
	return tx.Model(&Confession{}).Where("id = ?", l.ConfessionID).
		UpdateColumn("likes_count", gorm.Expr("likes_count - ?", 1)).Error
}
