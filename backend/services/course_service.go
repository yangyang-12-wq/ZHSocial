package services

import (
	"errors"
	"nhcommunity/models"
	"nhcommunity/repositories"
)

// CourseService defines the interface for course business logic
type CourseService interface {
	GetCourses(limit, offset int) ([]models.CourseResponse, error)
	GetCourseByID(id uint) (*models.Course, error)
	CreateCourse(course *models.Course) (*models.CourseResponse, error)
	UpdateCourse(id uint, req *models.UpdateCourseRequest, userRole string) (*models.CourseResponse, error)
	DeleteCourse(id uint, userRole string) error

	GetCourseReviews(courseID uint) ([]models.CourseReviewResponse, error)
	CreateCourseReview(courseID, userID uint, req *models.CreateCourseReviewRequest) (*models.CourseReviewResponse, error)
	UpdateCourseReview(reviewID, userID uint, req *models.UpdateCourseReviewRequest, userRole string) (*models.CourseReviewResponse, error)
	DeleteCourseReview(reviewID, userID uint, userRole string) error
}

type courseService struct {
	repo repositories.CourseRepository
}

// NewCourseService creates a new instance of CourseService
func NewCourseService(repo repositories.CourseRepository) CourseService {
	return &courseService{repo: repo}
}

func (s *courseService) GetCourses(limit, offset int) ([]models.CourseResponse, error) {
	courses, err := s.repo.FindAll(limit, offset)
	if err != nil {
		return nil, err
	}
	var responses []models.CourseResponse
	for _, c := range courses {
		responses = append(responses, c.ToResponse())
	}
	return responses, nil
}

func (s *courseService) GetCourseByID(id uint) (*models.Course, error) {
	return s.repo.FindByID(id)
}

func (s *courseService) CreateCourse(course *models.Course) (*models.CourseResponse, error) {
	newCourse, err := s.repo.Create(course)
	if err != nil {
		return nil, err
	}
	response := newCourse.ToResponse()
	return &response, nil
}

func (s *courseService) UpdateCourse(id uint, req *models.UpdateCourseRequest, userRole string) (*models.CourseResponse, error) {
	if userRole != "admin" {
		return nil, errors.New("permission denied")
	}
	course, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if req.Code != "" {
		course.Code = req.Code
	}
	if req.Name != "" {
		course.Name = req.Name
	}
	if req.Department != "" {
		course.Department = req.Department
	}
	if req.Description != "" {
		course.Description = req.Description
	}
	if req.Credits != nil {
		course.Credits = *req.Credits
	}
	if req.Instructor != "" {
		course.Instructor = req.Instructor
	}
	if req.Semester != "" {
		course.Semester = req.Semester
	}
	if req.Year != nil {
		course.Year = *req.Year
	}
	updatedCourse, err := s.repo.Update(course)
	if err != nil {
		return nil, err
	}
	response := updatedCourse.ToResponse()
	return &response, nil
}

func (s *courseService) DeleteCourse(id uint, userRole string) error {
	if userRole != "admin" {
		return errors.New("permission denied")
	}
	course, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(course)
}

func (s *courseService) GetCourseReviews(courseID uint) ([]models.CourseReviewResponse, error) {
	reviews, err := s.repo.FindReviewsByCourseID(courseID)
	if err != nil {
		return nil, err
	}
	var responses []models.CourseReviewResponse
	for _, r := range reviews {
		responses = append(responses, r.ToResponse())
	}
	return responses, nil
}

func (s *courseService) CreateCourseReview(courseID, userID uint, req *models.CreateCourseReviewRequest) (*models.CourseReviewResponse, error) {
	review := &models.CourseReview{
		CourseID:    courseID,
		UserID:      userID,
		Rating:      req.Rating,
		Difficulty:  req.Difficulty,
		Workload:    req.Workload,
		Comment:     req.Comment,
		IsAnonymous: req.IsAnonymous,
		Semester:    req.Semester,
		Year:        req.Year,
	}
	newReview, err := s.repo.CreateReview(review)
	if err != nil {
		return nil, err
	}
	response := newReview.ToResponse()
	return &response, nil
}

func (s *courseService) UpdateCourseReview(reviewID, userID uint, req *models.UpdateCourseReviewRequest, userRole string) (*models.CourseReviewResponse, error) {
	review, err := s.repo.FindReviewByID(reviewID)
	if err != nil {
		return nil, errors.New("review not found")
	}

	if review.UserID != userID && userRole != "admin" {
		return nil, errors.New("permission denied")
	}

	if req.Rating != nil {
		review.Rating = *req.Rating
	}
	if req.Difficulty != nil {
		review.Difficulty = *req.Difficulty
	}
	if req.Workload != nil {
		review.Workload = *req.Workload
	}
	if req.Comment != "" {
		review.Comment = req.Comment
	}
	if req.IsAnonymous != nil {
		review.IsAnonymous = *req.IsAnonymous
	}
	if req.Semester != "" {
		review.Semester = req.Semester
	}
	if req.Year != nil {
		review.Year = *req.Year
	}
	updatedReview, err := s.repo.UpdateReview(review)
	if err != nil {
		return nil, err
	}
	response := updatedReview.ToResponse()
	return &response, nil
}

func (s *courseService) DeleteCourseReview(reviewID, userID uint, userRole string) error {
	review, err := s.repo.FindReviewByID(reviewID)
	if err != nil {
		return errors.New("review not found")
	}

	if review.UserID != userID && userRole != "admin" {
		return errors.New("permission denied")
	}

	return s.repo.DeleteReview(review)
}
