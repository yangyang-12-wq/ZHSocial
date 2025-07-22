package models

import (
	"time"

	"gorm.io/gorm"
)

// Course represents an academic course
type Course struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Code        string    `gorm:"size:50;not null;unique" json:"code"`
	Name        string    `gorm:"size:200;not null" json:"name"`
	Department  string    `gorm:"size:100;not null" json:"department"`
	Description string    `gorm:"size:5000" json:"description"`
	Credits     float64   `gorm:"not null" json:"credits"`
	Instructor  string    `gorm:"size:200" json:"instructor"`
	Semester    string    `gorm:"size:50" json:"semester"` // Fall, Spring, Summer
	Year        int       `gorm:"not null" json:"year"`
	Rating      float64   `gorm:"default:0" json:"rating"`
	RatingCount int       `gorm:"default:0" json:"rating_count"`
	Difficulty  float64   `gorm:"default:0" json:"difficulty"`
	Workload    float64   `gorm:"default:0" json:"workload"`
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	Reviews []CourseReview `gorm:"foreignKey:CourseID" json:"reviews,omitempty"`
}

// CourseReview represents a review for a course
type CourseReview struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CourseID    uint      `gorm:"not null" json:"course_id"`
	UserID      uint      `gorm:"not null" json:"user_id"`
	Rating      float64   `gorm:"not null" json:"rating"`     // 1-5
	Difficulty  float64   `gorm:"not null" json:"difficulty"` // 1-5
	Workload    float64   `gorm:"not null" json:"workload"`   // 1-5 (light to heavy)
	Comment     string    `gorm:"size:2000" json:"comment"`
	IsAnonymous bool      `gorm:"default:true" json:"is_anonymous"`
	Semester    string    `gorm:"size:50" json:"semester"`
	Year        int       `json:"year"`
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`

	// Relationships
	User   User   `gorm:"foreignKey:UserID" json:"user"`
	Course Course `gorm:"foreignKey:CourseID" json:"-"`
}

// CourseResponse is the public course data
type CourseResponse struct {
	ID          uint      `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Department  string    `json:"department"`
	Description string    `json:"description"`
	Credits     float64   `json:"credits"`
	Instructor  string    `json:"instructor"`
	Semester    string    `json:"semester"`
	Year        int       `json:"year"`
	Rating      float64   `json:"rating"`
	RatingCount int       `json:"rating_count"`
	Difficulty  float64   `json:"difficulty"`
	Workload    float64   `json:"workload"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CourseReviewResponse is the public review data
type CourseReviewResponse struct {
	ID          uint          `json:"id"`
	Rating      float64       `json:"rating"`
	Difficulty  float64       `json:"difficulty"`
	Workload    float64       `json:"workload"`
	Comment     string        `json:"comment"`
	IsAnonymous bool          `json:"is_anonymous"`
	Semester    string        `json:"semester"`
	Year        int           `json:"year"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	User        *UserResponse `json:"user,omitempty"` // Only included if not anonymous
}

