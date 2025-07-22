package models

import (
	"errors"
	"html"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"size:50;not null;unique" json:"username"`
	Email        string    `gorm:"size:100;not null;unique" json:"email"`
	Password     string    `gorm:"size:100;not null" json:"-"`
	FullName     string    `gorm:"size:100" json:"full_name"`
	StudentId    string    `gorm:"size:50;unique" json:"student_id,omitempty"`
	AvatarURL    string    `gorm:"size:255" json:"avatar_url"`
	Bio          string    `gorm:"size:500" json:"bio"`
	Role         string    `gorm:"size:20;default:'user'" json:"role"` // user, admin, moderator
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	RefreshToken string    `gorm:"size:500" json:"-"` // 增加长度到500
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	Posts         []Post         `gorm:"foreignKey:UserID" json:"-"`
	Comments      []Comment      `gorm:"foreignKey:UserID" json:"-"`
	Events        []Event        `gorm:"foreignKey:CreatorID" json:"-"`
	Confessions   []Confession   `gorm:"foreignKey:UserID" json:"-"`
	Marketplace   []Marketplace  `gorm:"foreignKey:SellerID" json:"-"`
	LostFound     []LostFound    `gorm:"foreignKey:UserID" json:"-"`
	Likes         []Like         `gorm:"foreignKey:UserID" json:"-"`
	Notifications []Notification `gorm:"foreignKey:UserID" json:"-"`
	Followers     []User         `gorm:"many2many:user_follows;foreignKey:ID;joinForeignKey:FollowingID;References:ID;joinReferences:FollowerID" json:"-"`
	Following     []User         `gorm:"many2many:user_follows;foreignKey:ID;joinForeignKey:FollowerID;References:ID;joinReferences:FollowingID" json:"-"`
}

// UserResponse is the public user data without sensitive info
type UserResponse struct {
	ID             uint      `json:"id"`
	Username       string    `json:"username"`
	Email          string    `json:"email"`
	FullName       string    `json:"full_name"`
	AvatarURL      string    `json:"avatar_url"`
	Bio            string    `json:"bio"`
	Role           string    `json:"role"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	FollowerCount  int       `json:"followerCount"`
	FollowingCount int       `json:"followingCount"`
	IsFollowing    bool      `json:"isFollowing,omitempty"`
}

// RegisterRequest represents the request body for user registration
type RegisterRequest struct {
	Username  string `json:"username" binding:"required,min=3,max=50"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FullName  string `json:"full_name"`
	StudentId string `json:"studentId"`
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// UpdateUserRequest represents the request body for updating a user
type UpdateUserRequest struct {
	FullName  string `json:"full_name"`
	AvatarURL string `json:"avatar_url"`
	Bio       string `json:"bio"`
	Password  string `json:"password"`
}

// AuthResponse represents the response for authentication endpoints
type AuthResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

// HashPassword creates a bcrypt hash of the password
func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword compares the provided password against the stored hash
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// BeforeSave is a GORM hook that runs before saving the user
func (u *User) BeforeSave(*gorm.DB) error {
	// Sanitize inputs
	u.Username = html.EscapeString(strings.TrimSpace(u.Username))
	u.Email = html.EscapeString(strings.TrimSpace(u.Email))
	u.FullName = html.EscapeString(strings.TrimSpace(u.FullName))
	u.Bio = html.EscapeString(strings.TrimSpace(u.Bio))

	// Validate required fields
	if u.Username == "" {
		return errors.New("username is required")
	}
	if u.Email == "" {
		return errors.New("email is required")
	}
	if u.Password == "" && u.ID == 0 {
		return errors.New("password is required for new users")
	}

	return nil
}

// ToResponse converts a user to a user response (public data)
func (u *User) ToResponse(currentUserID ...uint) UserResponse {
	isFollowing := false
	if len(currentUserID) > 0 && currentUserID[0] != 0 {
		for _, follower := range u.Followers {
			if follower.ID == currentUserID[0] {
				isFollowing = true
				break
			}
		}
	}

	return UserResponse{
		ID:             u.ID,
		Username:       u.Username,
		Email:          u.Email,
		FullName:       u.FullName,
		AvatarURL:      u.AvatarURL,
		Bio:            u.Bio,
		Role:           u.Role,
		IsActive:       u.IsActive,
		CreatedAt:      u.CreatedAt,
		FollowerCount:  len(u.Followers),
		FollowingCount: len(u.Following),
		IsFollowing:    isFollowing,
	}
}
