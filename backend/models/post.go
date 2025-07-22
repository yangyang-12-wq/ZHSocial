package models

import (
	"time"

	"gorm.io/gorm"
)

// Post represents a post/moment in the community
type Post struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"not null;index" json:"user_id"`
	Title         string    `gorm:"size:255;not null" json:"title"`
	Content       string    `gorm:"size:5000;not null" json:"content"`
	ImageURLs     string    `gorm:"size:1000" json:"image_urls"`                // Comma-separated list of image URLs
	Visibility    string    `gorm:"size:20;default:'public'" json:"visibility"` // public, private, friends
	LikesCount    int       `gorm:"default:0" json:"likes_count"`
	CommentsCount int       `gorm:"default:0" json:"comments_count"`
	CreatedAt     time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt     time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	User     User      `gorm:"foreignKey:UserID" json:"user"`
	Comments []Comment `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"comments,omitempty"`
	Likes    []Like    `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"likes,omitempty"`
}

// PostResponse is the public post data with user info
type PostResponse struct {
	ID            uint         `json:"id"`
	Title         string       `json:"title"`
	Content       string       `json:"content"`
	ImageURLs     string       `json:"image_urls"`
	Visibility    string       `json:"visibility"`
	LikesCount    int          `json:"likes_count"`
	CommentsCount int          `json:"comments_count"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
	User          UserResponse `json:"user"`
	IsLiked       bool         `json:"is_liked,omitempty"`
}

// CreatePostRequest represents the request body for creating a post
type CreatePostRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
}

// UpdatePostRequest represents the request body for updating a post
type UpdatePostRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// CreateCommentRequest represents the request body for creating a comment
type CreateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

// Like represents a like on a post
type Like struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_user_post" json:"user_id"`
	PostID    uint      `gorm:"not null;uniqueIndex:idx_user_post" json:"post_id"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	Post Post `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"post,omitempty"`
}

// Comment represents a comment on a post
type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	PostID    uint      `gorm:"not null;index" json:"post_id"`
	Content   string    `gorm:"size:1000;not null" json:"content"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user"`
	Post Post `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

// CommentResponse is the public comment data with user info
type CommentResponse struct {
	ID        uint         `json:"id"`
	Content   string       `json:"content"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
	User      UserResponse `json:"user"`
}

// ToResponse converts a post to a post response
func (p *Post) ToResponse(currentUserID uint) PostResponse {
	isLiked := false

	// Check if the current user liked this post
	for _, like := range p.Likes {
		if like.UserID == currentUserID {
			isLiked = true
			break
		}
	}

	return PostResponse{
		ID:            p.ID,
		Title:         p.Title,
		Content:       p.Content,
		ImageURLs:     p.ImageURLs,
		Visibility:    p.Visibility,
		LikesCount:    p.LikesCount,
		CommentsCount: p.CommentsCount,
		CreatedAt:     p.CreatedAt,
		UpdatedAt:     p.UpdatedAt,
		User:          p.User.ToResponse(),
		IsLiked:       isLiked,
	}
}

// ToResponse converts a comment to a comment response
func (c *Comment) ToResponse() CommentResponse {
	return CommentResponse{
		ID:        c.ID,
		Content:   c.Content,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
		User:      c.User.ToResponse(),
	}
}

// AfterCreate is a GORM hook that runs after creating a comment
func (c *Comment) AfterCreate(tx *gorm.DB) error {
	// Increment comment count on the post
	return tx.Model(&Post{}).Where("id = ?", c.PostID).
		UpdateColumn("comments_count", gorm.Expr("comments_count + ?", 1)).Error
}

// AfterDelete is a GORM hook that runs after deleting a comment
func (c *Comment) AfterDelete(tx *gorm.DB) error {
	// Decrement comment count on the post
	return tx.Model(&Post{}).Where("id = ?", c.PostID).
		UpdateColumn("comments_count", gorm.Expr("comments_count - ?", 1)).Error
}

// AfterCreate is a GORM hook that runs after creating a like
func (l *Like) AfterCreate(tx *gorm.DB) error {
	// Increment like count on the post
	return tx.Model(&Post{}).Where("id = ?", l.PostID).
		UpdateColumn("likes_count", gorm.Expr("likes_count + ?", 1)).Error
}

// AfterDelete is a GORM hook that runs after deleting a like
func (l *Like) AfterDelete(tx *gorm.DB) error {
	// Decrement like count on the post
	return tx.Model(&Post{}).Where("id = ?", l.PostID).
		UpdateColumn("likes_count", gorm.Expr("likes_count - ?", 1)).Error
}