// CreateCourseRequest represents the request body for creating a course
type CreateCourseRequest struct {
	Code        string  `json:"code" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Department  string  `json:"department" binding:"required"`
	Description string  `json:"description"`
	Credits     float64 `json:"credits" binding:"required"`
	Instructor  string  `json:"instructor"`
	Semester    string  `json:"semester"`
	Year        int     `json:"year"`
}

// UpdateCourseRequest represents the request body for updating a course
type UpdateCourseRequest struct {
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	Department  string   `json:"department"`
	Description string   `json:"description"`
	Credits     *float64 `json:"credits"`
	Instructor  string   `json:"instructor"`
	Semester    string   `json:"semester"`
	Year        *int     `json:"year"`
}

// CreateCourseReviewRequest represents the request body for creating a course review
type CreateCourseReviewRequest struct {
	Rating      float64 `json:"rating" binding:"required,min=1,max=5"`
	Difficulty  float64 `json:"difficulty" binding:"required,min=1,max=5"`
	Workload    float64 `json:"workload" binding:"required,min=1,max=5"`
	Comment     string  `json:"comment"`
	IsAnonymous bool    `json:"is_anonymous"`
	Semester    string  `json:"semester" binding:"required"`
	Year        int     `json:"year" binding:"required"`
}

// UpdateCourseReviewRequest represents the request body for updating a course review
type UpdateCourseReviewRequest struct {
	Rating      *float64 `json:"rating,omitempty"`
	Difficulty  *float64 `json:"difficulty,omitempty"`
	Workload    *float64 `json:"workload,omitempty"`
	Comment     string   `json:"comment,omitempty"`
	IsAnonymous *bool    `json:"is_anonymous,omitempty"`
	Semester    string   `json:"semester,omitempty"`
	Year        *int     `json:"year,omitempty"`
	CourseID    uint     `json:"course_id,omitempty"`
}

// ToResponse converts a course to a response
func (c *Course) ToResponse() CourseResponse {
	return CourseResponse{
		ID:          c.ID,
		Code:        c.Code,
		Name:        c.Name,
		Department:  c.Department,
		Description: c.Description,
		Credits:     c.Credits,
		Instructor:  c.Instructor,
		Semester:    c.Semester,
		Year:        c.Year,
		Rating:      c.Rating,
		RatingCount: c.RatingCount,
		Difficulty:  c.Difficulty,
		Workload:    c.Workload,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}
}

// ToResponse converts a review to a response
func (r *CourseReview) ToResponse() CourseReviewResponse {
	response := CourseReviewResponse{
		ID:          r.ID,
		Rating:      r.Rating,
		Difficulty:  r.Difficulty,
		Workload:    r.Workload,
		Comment:     r.Comment,
		IsAnonymous: r.IsAnonymous,
		Semester:    r.Semester,
		Year:        r.Year,
		CreatedAt:   r.CreatedAt,
		UpdatedAt:   r.UpdatedAt,
	}

	// Only include user info if not anonymous
	if !r.IsAnonymous {
		userResponse := r.User.ToResponse()
		response.User = &userResponse
	}

	return response
}

// AfterCreate is a GORM hook that runs after creating a review
func (r *CourseReview) AfterCreate(tx *gorm.DB) error {
	// Update the course rating, difficulty and workload
	var course Course
	if err := tx.First(&course, r.CourseID).Error; err != nil {
		return err
	}

	// Calculate new average rating
	newRatingCount := course.RatingCount + 1
	newRating := (course.Rating*float64(course.RatingCount) + r.Rating) / float64(newRatingCount)
	newDifficulty := (course.Difficulty*float64(course.RatingCount) + r.Difficulty) / float64(newRatingCount)
	newWorkload := (course.Workload*float64(course.RatingCount) + r.Workload) / float64(newRatingCount)

	// Update the course
	return tx.Model(&course).Updates(map[string]interface{}{
		"rating":       newRating,
		"difficulty":   newDifficulty,
		"workload":     newWorkload,
		"rating_count": newRatingCount,
	}).Error
}

// BeforeDelete is a GORM hook that runs before deleting a review
func (r *CourseReview) BeforeDelete(tx *gorm.DB) error {
	// Update the course rating, difficulty and workload
	var course Course
	if err := tx.First(&course, r.CourseID).Error; err != nil {
		return err
	}

	// If this is the only review, reset ratings
	if course.RatingCount <= 1 {
		return tx.Model(&course).Updates(map[string]interface{}{
			"rating":       0,
			"difficulty":   0,
			"workload":     0,
			"rating_count": 0,
		}).Error
	}

	// Calculate new average rating
	newRatingCount := course.RatingCount - 1
	newRating := (course.Rating*float64(course.RatingCount) - r.Rating) / float64(newRatingCount)
	newDifficulty := (course.Difficulty*float64(course.RatingCount) - r.Difficulty) / float64(newRatingCount)
	newWorkload := (course.Workload*float64(course.RatingCount) - r.Workload) / float64(newRatingCount)

	// Update the course
	return tx.Model(&course).Updates(map[string]interface{}{
		"rating":       newRating,
		"difficulty":   newDifficulty,
		"workload":     newWorkload,
		"rating_count": newRatingCount,
	}).Error
}
