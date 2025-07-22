package controllers

import (
	"net/http"
	"nhcommunity/models"
	"nhcommunity/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

// CourseController handles course-related endpoints
type CourseController struct {
	service services.CourseService
}

// NewCourseController creates a new course controller
func NewCourseController(service services.CourseService) *CourseController {
	return &CourseController{service: service}
}

// GetCourses retrieves all courses
func (cc *CourseController) GetCourses(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	courses, err := cc.service.GetCourses(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve courses"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"courses": courses})
}

// GetCourseByID retrieves a single course by its ID
func (cc *CourseController) GetCourseByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}
	course, err := cc.service.GetCourseByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"course": course})
}

// CreateCourse creates a new course
func (cc *CourseController) CreateCourse(c *gin.Context) {
	var req models.CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	course := &models.Course{
		Code:        req.Code,
		Name:        req.Name,
		Department:  req.Department,
		Description: req.Description,
		Credits:     req.Credits,
		Instructor:  req.Instructor,
		Semester:    req.Semester,
		Year:        req.Year,
	}
	newCourse, err := cc.service.CreateCourse(course)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"course": newCourse})
}

// UpdateCourse updates a course
func (cc *CourseController) UpdateCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}
	var req models.UpdateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userRole := "admin" // For now, only admin can update
	updatedCourse, err := cc.service.UpdateCourse(uint(id), &req, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"course": updatedCourse})
}

// DeleteCourse deletes a course
func (cc *CourseController) DeleteCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}
	userRole := "admin" // For now, only admin can delete
	err = cc.service.DeleteCourse(uint(id), userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Course deleted successfully"})
}

// GetCourseReviews retrieves all reviews for a course
func (cc *CourseController) GetCourseReviews(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}
	reviews, err := cc.service.GetCourseReviews(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve reviews"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

// CreateCourseReview creates a new review for a course
func (cc *CourseController) CreateCourseReview(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}
	var req models.CreateCourseReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	review, err := cc.service.CreateCourseReview(uint(courseID), userID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"review": review})
}

// UpdateCourseReview updates a review
func (cc *CourseController) UpdateCourseReview(c *gin.Context) {
	reviewID, err := strconv.ParseUint(c.Param("reviewId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}
	var req models.UpdateCourseReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userRole := "user"
	review, err := cc.service.UpdateCourseReview(uint(reviewID), userID.(uint), &req, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"review": review})
}

// DeleteCourseReview deletes a review
func (cc *CourseController) DeleteCourseReview(c *gin.Context) {
	reviewID, err := strconv.ParseUint(c.Param("reviewId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userRole := "user"
	err = cc.service.DeleteCourseReview(uint(reviewID), userID.(uint), userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Review deleted successfully"})
}
