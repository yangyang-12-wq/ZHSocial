package controllers

import (
	"net/http"
	"nhcommunity/models"
	"nhcommunity/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

// EventController handles event-related endpoints
type EventController struct {
	service services.EventService
}

// NewEventController creates a new event controller
func NewEventController(service services.EventService) *EventController {
	return &EventController{service: service}
}

// GetEvents retrieves all events
func (ec *EventController) GetEvents(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	events, err := ec.service.GetEvents(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve events"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"events": events})
}

// GetEventByID retrieves a single event by its ID
func (ec *EventController) GetEventByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}
	userID, _ := c.Get("user_id")
	currentUserID, _ := userID.(uint)

	event, err := ec.service.GetEventByID(uint(id), currentUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"event": event})
}

// GetCategories retrieves all event categories
func (ec *EventController) GetCategories(c *gin.Context) {
	categories, err := ec.service.GetCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve event categories"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": categories})
}

// CreateEvent creates a new event
func (ec *EventController) CreateEvent(c *gin.Context) {
	var req models.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	event := &models.Event{
		Title:        req.Title,
		Description:  req.Description,
		Location:     req.Location,
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		ImageURL:     req.ImageURL,
		MaxAttendees: req.MaxAttendees,
	}
	newEvent, err := ec.service.CreateEvent(event, userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"event": newEvent})
}

// UpdateEvent updates an event
func (ec *EventController) UpdateEvent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}
	var req models.UpdateEventRequest
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
	updatedEvent, err := ec.service.UpdateEvent(uint(id), userID.(uint), &req, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"event": updatedEvent})
}

// DeleteEvent deletes an event
func (ec *EventController) DeleteEvent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userRole := "user"
	err = ec.service.DeleteEvent(uint(id), userID.(uint), userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

// JoinEvent handles a user joining an event
func (ec *EventController) JoinEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	err = ec.service.JoinEvent(uint(eventID), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined the event"})
}

// LeaveEvent handles a user leaving an event
func (ec *EventController) LeaveEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	err = ec.service.LeaveEvent(uint(eventID), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully left the event"})
}
