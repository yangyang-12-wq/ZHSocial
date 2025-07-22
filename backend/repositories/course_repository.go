package repositories

import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

// CourseRepository defines the interface for course data operations
type CourseRepository interface {
	FindAll(limit, offset int) ([]models.Course, error)
	FindByID(id uint) (*models.Course, error)
	Create(course *models.Course) (*models.Course, error)
	Update(course *models.Course) (*models.Course, error)
	Delete(course *models.Course) error

	FindReviewByID(id uint) (*models.CourseReview, error)
	FindReviewsByCourseID(courseID uint) ([]models.CourseReview, error)
	CreateReview(review *models.CourseReview) (*models.CourseReview, error)
	UpdateReview(review *models.CourseReview) (*models.CourseReview, error)
	DeleteReview(review *models.CourseReview) error
}

type courseRepository struct {
	db *gorm.DB
}

// NewCourseRepository creates a new instance of CourseRepository
func NewCourseRepository(db *gorm.DB) CourseRepository {
	return &courseRepository{db: db}
}

func (r *courseRepository) FindAll(limit, offset int) ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Limit(limit).Offset(offset).Order("rating desc").Find(&courses).Error
	return courses, err
}

func (r *courseRepository) FindByID(id uint) (*models.Course, error) {
	var course models.Course
	err := r.db.Preload("Reviews.User").First(&course, id).Error
	if err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *courseRepository) Create(course *models.Course) (*models.Course, error) {
	err := r.db.Create(course).Error
	return course, err
}

func (r *courseRepository) Update(course *models.Course) (*models.Course, error) {
	err := r.db.Save(course).Error
	return course, err
}

func (r *courseRepository) Delete(course *models.Course) error {
	return r.db.Delete(course).Error
}

func (r *courseRepository) FindReviewByID(id uint) (*models.CourseReview, error) {
	var review models.CourseReview
	err := r.db.First(&review, id).Error
	return &review, err
}

func (r *courseRepository) FindReviewsByCourseID(courseID uint) ([]models.CourseReview, error) {
	var reviews []models.CourseReview
	err := r.db.Where("course_id = ?", courseID).Preload("User").Find(&reviews).Error
	return reviews, err
}

func (r *courseRepository) CreateReview(review *models.CourseReview) (*models.CourseReview, error) {
	err := r.db.Create(review).Error
	return review, err
}

func (r *courseRepository) UpdateReview(review *models.CourseReview) (*models.CourseReview, error) {
	err := r.db.Save(review).Error
	return review, err
}

func (r *courseRepository) DeleteReview(review *models.CourseReview) error {
	return r.db.Delete(review).Error
}
